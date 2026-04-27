const { z } = require('zod');

const sectorPingSchema = z.object({}).strict();

module.exports = { sectorPingSchema };

