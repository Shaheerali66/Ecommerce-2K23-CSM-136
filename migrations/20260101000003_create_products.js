exports.up = function up(knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.integer('category_id').unsigned().notNullable();
    // author/owner artisan (extends Sprint 1 USERS/ARTISANS concept)
    table.integer('artisan_user_id').unsigned().nullable();

    table.string('name', 180).notNullable();
    table.string('slug', 200).notNullable();
    table.text('description');

    // 'draft' | 'published' | 'archived'
    table.string('status', 20).notNullable().defaultTo('draft');

    // Chosen approach for Section 5 "Specification" requirement:
    // validated JSONB on the product row rather than a separate EAV table
    // (see docs/SPRINT_2.md, "Specifications" decision, for the validation rule).
    table.jsonb('specifications').notNullable().defaultTo('{}');

    table.timestamps(true, true);

    table.unique(['slug']);
    table.index(['category_id']);
    table.index(['status']);

    table
      .foreign('category_id')
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    table
      .foreign('artisan_user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('products');
};
