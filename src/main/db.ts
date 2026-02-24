import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function getDbPath() {
  const root = app.getPath('userData');
  fs.mkdirSync(root, { recursive: true });
  return path.join(root, 're-renta.sqlite');
}

export function initDb() {
  if (db) return db;
  db = new Database(getDbPath());
  db.pragma('foreign_keys = ON');
  const sql = fs.readFileSync(path.resolve(process.cwd(), 'migrations/001_initial.sql'), 'utf8');
  db.exec(sql);
  return db;
}

export function isFirstRun() {
  const database = initDb();
  const row = database.prepare('SELECT setup_complete FROM app_settings WHERE id = 1').get() as { setup_complete: number };
  return row.setup_complete === 0;
}
