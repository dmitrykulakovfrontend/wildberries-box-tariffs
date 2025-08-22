/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    return knex.schema.createTable("tariffs", (table) => {
        table.increments("id").primary();
        table.integer("warehouse_id").unsigned().notNullable().references("id").inTable("warehouses");
        table.date("dtNextBox");
        table.date("dtTillMax");
        // delivery
        table.decimal("boxDeliveryBase", 5, 2).nullable();
        table.decimal("boxDeliveryCoefExpr", 5, 2).nullable();
        table.decimal("boxDeliveryLiter", 5, 2).nullable();

        // marketplace delivery
        table.decimal("boxDeliveryMarketplaceBase", 5, 2).nullable();
        table.decimal("boxDeliveryMarketplaceCoefExpr", 5, 2).nullable();
        table.decimal("boxDeliveryMarketplaceLiter", 5, 2).nullable();

        // storage
        table.decimal("boxStorageBase", 5, 2).nullable();
        table.decimal("boxStorageCoefExpr", 5, 2).nullable();
        table.decimal("boxStorageLiter", 5, 2).nullable();

        table.timestamp("createdAt").defaultTo(knex.fn.now());
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    return knex.schema.dropTable("tariffs");
}
