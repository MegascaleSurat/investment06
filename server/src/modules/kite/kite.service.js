const { KiteConnect } = require('kiteconnect');

const { env } = require('../../config');
const { BadRequestError, ForbiddenError } = require('../../core/errors/httpErrors');
const { query } = require('../../db/query');
const { decrypt, encrypt } = require('../../utils/crypto');

async function getUserKiteClient(userId, accessToken = null) {
  const result = await query(
    `SELECT api_key, api_secret_encrypted FROM kite_credentials WHERE user_id = $1`,
    [userId]
  );

  if (!result.rows.length) throw new BadRequestError('Kite credentials not found. Save API key/secret first.');

  const creds = result.rows[0];
  const apiSecret = decrypt(creds.api_secret_encrypted);

  const kc = new KiteConnect({
    api_key: creds.api_key
  });

  if (accessToken) kc.setAccessToken(accessToken);

  return { kc, apiSecret, apiKey: creds.api_key };
}

async function upsertCredentials(userId, { apiKey, apiSecret }) {
  const api_secret_encrypted = encrypt(apiSecret);

  await query(
    `
    INSERT INTO kite_credentials (user_id, api_key, api_secret_encrypted)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET
      api_key = EXCLUDED.api_key,
      api_secret_encrypted = EXCLUDED.api_secret_encrypted,
      updated_at = NOW();
  `,
    [userId, apiKey, api_secret_encrypted]
  );

  // Invalidate any existing session because credentials have changed.
  await query(`DELETE FROM kite_sessions WHERE user_id = $1`, [userId]);
}

async function getLoginUrl(userId) {
  const { kc } = await getUserKiteClient(userId);
  return kc.getLoginURL();
}

async function generateSession(userId, requestToken) {
  if (!requestToken) throw new BadRequestError('Missing request_token');
  const { kc, apiSecret } = await getUserKiteClient(userId);
  const data = await kc.generateSession(requestToken, apiSecret);
  console.log("-----------------------------------")
  console.log(data)
  console.log("-----------------------------------")
  return data;
}

async function upsertUserSession(userId, session) {
  const creds = await query(`SELECT api_key FROM kite_credentials WHERE user_id = $1`, [userId]);
  const apiKey = creds.rows[0]?.api_key;
  if (!apiKey) throw new BadRequestError('Kite credentials not found. Save API key/secret first.');

  await query(
    `
    INSERT INTO kite_sessions (user_id, access_token, public_token, api_key)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET
      access_token = EXCLUDED.access_token,
      public_token = EXCLUDED.public_token,
      api_key = EXCLUDED.api_key,
      updated_at = NOW();
  `,
    [userId, session.access_token, session.public_token ?? null, apiKey]
  );
}

async function getUserAccessToken(userId) {
  const result = await query(`SELECT access_token FROM kite_sessions WHERE user_id = $1`, [userId]);
  return result.rows[0]?.access_token ?? null;
}

async function ensureValidSession(userId) {
  const accessToken = await getUserAccessToken(userId);
  if (!accessToken) throw new BadRequestError('Kite not connected');

  const { kc } = await getUserKiteClient(userId, accessToken);
  try {
    await kc.getProfile();
    return accessToken;
  } catch (err) {
    throw new ForbiddenError('Kite session expired. Please reconnect by logging in again.', {
      reconnect: true
    });
  }
}

async function getProfile(userId) {
  const accessToken = await ensureValidSession(userId);
  const { kc } = await getUserKiteClient(userId, accessToken);
  return kc.getProfile();
}

async function getStatus(userId) {
  const accessToken = await getUserAccessToken(userId);
  if (!accessToken) return { connected: false, valid: false };

  const { kc } = await getUserKiteClient(userId, accessToken);
  try {
    await kc.getProfile();
    return { connected: true, valid: true };
  } catch {
    return { connected: true, valid: false };
  }
}

async function disconnect(userId) {
  await query(`DELETE FROM kite_sessions WHERE user_id = $1`, [userId]);
  return { success: true };
}

module.exports = {
  getUserKiteClient,
  getLoginUrl,
  generateSession,
  upsertCredentials,
  upsertUserSession,
  getProfile,
  getStatus,
  getUserAccessToken,
  disconnect
};
