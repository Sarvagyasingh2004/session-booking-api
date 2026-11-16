import { z } from 'zod';

export const createTeacherSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.string().trim().toLowerCase().email('Must be a valid email address'),
  specialization: z.string().trim().min(1, 'specialization is required'),
  experience: z.number({ invalid_type_error: 'experience must be a number (years)' }).min(0),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
