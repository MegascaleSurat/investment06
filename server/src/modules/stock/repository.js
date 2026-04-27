const { query } = require('../../db');

async function createStock(input) {
  const sql = `
    INSERT INTO stocks (symbol, name, isin, exchange, active)
    VALUES ($1, $2, $3, $4, COALESCE($5, TRUE))
    RETURNING id, symbol, name, isin, exchange, active, created_at, updated_at
  `;

  const params = [input.symbol, input.name, input.isin ?? null, input.exchange, input.active];
  const result = await query(sql, params);
  return result.rows[0];
}

async function getStockBySymbol(symbol) {
  const sql = `
    SELECT id, symbol, name, isin, exchange, active, created_at, updated_at
    FROM stocks
    WHERE symbol = $1
    LIMIT 1
  `;
  const result = await query(sql, [symbol]);
  return result.rows[0] ?? null;
}

async function listStocks({ limit, offset, active }) {
  const where = [];
  const params = [];

  if (typeof active === 'boolean') {
    params.push(active);
    where.push(`active = $${params.length}`);
  }

  params.push(limit);
  params.push(offset);

  const sql = `
    SELECT id, symbol, name, isin, exchange, active, created_at, updated_at
    FROM stocks
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY symbol ASC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `;

  const result = await query(sql, params);
  return result.rows;
}

module.exports = { createStock, getStockBySymbol, listStocks };

