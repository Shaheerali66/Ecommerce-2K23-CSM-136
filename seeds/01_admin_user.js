const bcrypt = require('bcryptjs');

exports.seed = async function seed(knex) {
  await knex('users').where({ email: 'admin@kaarigar.pk' }).del();

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await knex('users').insert({
    name: 'Kaarigar Admin',
    email: 'admin@kaarigar.pk',
    password_hash: passwordHash,
    role: 'admin',
  });
};
