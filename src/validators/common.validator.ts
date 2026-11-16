import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid 24-character ObjectId');

export const idParamSchema = z.object({ id: objectIdSchema });

// ISO 8601 date-time string, e.g. 2026-11-20T10:00:00Z or 2026-11-20T15:30:00+05:30
export const isoDateTimeSchema = z
  .string({ required_error: 'Required', invalid_type_error: 'Must be an ISO 8601 date-time string' })
  .datetime({ offset: true, message: 'Must be an ISO 8601 date-time string' })
  .transform((value) => new Date(value));
