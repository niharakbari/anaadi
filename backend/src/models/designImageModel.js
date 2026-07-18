const db = require("../config/database");

async function create(imageData, connection = db) {

    const sql = `
        INSERT INTO design_images (
            original_filename,
            stored_filename,
            file_path,
            file_size,
            mime_type,
            image_width,
            image_height
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(sql, [
        imageData.original_filename,
        imageData.stored_filename,
        imageData.file_path,
        imageData.file_size,
        imageData.mime_type,
        imageData.image_width,
        imageData.image_height,
    ]);

    return result.insertId;
}

async function findById(id) {
  const sql = `
    SELECT *
    FROM design_images
    WHERE id = ?
  `;

  const [rows] = await db.execute(sql, [id]);

  return rows[0];
}

async function findAll() {
  const sql = `
    SELECT *
    FROM design_images
    ORDER BY uploaded_at DESC
  `;

  const [rows] = await db.query(sql);

  return rows;
}

async function findAllPaginated({ page = 1, limit = 10, search = "" }) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  let whereClauses = [];
  let params = [];

  if (search && search.trim() !== "") {
    whereClauses.push("(original_filename LIKE ? OR stored_filename LIKE ?)");
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countSql = `SELECT COUNT(*) AS total FROM design_images ${whereSql}`;
  const [countRows] = await db.query(countSql, params);
  const totalItems = countRows[0] ? countRows[0].total : 0;
  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  const dataSql = `
    SELECT *
    FROM design_images
    ${whereSql}
    ORDER BY uploaded_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await db.query(dataSql, [...params, limitNum, offset]);

  return {
    rows,
    totalItems,
    totalPages,
    currentPage: pageNum,
    limit: limitNum,
  };
}

async function update(id, imageData) {
  const sql = `
    UPDATE design_images
    SET
      original_filename = ?,
      stored_filename = ?,
      file_path = ?,
      file_size = ?,
      mime_type = ?,
      image_width = ?,
      image_height = ?
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [
    imageData.original_filename,
    imageData.stored_filename,
    imageData.file_path,
    imageData.file_size,
    imageData.mime_type,
    imageData.image_width,
    imageData.image_height,
    id,
  ]);

  return result.affectedRows;
}

async function remove(id) {
  const sql = `
    DELETE FROM design_images
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [id]);

  return result.affectedRows;
}

async function exists(id) {
  const sql = `
    SELECT EXISTS(
      SELECT 1
      FROM design_images
      WHERE id = ?
    ) AS exists_flag
  `;

  const [rows] = await db.execute(sql, [id]);

  return Boolean(rows[0].exists_flag);
}

async function findByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const sql = `
    SELECT *
    FROM design_images
    WHERE id IN (?)
  `;
  const [rows] = await db.query(sql, [ids]);
  return rows;
}

module.exports = {
  create,
  findById,
  findByIds,
  findAll,
  findAllPaginated,
  update,
  remove,
  exists,
};