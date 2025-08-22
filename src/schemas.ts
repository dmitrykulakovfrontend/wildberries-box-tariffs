import { z } from "zod";

export const warehouseSchema = z.object({
    boxDeliveryBase: z.string().optional(),
    boxDeliveryCoefExpr: z.string().optional(),
    boxDeliveryLiter: z.string().optional(),
    boxDeliveryMarketplaceBase: z.string().optional(),
    boxDeliveryMarketplaceCoefExpr: z.string().optional(),
    boxDeliveryMarketplaceLiter: z.string().optional(),
    boxStorageBase: z.string().optional(),
    boxStorageCoefExpr: z.string().optional(),
    boxStorageLiter: z.string().optional(),
    geoName: z.string(),
    warehouseName: z.string(),
});

export const responseSchema = z.object({
    response: z.object({
        data: z.object({
            dtNextBox: z.string(),
            dtTillMax: z.string(),
            warehouseList: z.array(warehouseSchema),
        }),
    }),
});

export type ResponseType = z.infer<typeof responseSchema>;
