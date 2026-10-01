exports.up = function up(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 120).notNullable();
    table.string('email', 160).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('phone', 30);
    // 'buyer' | 'artisan' | 'admin'
    table.string('role', 20).notNullable().defaultTo('buyer');
    table.timestamps(true, true);

    table.unique(['email']);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('users');
};
