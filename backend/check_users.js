const db = require("./src/config/database");
async function check() {
  const [cols] = await db.query("SHOW COLUMNS FROM users");
  console.log("users:", cols);
  process.exit(0);
}
check();
