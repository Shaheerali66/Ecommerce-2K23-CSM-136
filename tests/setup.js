process.env.NODE_ENV = 'test';

const db = require('../src/db');

beforeAll(async () => {
  await db.migrate.latest();
});

afterEach(async () => {
  await db.raw('TRUNCATE TABLE skus, variants, assets, products, categories, users RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await db.destroy();
});

module.exports = { db };
