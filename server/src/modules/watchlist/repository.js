const { query } = require('../../db/query');

async function createWatchlist(userId, name, isDefault = false) {
  const sql = `
    INSERT INTO watchlists (user_id, name, is_default)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await query(sql, [userId, name, isDefault]);
  return result.rows[0];
}

async function getWatchlistsByUserId(userId) {
  const sql = `
    SELECT * FROM watchlists 
    WHERE user_id = $1 AND deleted_at IS NULL
    ORDER BY is_default DESC, name ASC
  `;
  const result = await query(sql, [userId]);
  return result.rows;
}

async function getWatchlistItems(watchlistId) {
  const sql = `
    SELECT 
      wi.id as item_id,
      ss.id as symbol_id,
      ss.trading_symbol,
      ss.instrument_token,
      s.name as stock_name,
      s.exchange
    FROM watchlist_items wi
    JOIN stock_symbols ss ON wi.symbol_id = ss.id
    JOIN stocks s ON ss.stock_id = s.id
    WHERE wi.watchlist_id = $1
  `;
  const result = await query(sql, [watchlistId]);
  return result.rows;
}

async function addItemToWatchlist(watchlistId, symbolId) {
  const sql = `
    INSERT INTO watchlist_items (watchlist_id, symbol_id)
    VALUES ($1, $2)
    ON CONFLICT (watchlist_id, symbol_id) DO NOTHING
    RETURNING *
  `;
  const result = await query(sql, [watchlistId, symbolId]);
  return result.rows[0];
}

async function removeItemFromWatchlist(watchlistId, symbolId) {
  const sql = `
    DELETE FROM watchlist_items 
    WHERE watchlist_id = $1 AND symbol_id = $2
  `;
  await query(sql, [watchlistId, symbolId]);
}

async function deleteWatchlist(watchlistId, userId) {
  const sql = `
    UPDATE watchlists SET deleted_at = NOW() 
    WHERE id = $1 AND user_id = $2
  `;
  await query(sql, [watchlistId, userId]);
}

module.exports = {
  createWatchlist,
  getWatchlistsByUserId,
  getWatchlistItems,
  addItemToWatchlist,
  removeItemFromWatchlist,
  deleteWatchlist
};
