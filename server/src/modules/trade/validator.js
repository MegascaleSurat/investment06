const { z } = require('zod');

const tradePingSchema = z.object({}).strict();

module.exports = { tradePingSchema };

