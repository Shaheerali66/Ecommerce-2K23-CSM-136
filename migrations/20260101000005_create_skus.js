exports.up = function up(knex) {
  return knex.schema.createTable('skus', (table) => {
    table.increments('id').primary();
    table.integer('variant_id').unsigned().notNullable();

    table.string('code', 64).notNullable();

    // Price stored as an integer in minor currency units (e.g. paisa) to
    // avoid floating-point money errors. 250000 == PKR 2,500.00.
    table.integer('price_minor_unit').notNullable();
    table.string('currency', 3).notNullable().defaultTo('PKR');

    table.integer('stock_quantity').notNullable().defaultTo(0);
    table.boolean('is_active').notNullable().defaultTo(true);

    table.timestamps(true, true);

    table.unique(['code']);
    table.index(['variant_id']);

    table
      .foreign('variant_id')
      .references('id')
      .inTable('variants')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Enforces "stock quantity must not become negative".
    table.check('?? >= 0', ['stock_quantity'], 'skus_stock_quantity_non_negative');
    table.check('?? > 0', ['price_minor_unit'], 'skus_price_positive');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('skus');
};
