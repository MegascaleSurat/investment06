const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 250 },
  removeOnComplete: { count: 10_000 },
  removeOnFail: { count: 50_000 }
};

module.exports = { defaultJobOptions };

