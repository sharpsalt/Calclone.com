import request from 'supertest';
import app from '../server';

describe('Event Types API', () => {
  it('GET /api/event-types responds with array', async () => {
    const res = await request(app).get('/api/event-types');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('POST /api/event-types creates a new event type', async () => {
    const slug = `test-${Date.now()}`;
    const payload = { title: 'Test Event', description: 'desc', duration_minutes: 45, slug };
    const res = await request(app).post('/api/event-types').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe(payload.title);
    expect(res.body.duration_minutes).toBe(payload.duration_minutes);
    expect(res.body.slug).toBe(payload.slug);
  });
});
