const { asyncHandler } = require('../../core/asyncHandler');
const service = require('./service');
const { BadRequestError } = require('../../core/errors/httpErrors');

const createWatchlist = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new BadRequestError('User not authenticated');
  
  const watchlist = await service.createWatchlist(userId, req.body);
  res.status(201).json({ data: watchlist });
});

const getWatchlists = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new BadRequestError('User not authenticated');

  const watchlists = await service.getWatchlists(userId);
  res.status(200).json({ data: watchlists });
});

const addItem = asyncHandler(async (req, res) => {
  const { watchlistId } = req.params;
  const { symbolId } = req.body;
  if (!symbolId) throw new BadRequestError('Missing symbolId');

  await service.addItem(watchlistId, symbolId);
  res.status(200).json({ success: true });
});

const removeItem = asyncHandler(async (req, res) => {
  const { watchlistId, symbolId } = req.params;
  await service.removeItem(watchlistId, symbolId);
  res.status(200).json({ success: true });
});

const deleteWatchlist = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  const { watchlistId } = req.params;
  await service.deleteWatchlist(watchlistId, userId);
  res.status(200).json({ success: true });
});

module.exports = {
  createWatchlist,
  getWatchlists,
  addItem,
  removeItem,
  deleteWatchlist
};
