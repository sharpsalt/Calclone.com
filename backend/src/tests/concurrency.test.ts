import { createBooking } from '../services/bookingsService';
import { query, pool } from '../db';

describe('Booking concurrency', () => {
  const eventTypeId = 'ae3c86a3-55b5-4e41-8d61-bee31b01a292';
  const date = '2026-04-20';
  const startTime = '09:00';

  beforeEach(async () => {
    await query('DELETE FROM bookings WHERE event_type_id=$1 AND date=$2 AND start_time=$3', [eventTypeId, date, startTime]);
  });

  afterAll(async () => {
    // close DB pool to allow Jest to exit cleanly
    try {
      await pool.end();
    } catch {}
  });

  it('allows only one booking for the same slot under concurrent requests', async () => {
    const p1 = createBooking({ event_type_id: eventTypeId, date, start_time: startTime, booker_name: 'C1', booker_email: 'c1@example.com' });
    const p2 = createBooking({ event_type_id: eventTypeId, date, start_time: startTime, booker_name: 'C2', booker_email: 'c2@example.com' });

    const results = await Promise.allSettled([p1, p2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const rej = rejected[0] as PromiseRejectedResult;
    // Should be a conflict
    expect(String(rej.reason?.message || rej.reason || '')).toMatch(/slot|taken|booked/i);
  }, 10000);
});
