const db = require('./src/config/database.js');
async function run() {
  const [rows] = await db.query('SELECT * FROM search_history ORDER BY created_at DESC LIMIT 5');
  console.log(rows);
  process.exit(0);
}
run();
