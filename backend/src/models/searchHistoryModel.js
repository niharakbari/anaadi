const db = require("../config/database");

async function saveSearchHistory(userId, imageDetails, results) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const sqlHistory = `
      INSERT INTO search_history (
        user_id,
        query_image_original_name,
        query_image_stored_name,
        query_image_path,
        total_results
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    const [historyResult] = await connection.execute(sqlHistory, [
      userId,
      imageDetails.originalName || null,
      imageDetails.storedName || null,
      imageDetails.path || null,
      results.length
    ]);
    
    const searchHistoryId = historyResult.insertId;
    
    if (results && results.length > 0) {
      const sqlResults = `
        INSERT INTO search_history_results (
          search_history_id,
          design_image_id,
          result_rank,
          similarity_score
        ) VALUES ?
      `;
      
      const values = results.map((r, idx) => [
        searchHistoryId,
        r.imageId,
        idx + 1,
        r.similarityScore
      ]);
      
      await connection.query(sqlResults, [values]);
    }
    
    await connection.commit();
    return searchHistoryId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getSearchHistoryByUserId(userId, page = 1, limit = 10) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;
  
  const countSql = `SELECT COUNT(*) AS total FROM search_history WHERE user_id = ?`;
  const [countRows] = await db.query(countSql, [userId]);
  const totalItems = countRows[0] ? countRows[0].total : 0;
  const totalPages = Math.ceil(totalItems / limitNum) || 1;
  
  const historySql = `
    SELECT * FROM search_history
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [historyRows] = await db.query(historySql, [userId, limitNum, offset]);
  
  if (historyRows.length === 0) {
    return { rows: [], totalItems, totalPages, currentPage: pageNum, limit: limitNum };
  }
  
  const historyIds = historyRows.map(row => row.id);
  
  const resultsSql = `
    SELECT shr.*, di.original_filename, di.stored_filename, di.file_path, di.file_size, di.mime_type
    FROM search_history_results shr
    LEFT JOIN design_images di ON shr.design_image_id = di.id
    WHERE shr.search_history_id IN (?)
    ORDER BY shr.search_history_id DESC, shr.result_rank ASC
  `;
  
  const [resultRows] = await db.query(resultsSql, [historyIds]);
  
  // Group results by history id
  const resultsByHistoryId = {};
  for (const row of resultRows) {
    if (!resultsByHistoryId[row.search_history_id]) {
      resultsByHistoryId[row.search_history_id] = [];
    }
    resultsByHistoryId[row.search_history_id].push({
      imageId: String(row.design_image_id),
      similarityScore: parseFloat(row.similarity_score),
      sku: 'SKU-' + String(row.design_image_id).padStart(4, '0'),
      title: row.original_filename ? row.original_filename.replace(/\.[^/.]+$/, "") : "Unknown Design",
      image: row.stored_filename ? `/uploads/design_library/${row.stored_filename}` : null
    });
  }
  
  const mappedRows = historyRows.map(row => ({
    id: 'Q-' + String(row.id).padStart(4, '0'),
    dbId: row.id,
    query: row.query_image_original_name || 'image',
    type: 'Image search',
    match: resultsByHistoryId[row.id]?.[0]?.sku || null,
    similarity: resultsByHistoryId[row.id]?.[0] ? resultsByHistoryId[row.id][0].similarityScore / 100 : 0,
    time: row.created_at,
    query_image_path: row.query_image_path,
    query_image_original_name: row.query_image_original_name,
    search_history_results: resultsByHistoryId[row.id] || []
  }));
  
  return {
    rows: mappedRows,
    totalItems,
    totalPages,
    currentPage: pageNum,
    limit: limitNum,
  };
}

async function clearSearchHistoryByUserId(userId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const [historyRows] = await connection.query(`SELECT id FROM search_history WHERE user_id = ?`, [userId]);
    const historyIds = historyRows.map(r => r.id);
    
    if (historyIds.length > 0) {
      await connection.query(`DELETE FROM search_history_results WHERE search_history_id IN (?)`, [historyIds]);
      await connection.query(`DELETE FROM search_history WHERE user_id = ?`, [userId]);
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  saveSearchHistory,
  getSearchHistoryByUserId,
  clearSearchHistoryByUserId
};
