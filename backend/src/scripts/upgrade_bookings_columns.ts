import fs from 'fs';
import path from 'path';
import { pool } from '../db';

async function run() {
  const file = path.join(__dirname, '..', '..', 'migrations', 'upgrade_bookings_add_columns.sql');
  const sql = fs.readFileSync(file, 'utf8');
  console.log('Applying bookings upgrade...');
  try {
    await pool.query(sql);
    console.log('Bookings upgrade applied.');
    process.exit(0);
  } catch (err) {
    console.error('Bookings upgrade error', err);
    process.exit(1);
  }
}

run();
