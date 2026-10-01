const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./setup');

async function createAdminAndToken() {
  const password_hash = await bcrypt.hash('Admin@123', 10);
  const [user] = await db('users')
    .insert({ name: 'Admin', email: `admin${Date.now()}@test.com`, password_hash, role: 'admin' })
    .returning('*');

  const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '1h',
  });

  return { user, token };
}

module.exports = { createAdminAndToken };
