const { query } = require('../../db/query');

async function getAllSectors() {
  const sql = `
    SELECT 
      s.*, 
      (SELECT count(*) FROM stocks WHERE sector_id = s.id) as stock_count
    FROM sectors s
    ORDER BY s.name ASC
  `;
  const result = await query(sql);
  return result.rows;
}

async function getStocksBySector(sectorId) {
  const sql = `
    SELECT 
      s.id as stock_id,
      s.symbol,
      s.name,
      s.exchange,
      ss.id as symbol_id,
      ss.instrument_token
    FROM stocks s
    JOIN stock_symbols ss ON s.id = ss.stock_id
    WHERE s.sector_id = $1 AND s.deleted_at IS NULL
  `;
  const result = await query(sql, [sectorId]);
  return result.rows;
}

async function updateStockSector(stockId, sectorId) {
  const sql = `
    UPDATE stocks SET sector_id = $2, updated_at = NOW() 
    WHERE id = $1
    RETURNING *
  `;
  const result = await query(sql, [stockId, sectorId]);
  return result.rows[0];
}

module.exports = {
  getAllSectors,
  getStocksBySector,
  updateStockSector
};
