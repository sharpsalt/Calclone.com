import request from 'supertest';
import app from '../server';

describe('Core Platform Endpoints', () => {
  it('GET /api/health returns dependency checks', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 500]).toContain(res.status);
    expect(res.body).toHaveProperty('checks');
    expect(res.body).toHaveProperty('ok');
  });

  it('GET /health returns req_id header and body field', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.body.req_id).toBeDefined();
  });

  it('GET /api/bookings/slots returns computed slots', async () => {
    const events = await request(app).get('/api/event-types');
    expect(events.status).toBe(200);
    const eventTypeId = events.body[0].id;

    const res = await request(app).get('/api/bookings/slots').query({
      event_type_id: eventTypeId,
      date: '2026-04-15',
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(String(res.headers['cache-control'] || '')).toContain('public');
  });

  it('GET /api/event-types/slug/:slug returns cacheable public response', async () => {
    const events = await request(app).get('/api/event-types');
    expect(events.status).toBe(200);
    const slug = events.body[0].slug;

    const res = await request(app).get(`/api/event-types/slug/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(slug);
    expect(String(res.headers['cache-control'] || '')).toContain('public');
  });

  it('GET /api/event-types/public/:username returns cacheable public profile', async () => {
    const username = process.env.DEFAULT_USERNAME || 'srijan';
    const res = await request(app).get(`/api/event-types/public/${username}`);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe(username);
    expect(Array.isArray(res.body.event_types)).toBe(true);
    expect(String(res.headers['cache-control'] || '')).toContain('stale-while-revalidate');
  });

  it('GET /api/v1/event-types uses versioned alias', async () => {
    const res = await request(app).get('/api/v1/event-types');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
