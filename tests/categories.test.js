const request = require('supertest');
const app = require('../src/app');
const { createAdminAndToken } = require('./helpers');

describe('Admin categories', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/v1/admin/categories');
    expect(res.status).toBe(401);
  });

  it('creates a category with a unique slug', async () => {
    const { token } = await createAdminAndToken();

    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pottery' });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('pottery');
  });

  it('rejects a duplicate category slug', async () => {
    const { token } = await createAdminAndToken();

    await request(app).post('/api/v1/admin/categories').set('Authorization', `Bearer ${token}`).send({ name: 'Pottery' });

    const res = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pottery' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
  });

  it('prevents a category from becoming its own ancestor', async () => {
    const { token } = await createAdminAndToken();

    const parentRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Handicrafts' });

    const childRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Textiles', parent_id: parentRes.body.data.id });

    // Try to make the parent a child of its own child -> cycle.
    const cycleRes = await request(app)
      .patch(`/api/v1/admin/categories/${parentRes.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parent_id: childRes.body.data.id });

    expect(cycleRes.status).toBe(422);
    expect(cycleRes.body.error.code).toBe('CYCLIC_CATEGORY');
  });

  it('deactivates a category without deleting it', async () => {
    const { token } = await createAdminAndToken();

    const createRes = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Jewelry' });

    const res = await request(app)
      .patch(`/api/v1/admin/categories/${createRes.body.data.id}/deactivate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_active).toBe(false);
  });
});
