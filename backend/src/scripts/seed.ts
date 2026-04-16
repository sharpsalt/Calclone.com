import { randomUUID as uuidv4 } from 'crypto';
import { query } from '../db';

async function seed() {
  try {
    const userId = uuidv4();
    const username = process.env.DEFAULT_USERNAME || 'srijan';
    await query('INSERT INTO users (id, username, name, timezone) VALUES ($1,$2,$3,$4) ON CONFLICT (username) DO NOTHING', [userId, username, 'Srijan Verma', Intl.DateTimeFormat().resolvedOptions().timeZone]);

    const res = await query('SELECT id FROM users WHERE username=$1', [username]);
    const uid = res.rows[0].id;

    const slug1 = '15-min-meeting';
    const slug2 = '30-min-meeting';
    const et1 = uuidv4();
    const et2 = uuidv4();
    await query(
      `INSERT INTO event_types (id, user_id, title, description, duration_minutes, slug, host_name, host_timezone, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (slug) DO NOTHING`,
      [et1, uid, '15 min meeting', 'A quick 15-minute call to connect.', 15, slug1, 'Srijan Verma', Intl.DateTimeFormat().resolvedOptions().timeZone, true]
    );
    await query(
      `INSERT INTO event_types (id, user_id, title, description, duration_minutes, slug, host_name, host_timezone, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (slug) DO NOTHING`,
      [et2, uid, '30 min meeting', 'A 30-minute discussion session.', 30, slug2, 'Srijan Verma', Intl.DateTimeFormat().resolvedOptions().timeZone, true]
    );

    // Resolve the actual event_type ids in case the rows already existed (ON CONFLICT DO NOTHING keeps existing ids)
    const etRes1 = await query('SELECT id FROM event_types WHERE slug=$1', [slug1]);
    const etRes2 = await query('SELECT id FROM event_types WHERE slug=$1', [slug2]);
    const etId1 = etRes1.rows[0] && etRes1.rows[0].id;
    const etId2 = etRes2.rows[0] && etRes2.rows[0].id;
    if (!etId1 || !etId2) {
      throw new Error('Failed to resolve event_type ids after insert');
    }

    const scheduleId = uuidv4();
    await query(
      `INSERT INTO availability_schedules (id, user_id, name, timezone, is_default)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT DO NOTHING`,
      [scheduleId, uid, 'Working Hours', Intl.DateTimeFormat().resolvedOptions().timeZone, true]
    );

    for (let d = 1; d <= 5; d++) {
      const id = uuidv4();
      await query(
        `INSERT INTO availability_time_ranges (id, schedule_id, day_of_week, start_time, end_time)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT DO NOTHING`,
        [id, scheduleId, d, '09:00', '17:00']
      );
    }

    const booking1 = uuidv4();
    await query(
      `INSERT INTO bookings (id, event_type_id, schedule_id, date, start_time, end_time, booker_name, booker_email, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT DO NOTHING`,
      [booking1, etId1, scheduleId, '2026-04-15', '10:00', '10:15', 'Srijan Verma', 'srijan@example.com', 'upcoming']
    );

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

seed();
