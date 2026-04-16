import fs from 'fs';
import path from 'path';
import { pool } from '../db';

async function run() {
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  console.log('Found migrations:', files);
  try {
    for (const file of files) {
      const p = path.join(migrationsDir, file);
      console.log('Applying', file);
      const sql = fs.readFileSync(p, 'utf8');
      await pool.query(sql);
      console.log('Applied', file);
    }
    console.log('All migrations applied.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

run();
