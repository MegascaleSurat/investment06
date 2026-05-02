import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const registerSchema = z
  .object({
    full_name: z.string().min(2).max(255),
    email: z.string().email().max(255),
    phone: z.string().trim().min(7).max(20).optional().or(z.literal("")),
    password: z.string().min(8).max(200),
    confirm_password: z.string().min(8).max(200),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

export const updateProfileSchema = z
  .object({
    full_name: z.string().min(2).max(255).optional(),
    phone: z.union([z.string().trim().min(7).max(20), z.literal(""), z.null()]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" })

export const changePasswordSchema = z.object({
  old_password: z.string().min(1).max(200),
  new_password: z.string().min(8).max(200),
})
