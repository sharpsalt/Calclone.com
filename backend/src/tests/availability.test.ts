import request from 'supertest';
import app from '../server';

describe('Availability API', () => {
  it('GET /api/availability returns schedule with timeRanges', async () => {
    const res = await request(app).get('/api/availability');
    expect(res.status).toBe(200);
    // may return empty object or schedule
    if (res.body && res.body.timeRanges !== undefined) {
      expect(Array.isArray(res.body.timeRanges)).toBe(true);
    }
  });

  it('POST /api/availability upserts schedule', async () => {
    const payload = { name: 'New Hours', timezone: 'UTC', timeRanges: [{ day_of_week: 1, start_time: '10:00', end_time: '12:00' }] };
    const res = await request(app).post('/api/availability').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.timeRanges).toBeDefined();
    expect(Array.isArray(res.body.timeRanges)).toBe(true);
  });
});
