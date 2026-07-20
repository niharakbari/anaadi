const db = require("./src/config/database");

async function initDB() {
  const sql = `
    CREATE TABLE IF NOT EXISTS saved_searches (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      search_history_id INT NOT NULL,
      design_image_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(255) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      FOREIGN KEY (search_history_id) REFERENCES search_history(id) ON DELETE CASCADE,
      FOREIGN KEY (design_image_id) REFERENCES design_images(id) ON DELETE CASCADE
    )
  `;

  try {
    await db.query(sql);
    console.log("Table saved_searches created successfully.");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    process.exit(0);
  }
}

initDB();
