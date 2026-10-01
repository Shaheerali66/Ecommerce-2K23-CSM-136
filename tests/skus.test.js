const request = require('supertest');
const app = require('../src/app');
const { createAdminAndToken } = require('./helpers');

async function makeProduct(token) {
  const categoryRes = await request(app).post('/api/v1/admin/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Textiles' });
  const productRes = await request(app)
    .post('/api/v1/admin/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ajrak Shawl', category_id: categoryRes.body.data.id });
  return productRes.body.data;
}

describe('Admin SKUs', () => {
  it('creates a SKU and its variant together from option_values', async () => {
    const { token } = await createAdminAndToken();
    const product = await makeProduct(token);

    const res = await request(app)
      .post(`/api/v1/admin/products/${product.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'Small', color: 'Red' }, code: 'AJRAK-S-RED', price_minor_unit: 250000, stock_quantity: 10 });

    expect(res.status).toBe(201);
    expect(res.body.data.sku.code).toBe('AJRAK-S-RED');
    expect(res.body.data.variant.product_id).toBe(product.id);
  });

  it('reuses the same variant for a repeated option combination', async () => {
    const { token } = await createAdminAndToken();
    const product = await makeProduct(token);

    const first = await request(app)
      .post(`/api/v1/admin/products/${product.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'Small', color: 'Red' }, code: 'AJRAK-S-RED', price_minor_unit: 250000 });

    const second = await request(app)
      .post(`/api/v1/admin/products/${product.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ variant_id: first.body.data.variant.id, code: 'AJRAK-S-RED-2', price_minor_unit: 260000 });

    expect(second.status).toBe(201);
    expect(second.body.data.variant.id).toBe(first.body.data.variant.id);
  });

  it('rejects a duplicate SKU code', async () => {
    const { token } = await createAdminAndToken();
    const product = await makeProduct(token);

    await request(app)
      .post(`/api/v1/admin/products/${product.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'Small' }, code: 'AJRAK-S', price_minor_unit: 250000 });

    const res = await request(app)
      .post(`/api/v1/admin/products/${product.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'Large' }, code: 'AJRAK-S', price_minor_unit: 260000 });

    expect(res.status).toBe(409);
  });

  it('rejects a negative stock_quantity at the API layer', async () => {
    const { token } = await createAdminAndToken();
    const product = await makeProduct(token);

    const res = await request(app)
      .post(`/api/v1/admin/products/${product.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'Small' }, code: 'AJRAK-S', price_minor_unit: 250000, stock_quantity: -5 });

    expect(res.status).toBe(422);
  });

  it('rejects negative stock at the database layer even if validation is bypassed', async () => {
    const { token } = await createAdminAndToken();
    const product = await makeProduct(token);

    const createRes = await request(app)
      .post(`/api/v1/admin/products/${product.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'Small' }, code: 'AJRAK-S', price_minor_unit: 250000, stock_quantity: 0 });

    const { db } = require('./setup');
    await expect(db('skus').where({ id: createRes.body.data.sku.id }).update({ stock_quantity: -1 })).rejects.toThrow();
  });

  it('updates SKU price and stock', async () => {
    const { token } = await createAdminAndToken();
    const product = await makeProduct(token);

    const createRes = await request(app)
      .post(`/api/v1/admin/products/${product.id}/skus`)
      .set('Authorization', `Bearer ${token}`)
      .send({ option_values: { size: 'Small' }, code: 'AJRAK-S', price_minor_unit: 250000, stock_quantity: 10 });

    const res = await request(app)
      .patch(`/api/v1/admin/skus/${createRes.body.data.sku.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ price_minor_unit: 275000, stock_quantity: 20 });

    expect(res.status).toBe(200);
    expect(res.body.data.price_minor_unit).toBe(275000);
    expect(res.body.data.stock_quantity).toBe(20);
  });
});
