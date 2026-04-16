import request from 'supertest';
import app from '../server';

describe('Bookings API', () => {
  it('can create a booking and prevents double booking', async () => {
    // get an event type
    const etRes = await request(app).get('/api/event-types');
    expect(etRes.status).toBe(200);
    const et = etRes.body[0];
    expect(et).toBeDefined();

    const payload = { event_type_id: et.id, date: '2026-04-20', start_time: '09:00', booker_name: 'Tester', booker_email: 'tester@example.com' };
    const res = await request(app).post('/api/bookings').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.event_type_id).toBe(et.id);

    // attempt duplicate
    const dup = await request(app).post('/api/bookings').send(payload);
    expect([409, 500]).toContain(dup.status);
  });

  it('deduplicates retry with same idempotency key', async () => {
    const etRes = await request(app).get('/api/event-types');
    expect(etRes.status).toBe(200);
    const et = etRes.body[0];

    const key = `idem-${Date.now()}`;
    const payload = {
      event_type_id: et.id,
      date: '2026-04-22',
      start_time: '11:00',
      booker_name: 'Retry User',
      booker_email: 'retry@example.com',
    };

    const first = await request(app).post('/api/bookings').set('Idempotency-Key', key).send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/bookings').set('Idempotency-Key', key).send(payload);
    expect(second.status).toBe(201);
    expect(second.body.id).toBe(first.body.id);
  });

  it('rejects idempotency key reuse with different payload', async () => {
    const etRes = await request(app).get('/api/event-types');
    expect(etRes.status).toBe(200);
    const et = etRes.body[0];

    const key = `idem-mismatch-${Date.now()}`;
    const firstPayload = {
      event_type_id: et.id,
      date: '2026-04-23',
      start_time: '13:00',
      booker_name: 'Mismatch User',
      booker_email: 'mismatch@example.com',
    };

    const secondPayload = {
      ...firstPayload,
      start_time: '14:00',
    };

    const first = await request(app).post('/api/bookings').set('Idempotency-Key', key).send(firstPayload);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/bookings').set('Idempotency-Key', key).send(secondPayload);
    expect(second.status).toBe(409);
  });

  it('returns paginated bookings payload', async () => {
    const res = await request(app).get('/api/bookings').query({ status: 'all', page: 1, page_size: 10 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.page).toBe(1);
    expect(res.body.page_size).toBe(10);
  });
});
