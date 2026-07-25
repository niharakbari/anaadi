const db = require('./src/config/database.js');
async function run() {
  const [rows] = await db.query('SELECT original_filename FROM design_images');
  console.log("Total DB images:", rows.length);
  const sample = rows.map(r => r.original_filename).join('\n');
  const fs = require('fs');
  fs.writeFileSync('db_filenames.txt', sample);
  process.exit(0);
}
run();
