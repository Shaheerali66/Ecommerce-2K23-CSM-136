// Asset upload is explicitly out of scope for Sprint 2 (see Sprint 2 manual,
// Section 2). This migration only establishes the table shape required by
// Section 5 ("Required data model") so Sprint 3 can build on it without a
// breaking schema change.

exports.up = function up(knex) {
  return knex.schema.createTable('assets', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().nullable();
    table.integer('variant_id').unsigned().nullable();

    table.string('storage_key', 500).notNullable();
    // 'primary' | 'gallery' | 'thumbnail'
    table.string('role', 20).notNullable().defaultTo('gallery');
    table.string('alt_text', 255);
    table.integer('sort_order').notNullable().defaultTo(0);

    table.timestamps(true, true);

    table
      .foreign('product_id')
      .references('id')
      .inTable('products')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table
      .foreign('variant_id')
      .references('id')
      .inTable('variants')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // An asset must belong to at least one of product/variant.
    table.check(
      '?? IS NOT NULL OR ?? IS NOT NULL',
      ['product_id', 'variant_id'],
      'assets_owner_required'
    );
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('assets');
};
