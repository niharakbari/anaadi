const db = require("./src/config/database");

async function check() {
  const [cols1] = await db.query("SHOW COLUMNS FROM search_history");
  console.log("search_history:", cols1);
  const [cols2] = await db.query("SHOW COLUMNS FROM search_history_results");
  console.log("search_history_results:", cols2);
  process.exit(0);
}
check();
