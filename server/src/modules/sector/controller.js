const { asyncHandler } = require('../../core/asyncHandler');

const ping = asyncHandler(async (_req, res) => {
  res.status(200).json({ data: { domain: 'sector', status: 'ok' } });
});

module.exports = { ping };

