const { fetchUserProfile } = require('../services/zerodha.service');
const { query } = require('../db/query');

/**
 * Get the logged-in user's Zerodha profile
 */
async function getProfile(req, res) {
  try {
    const userId = req.user.sub;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: User ID missing' });
    }
    req.log.info({ userId }, 'Fetching Zerodha profile for user');
    console.log("---------------------------------", userId)

    // 1. Try to fetch from the new user_broker_accounts table
    let result = await query(
      `SELECT api_key, api_secret, access_token, public_token 
       FROM user_broker_accounts 
       WHERE user_id = $1 AND broker = 'zerodha' 
       LIMIT 1`,
      [userId]
    );

    let account;

    if (result.rows.length) {
      account = result.rows[0];
    } else {
      // 2. Fallback: Try to fetch from legacy kite_credentials and kite_sessions
      const credsResult = await query(
        `SELECT api_key, api_secret_encrypted FROM kite_credentials WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (credsResult.rows.length) {
        req.log.info('Found legacy Kite credentials');
        const sessionResult = await query(
          `SELECT access_token, public_token FROM kite_sessions WHERE user_id = $1 LIMIT 1`,
          [userId]
        );

        if (sessionResult.rows.length) {
          req.log.info('Found legacy Kite session');
          const { decrypt } = require('../utils/crypto');
          account = {
            api_key: credsResult.rows[0].api_key,
            api_secret: decrypt(credsResult.rows[0].api_secret_encrypted),
            access_token: sessionResult.rows[0].access_token,
            public_token: sessionResult.rows[0].public_token
          };
        } else {
          req.log.warn('Legacy credentials found but NO session found');
        }
      } else {
        req.log.warn('No legacy Kite credentials found');
      }
    }
    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Zerodha account not connected. Please connect your broker first.'
      });
    }

    if (!account.access_token) {
      return res.status(400).json({
        status: 'error',
        message: 'Zerodha access token missing. Please login to Zerodha.'
      });
    }

    const profile = await fetchUserProfile({
      api_key: account.api_key,
      access_token: account.access_token,
    });
    console.log("-------------------", profile)

    return res.json({
      status: 'success',
      data: profile
    });
  } catch (err) {
    req.log.error(err, 'Failed to fetch Zerodha profile');

    // Handle specific Kite errors if needed
    if (err.status === 'error' && err.error_type === 'TokenException') {
      return res.status(401).json({
        status: 'error',
        message: 'Zerodha session expired. Please reconnect.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch Zerodha profile'
    });
  }
}

module.exports = {
  getProfile,
};
