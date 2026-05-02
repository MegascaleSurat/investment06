const repository = require('./repository');

async function createWatchlist(userId, { name, isDefault }) {
  return repository.createWatchlist(userId, name, isDefault);
}

async function getWatchlists(userId) {
  const watchlists = await repository.getWatchlistsByUserId(userId);
  
  // For each watchlist, fetch its items
  const populatedWatchlists = await Promise.all(
    watchlists.map(async (wl) => {
      const items = await repository.getWatchlistItems(wl.id);
      return { ...wl, items };
    })
  );
  
  return populatedWatchlists;
}

async function addItem(watchlistId, symbolId) {
  return repository.addItemToWatchlist(watchlistId, symbolId);
}

async function removeItem(watchlistId, symbolId) {
  return repository.removeItemFromWatchlist(watchlistId, symbolId);
}

async function deleteWatchlist(watchlistId, userId) {
  return repository.deleteWatchlist(watchlistId, userId);
}

module.exports = {
  createWatchlist,
  getWatchlists,
  addItem,
  removeItem,
  deleteWatchlist
};
