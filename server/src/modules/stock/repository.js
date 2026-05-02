const { query } = require('../../db');

async function createStock(input) {
  const sql = `
    INSERT INTO stocks (symbol, name, isin, exchange, status, is_tradeable)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, symbol, name, isin, exchange, status, is_tradeable, created_at, updated_at
  `;

  const status = input.active === false ? 'INACTIVE' : 'ACTIVE';
  const is_tradeable = input.active !== false;
  
  const params = [input.symbol, input.name, input.isin ?? null, input.exchange, status, is_tradeable];
  const result = await query(sql, params);
  return result.rows[0];
}

async function getStockBySymbol(symbol) {
  const sql = `
    SELECT id, symbol, name, isin, exchange, status, is_tradeable, created_at, updated_at
    FROM stocks
    WHERE symbol = $1
    LIMIT 1
  `;
  const result = await query(sql, [symbol]);
  return result.rows[0] ?? null;
}

async function listStocks({ limit, offset, active, search }) {
  const where = ["s.deleted_at IS NULL"];
  const params = [];

  if (typeof active === 'boolean') {
    params.push(active ? 'ACTIVE' : 'INACTIVE');
    where.push(`s.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(s.symbol ILIKE $${params.length} OR s.name ILIKE $${params.length})`);
  }

  params.push(limit);
  params.push(offset);

  const sql = `
    SELECT 
      s.id as stock_id, 
      s.symbol, 
      s.name, 
      s.exchange, 
      s.status, 
      s.is_tradeable,
      ss.id as symbol_id,
      ss.instrument_token
    FROM stocks s
    JOIN stock_symbols ss ON s.id = ss.stock_id
    WHERE ${where.join(' AND ')}
    ORDER BY s.symbol ASC
    LIMIT $${params.length - 1}
    OFFSET $${params.length}
  `;

  const result = await query(sql, params);
  return result.rows;
}

module.exports = { createStock, getStockBySymbol, listStocks };

