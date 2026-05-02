const { KiteConnect } = require('kiteconnect');

/**
 * Initialize Kite client with API Key and Access Token
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.accessToken
 * @returns {KiteConnect}
 */
function getKiteClient({ apiKey, accessToken }) {
  const kc = new KiteConnect({ api_key: apiKey });
  kc.setAccessToken(accessToken);
  return kc;
}

/**
 * Fetch user profile from Zerodha
 * @param {Object} brokerAccount 
 * @returns {Promise<Object>}
 */
async function fetchUserProfile(brokerAccount) {
  const kc = getKiteClient({
    apiKey: brokerAccount.api_key,
    accessToken: brokerAccount.access_token
  });
  return await kc.getProfile();
}

module.exports = {
  fetchUserProfile,
  getKiteClient
};
