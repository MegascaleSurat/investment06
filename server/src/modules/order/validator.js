const { z } = require('zod');

const orderPingSchema = z.object({}).strict();

module.exports = { orderPingSchema };

