const db = require('./src/config/database.js');

async function run() {
  const [rows] = await db.query('SELECT original_filename, stored_filename FROM design_images LIMIT 20');
  console.log(rows);
  process.exit(0);
}

run();
