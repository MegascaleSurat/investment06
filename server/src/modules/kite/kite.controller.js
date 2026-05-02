const { asyncHandler } = require('../../core/asyncHandler');
const { BadRequestError } = require('../../core/errors/httpErrors');

const kiteService = require('./kite.service');
const tickerService = require('../../services/ticker.service');

const upsertCredentials = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new BadRequestError('Missing user in auth context');

  await kiteService.upsertCredentials(userId, req.body);
  res.status(200).json({ success: true });
});

const getLoginUrl = asyncHandler(async (_req, res) => {
  const userId = _req.user?.sub;
  if (!userId) throw new BadRequestError('Missing user in auth context');

  const url = await kiteService.getLoginUrl(userId);
  res.status(200).json({ url });
});

const handleCallback = asyncHandler(async (req, res) => {
  const requestToken = req.query.request_token;
  if (!requestToken || typeof requestToken !== 'string') {
    throw new BadRequestError('Missing request_token');
  }

  const userId = req.user?.sub;
  if (!userId) throw new BadRequestError('Missing user in auth context');

  const session = await kiteService.generateSession(userId, requestToken);
  await kiteService.upsertUserSession(userId, session);

  // Automatically connect the Ticker when a new session is established
  const creds = await kiteService.getUserKiteClient(userId, session.access_token);
  tickerService.connect(creds.apiKey, session.access_token);

  res.status(200).json({ success: true, session });
});

const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new BadRequestError('Missing user in auth context');

  const profile = await kiteService.getProfile(userId);
  res.status(200).json({ data: profile });
});

const getStatus = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new BadRequestError('Missing user in auth context');

  const status = await kiteService.getStatus(userId);

  // If we have a valid session but ticker is not connected, connect it
  if (status.valid && !tickerService.isConnected) {
    const accessToken = await kiteService.getUserAccessToken(userId);
    const { apiKey } = await kiteService.getUserKiteClient(userId, accessToken);
    tickerService.connect(apiKey, accessToken);
  }

  res.status(200).json({ data: status });
});

const disconnect = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw new BadRequestError('Missing user in auth context');

  const result = await kiteService.disconnect(userId);
  res.status(200).json(result);
});

module.exports = {
  upsertCredentials,
  getLoginUrl,
  handleCallback,
  getProfile,
  getStatus,
  disconnect
};
