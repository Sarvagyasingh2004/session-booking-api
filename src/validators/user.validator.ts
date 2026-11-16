import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{7,20}$/, 'Must be a valid phone number'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
