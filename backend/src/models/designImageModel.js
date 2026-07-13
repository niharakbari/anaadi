const db = require("../config/database");

async function create(imageData, connection = db.promise()) {

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

  const [rows] = await db.promise().execute(sql, [id]);

  return rows[0];
}

async function findAll() {
  const sql = `
    SELECT *
    FROM design_images
    ORDER BY uploaded_at DESC
  `;

  const [rows] = await db.promise().query(sql);

  return rows;
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

  const [result] = await db.promise().execute(sql, [
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

  const [result] = await db.promise().execute(sql, [id]);

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

  const [rows] = await db.promise().execute(sql, [id]);

  return Boolean(rows[0].exists_flag);
}

module.exports = {
  create,
  findById,
  findAll,
  update,
  remove,
  exists,
};