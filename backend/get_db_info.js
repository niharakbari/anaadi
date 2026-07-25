const db = require('./src/config/database.js');
async function run() {
  const [rows] = await db.query('SELECT original_filename, stored_filename FROM design_images LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}
run();
