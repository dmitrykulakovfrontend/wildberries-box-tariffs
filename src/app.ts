import knex, { migrate, seed } from "#postgres/knex.js";
import { responseSchema } from "#schemas.js";
import parseNumber from "#utils/parseNumber.js";
import axios from "axios";
import { format } from "date-fns";
// import express, { Request, Response } from "express";
import cron from "node-cron";
import { z } from "zod";
import { google } from "googleapis";
import fs from "fs";

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS!;
const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

await migrate.latest();
await seed.run();

cron.schedule("* * * * *", async () => {
    console.log("Fetching wildberries api...");
    try {
        const today = format(new Date(), "yyyy-MM-dd");
        const { data } = await axios.get(`https://common-api.wildberries.ru/api/v1/tariffs/box?date=${today}`, {
            headers: {
                "Authorization": process.env.API_KEY,
            },
        });
        const parsed = responseSchema.parse(data);
        const { dtNextBox, dtTillMax, warehouseList } = parsed.response.data;
        const sheetrows = [];
        for (const wh of warehouseList) {
            // ищем или создаём склад
            let [warehouse] = await knex("warehouses").where({ geoName: wh.geoName, warehouseName: wh.warehouseName });

            if (!warehouse) {
                const [id] = await knex("warehouses")
                    .insert({
                        geoName: wh.geoName,
                        warehouseName: wh.warehouseName,
                    })
                    .returning("id");
                warehouse = { id: id.id, geoName: wh.geoName, warehouseName: wh.warehouseName };
            }

            // вставляем тариф
            await knex("tariffs").insert({
                warehouse_id: warehouse.id,
                dtNextBox,
                dtTillMax,
                boxDeliveryBase: parseNumber(wh.boxDeliveryBase),
                boxDeliveryCoefExpr: parseNumber(wh.boxDeliveryCoefExpr),
                boxDeliveryLiter: parseNumber(wh.boxDeliveryLiter),
                boxDeliveryMarketplaceBase: parseNumber(wh.boxDeliveryMarketplaceBase),
                boxDeliveryMarketplaceCoefExpr: parseNumber(wh.boxDeliveryMarketplaceCoefExpr),
                boxDeliveryMarketplaceLiter: parseNumber(wh.boxDeliveryMarketplaceLiter),
                boxStorageBase: parseNumber(wh.boxStorageBase),
                boxStorageCoefExpr: parseNumber(wh.boxStorageCoefExpr),
                boxStorageLiter: parseNumber(wh.boxStorageLiter),
            });
        }
        console.log("Updating google tables...");
        let spreadsheets = await knex("spreadsheets");
        const tariffs = await knex("tariffs")
            .where("tariffs.createdAt", ">=", knex.raw(`NOW() - INTERVAL '30 seconds'`))
            .join("warehouses", "tariffs.warehouse_id", "warehouses.id")
            .select(
                "warehouses.geoName",
                "warehouses.warehouseName",
                "tariffs.dtNextBox",
                "tariffs.dtTillMax",
                "tariffs.createdAt",
                "tariffs.boxDeliveryBase",
                "tariffs.boxDeliveryCoefExpr",
                "tariffs.boxDeliveryLiter",
                "tariffs.boxDeliveryMarketplaceBase",
                "tariffs.boxDeliveryMarketplaceCoefExpr",
                "tariffs.boxDeliveryMarketplaceLiter",
                "tariffs.boxStorageBase",
                "tariffs.boxStorageCoefExpr",
                "tariffs.boxStorageLiter",
            )
            .orderBy("tariffs.boxDeliveryCoefExpr", "asc");

        const rows = [
            [
                "geoName",
                "warehouseName",
                "dtNextBox",
                "dtTillMax",
                "createdAt",
                "boxDeliveryBase",
                "boxDeliveryCoefExpr",
                "boxDeliveryLiter",
                "boxDeliveryMarketplaceBase",
                "boxDeliveryMarketplaceCoefExpr",
                "boxDeliveryMarketplaceLiter",
                "boxStorageBase",
                "boxStorageCoefExpr",
                "boxStorageLiter",
            ],
            ...tariffs.map((t) => [
                t.geoName,
                t.warehouseName,
                t.dtNextBox,
                t.dtTillMax,
                t.createdAt,
                t.boxDeliveryBase ?? "",
                t.boxDeliveryCoefExpr ?? "",
                t.boxDeliveryLiter ?? "",
                t.boxDeliveryMarketplaceBase ?? "",
                t.boxDeliveryMarketplaceCoefExpr ?? "",
                t.boxDeliveryMarketplaceLiter ?? "",
                t.boxStorageBase ?? "",
                t.boxStorageCoefExpr ?? "",
                t.boxStorageLiter ?? "",
            ]),
        ];
        for (const { spreadsheet_id } of spreadsheets) {
            await sheets.spreadsheets.values.clear({
                spreadsheetId: spreadsheet_id,
                range: "stocks_coefs", // лист и диапазон (начиная с A1)
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheet_id,
                range: "stocks_coefs!A1", // лист и диапазон (начиная с A1)
                valueInputOption: "USER_ENTERED",
                requestBody: {
                    values: rows,
                },
            });
        }
        console.log("Successfully finished updating google tables!");
    } catch (err) {
        if (err instanceof z.ZodError) {
            console.error("Validation failed:", err.errors);
        } else {
            console.error("Request failed:", err);
        }
        throw err;
    }
});
cron.schedule("*/30 * * * * *", async () => {});

console.log("All migrations and seeds have been run");
