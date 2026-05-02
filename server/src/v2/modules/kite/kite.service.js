// TODO: Implement V2 kite service logic
const { KiteConnect } = require("kiteconnect");

const createKiteClient = ({ apiKey, accessToken }) => {
    const kc = new KiteConnect({ api_key: apiKey });

    if (accessToken) {
        kc.setAccessToken(accessToken);
    }

    return kc;
};


const service = {
    createKiteClient
};

module.exports = service;
