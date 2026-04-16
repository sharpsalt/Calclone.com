import fs from 'fs';
import path from 'path';
import { pool } from '../db';

async function run() {
  const file = path.join(__dirname, '..', '..', 'migrations', 'backfill_event_types_host_fields.sql');
  const sql = fs.readFileSync(file, 'utf8');
  console.log('Applying backfill: event_types host fields...');
  try {
    await pool.query(sql);
    console.log('Backfill applied.');
    process.exit(0);
  } catch (err) {
    console.error('Backfill error', err);
    process.exit(1);
  }
}

run();
