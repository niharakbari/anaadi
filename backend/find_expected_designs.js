const db = require('./src/config/database.js');
const fs = require('fs');
const path = require('path');

async function run() {
  const [rows] = await db.query('SELECT original_filename, stored_filename FROM design_images');
  
  const queryImages = fs.readdirSync('uploads/query_uploads').filter(f => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));
  
  console.log(`Found ${queryImages.length} images in uploads/query_uploads`);
  
  for (const queryImg of queryImages) {
    console.log(queryImg);
  }
  
  process.exit(0);
}

run();
