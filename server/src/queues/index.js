const { marketEngineQueue, MARKET_ENGINE_QUEUE } = require('./marketEngine.queue');
const { sectorEngineQueue, SECTOR_ENGINE_QUEUE } = require('./sectorEngine.queue');
const { tradeEngineQueue, TRADE_ENGINE_QUEUE } = require('./tradeEngine.queue');

module.exports = {
  queues: {
    [MARKET_ENGINE_QUEUE]: marketEngineQueue,
    [SECTOR_ENGINE_QUEUE]: sectorEngineQueue,
    [TRADE_ENGINE_QUEUE]: tradeEngineQueue
  },
  marketEngineQueue,
  sectorEngineQueue,
  tradeEngineQueue
};

