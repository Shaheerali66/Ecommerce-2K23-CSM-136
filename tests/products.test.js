const request = require('supertest');
const app = require('../src/app');
const { createAdminAndToken } = require('./helpers');
const { db } = require('./setup');

async function makeCategory(token) {
  const res = await request(app).post('/api/v1/admin/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Pottery' });
  return res.body.data;
}

describe('Admin products', () => {
  it('creates a draft product with no SKU', async () => {
    const { token } = await createAdminAndToken();
    const category = await makeCategory(token);

    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Blue Pottery Vase', category_id: category.id });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
  });

  it('rejects a duplicate product slug', async () => {
    const { token } = await createAdminAndToken();
    const category = await makeCategory(token);

    await request(app).post('/api/v1/admin/products').set('Authorization', `Bearer ${token}`).send({ name: 'Vase', category_id: category.id });

    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Vase', category_id: category.id });

    expect(res.status).toBe(409);
  });

  it('refuses to publish a product with no active SKU', async () => {
    const { token } = await createAdminAndToken();
    const category = await makeCategory(token);

    const productRes = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Vase', category_id: category.id });

    const res = await request(app)
      .patch(`/api/v1/admin/products/${productRes.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PUBLISH_REQUIRES_SKU');
  });

  it('publishes a product once it has an active SKU', async () => {
    const { token } = await createAdminAndToken();
    const category = await makeCategory(token);

    const productRes = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Vase', category_id: category.id });

    await request(app)
      .post(`/api/v1/admin/products/${productRes.body.data.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'VASE-STD', price_minor_unit: 150000, stock_quantity: 5 });

    const res = await request(app)
      .patch(`/api/v1/admin/products/${productRes.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'published' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('published');
  });

  it('rejects specifications that are not a flat object', async () => {
    const { token } = await createAdminAndToken();
    const category = await makeCategory(token);

    const res = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Vase', category_id: category.id, specifications: { nested: { a: 1 } } });

    expect(res.status).toBe(422);
  });
});
