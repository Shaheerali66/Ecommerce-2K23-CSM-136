exports.up = function up(knex) {
  return knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.integer('parent_id').unsigned().nullable();
    table.string('name', 120).notNullable();
    table.string('slug', 140).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);

    table.unique(['slug']);
    table
      .foreign('parent_id')
      .references('id')
      .inTable('categories')
      // Categories are never hard-deleted (only deactivated), so RESTRICT
      // is a safety net: it should never actually fire in normal use.
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('categories');
};
