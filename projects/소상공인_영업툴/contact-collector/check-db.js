const sqlite3 = require('better-sqlite3');
const db = new sqlite3('./prisma/dev.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables);
} catch (e) {
  console.error('Error:', e.message);
}
db.close();
