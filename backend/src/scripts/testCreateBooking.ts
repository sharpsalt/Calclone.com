import { createBooking } from '../services/bookingsService';

(async () => {
  try {
    const payload = {
      event_type_id: 'ae3c86a3-55b5-4e41-8d61-bee31b01a292',
      date: '2026-04-17',
      start_time: '09:00',
      booker_name: 'Tester A',
      booker_email: 'a@example.com',
    } as any;

    console.log('Creating booking...');
    const res = await createBooking(payload);
    console.log('Created:', res);
    process.exit(0);
  } catch (err) {
    console.error('Error creating booking:', err);
    process.exit(1);
  }
})();
