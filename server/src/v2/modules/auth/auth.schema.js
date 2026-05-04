const { z } = require("zod");

const generateSessionSchema = z.object({
    request_token: z.string(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});


module.exports = {
    generateSessionSchema,
    loginSchema
};