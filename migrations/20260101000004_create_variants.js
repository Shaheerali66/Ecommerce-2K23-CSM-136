exports.up = function up(knex) {
  return knex.schema.createTable('variants', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();

    // e.g. {"color": "red", "size": "M"} — the specific option combination
    // this variant represents.
    table.jsonb('option_values').notNullable().defaultTo('{}');

    // Deterministic string built from option_values (sorted keys) so we can
    // enforce "no duplicate combination per product" with a plain unique
    // index instead of a functional index on JSONB.
    table.string('combo_key', 255).notNullable();

    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);

    // Enforces CAT04: a given option combination can only exist once per product.
    table.unique(['product_id', 'combo_key']);

    table
      .foreign('product_id')
      .references('id')
      .inTable('products')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('variants');
};
