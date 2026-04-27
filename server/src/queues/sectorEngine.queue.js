const { Queue } = require('bullmq');

const { connection } = require('./connection');
const { defaultJobOptions } = require('./defaults');

const SECTOR_ENGINE_QUEUE = 'sector-engine';

const sectorEngineQueue = new Queue(SECTOR_ENGINE_QUEUE, { connection, defaultJobOptions });

async function enqueueSectorEngine(name, data, opts) {
  return sectorEngineQueue.add(name, data, opts);
}

module.exports = { SECTOR_ENGINE_QUEUE, sectorEngineQueue, enqueueSectorEngine };
