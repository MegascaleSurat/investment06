const { z } = require('zod');

const enginePingSchema = z.object({}).strict();

module.exports = { enginePingSchema };

