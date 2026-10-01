const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { db } = require('./setup');

async function createAdmin() {
  const password_hash = await bcrypt.hash('Admin@123', 10);
  return db('users').insert({ name: 'Admin', email: 'admin@test.com', password_hash, role: 'admin' }).returning('*');
}

describe('POST /api/v1/auth/login', () => {
  it('returns a token for valid admin credentials', async () => {
    await createAdmin();

    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('rejects an incorrect password', async () => {
    await createAdmin();

    const res = await request(app).post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a missing email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ password: 'whatever' });
    expect(res.status).toBe(422);
  });
});
