import { z } from 'zod';
import { isoDateTimeSchema, objectIdSchema } from './common.validator';

export const createSessionSchema = z
  .object({
    teacherId: objectIdSchema,
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema,
  })
  .refine((data) => data.endTime.getTime() > data.startTime.getTime(), {
    message: 'endTime must be greater than startTime',
    path: ['endTime'],
  });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const availableSessionsQuerySchema = z.object({
  dateTimestamp: z.coerce
    .number({ invalid_type_error: 'dateTimestamp must be a numeric Unix timestamp' })
    .int('dateTimestamp must be an integer')
    .positive('dateTimestamp must be a positive Unix timestamp'),
});

export const bookSessionSchema = z.object({
  userId: objectIdSchema,
});
