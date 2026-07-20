const db = require("./src/config/database");

async function check() {
  const [rows] = await db.query("SELECT * FROM search_history");
  console.log("Data:", rows);
  process.exit(0);
}
check();
