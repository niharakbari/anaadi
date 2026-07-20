const db = require("../config/database");

async function saveSearch(userId, { searchHistoryId, designImageId, name, dealerName, notes }) {
  const sql = `
    INSERT INTO saved_searches (user_id, search_history_id, design_image_id, name, dealer_name, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(sql, [userId, searchHistoryId, designImageId, name, dealerName || null, notes || null]);
  return result.insertId;
}

async function getSavedSearchesByUserId(userId, searchStr = "") {
  let whereClauses = ["ss.user_id = ?"];
  let params = [userId];

  if (searchStr && searchStr.trim() !== "") {
    whereClauses.push("(ss.name LIKE ? OR ss.notes LIKE ? OR ss.dealer_name LIKE ?)");
    params.push(`%${searchStr.trim()}%`, `%${searchStr.trim()}%`, `%${searchStr.trim()}%`);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  const sql = `
    SELECT 
      ss.id, ss.name, ss.dealer_name, ss.notes, ss.created_at,
      sh.query_image_path, sh.query_image_original_name,
      di.id AS design_image_id, di.stored_filename, di.original_filename, di.file_path, di.mime_type
    FROM saved_searches ss
    JOIN search_history sh ON ss.search_history_id = sh.id
    JOIN design_images di ON ss.design_image_id = di.id
    ${whereSql}
    ORDER BY ss.created_at DESC
  `;

  const [rows] = await db.query(sql, params);
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    dealerName: row.dealer_name,
    notes: row.notes,
    createdAt: row.created_at,
    queryImage: {
      path: row.query_image_path,
      originalName: row.query_image_original_name
    },
    designImage: {
      id: String(row.design_image_id),
      sku: 'SKU-' + String(row.design_image_id).padStart(4, '0'),
      title: row.original_filename ? row.original_filename.replace(/\.[^/.]+$/, "") : "Unknown Design",
      path: row.stored_filename ? `/uploads/design_library/${row.stored_filename}` : null
    }
  }));
}

async function updateSavedSearch(id, userId, { name, dealerName, notes }) {
  const sql = `
    UPDATE saved_searches
    SET name = ?, dealer_name = ?, notes = ?
    WHERE id = ? AND user_id = ?
  `;
  const [result] = await db.execute(sql, [name, dealerName || null, notes || null, id, userId]);
  return result.affectedRows > 0;
}

async function deleteSavedSearch(id, userId) {
  const sql = `
    DELETE FROM saved_searches
    WHERE id = ? AND user_id = ?
  `;
  const [result] = await db.execute(sql, [id, userId]);
  return result.affectedRows > 0;
}

module.exports = {
  saveSearch,
  getSavedSearchesByUserId,
  updateSavedSearch,
  deleteSavedSearch
};
