const { z } = require('zod');

const registerSchema = z.object({
  full_name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  phone: z.string().trim().min(7).max(20).optional(),
  password: z.string().min(8).max(200)
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200)
});

const updateProfileSchema = z
  .object({
    full_name: z.string().min(2).max(255).optional(),
    phone: z.string().trim().min(7).max(20).nullable().optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' });

const changePasswordSchema = z.object({
  old_password: z.string().min(1).max(200),
  new_password: z.string().min(8).max(200)
});

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
  role: z.enum(['ADMIN', 'USER', 'SUB_ADMIN']).optional()
});

const userIdParamsSchema = z.object({
  id: z.string().uuid()
});

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'])
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  userIdParamsSchema,
  updateUserStatusSchema
};

