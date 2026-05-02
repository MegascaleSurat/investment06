const { KiteConnect } = require('kiteconnect');
const { query } = require('../db/query');
const { closeDb } = require('../db');
const tickerService = require('../services/ticker.service');
const kiteService = require('../modules/kite/kite.service');

async function syncInstruments(userId) {
  try {
    console.log(`Starting instrument sync for user: ${userId}`);
    
    // 1. Ensure we have a Zerodha broker in the DB
    const brokerResult = await query(
      `INSERT INTO brokers (name, code, api_base_url, api_version) 
       VALUES ('Zerodha', 'ZERODHA', 'https://api.kite.trade', '3') 
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`
    );
    const brokerId = brokerResult.rows[0].id;
    console.log(`Broker ID: ${brokerId}`);

    // 2. Get Kite instance
    const accessToken = await kiteService.getUserAccessToken(userId);
    if (!accessToken) {
      throw new Error('No active Kite session found for user');
    }
    const { kc } = await kiteService.getUserKiteClient(userId, accessToken);

    // 3. Fetch instruments
    console.log('Fetching instruments from Zerodha (this may take a minute)...');
    const instruments = await kc.getInstruments(['NSE']); // Fetch only NSE for now to keep it small
    console.log(`Fetched ${instruments.length} NSE instruments`);

    // 4. Sync to DB (Sync more equities to ensure popular stocks are included)
    const filtered = instruments.filter(i => i.instrument_type === 'EQ').slice(0, 3000);
    console.log(`Syncing ${filtered.length} equities...`);

    for (const inst of filtered) {
      // Create/Update Stock
      const stockResult = await query(
        `INSERT INTO stocks (symbol, name, exchange, isin, instrument_type, segment)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (symbol, exchange) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [inst.tradingsymbol, inst.name, inst.exchange, inst.isin, 'EQUITY', 'CASH']
      );
      const stockId = stockResult.rows[0].id;

      // Create/Update Symbol
      await query(
        `INSERT INTO stock_symbols (stock_id, broker_id, trading_symbol, instrument_token, exchange_token)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (broker_id, trading_symbol) DO UPDATE SET instrument_token = EXCLUDED.instrument_token
        `,
        [stockId, brokerId, inst.tradingsymbol, inst.instrument_token.toString(), inst.exchange_token?.toString()]
      );
    }

    console.log('Sync completed successfully!');
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

// Allow running from CLI with userId
if (require.main === module) {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Please provide a userId');
    process.exit(1);
  }
  syncInstruments(userId).then(() => closeDb());
}

module.exports = { syncInstruments };
