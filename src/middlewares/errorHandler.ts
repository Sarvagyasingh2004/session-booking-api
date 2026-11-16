import { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

interface MongoDuplicateKeyError {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isDuplicateKeyError = (error: unknown): error is MongoDuplicateKeyError =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000;

const isMalformedJsonError = (error: unknown): boolean =>
  error instanceof SyntaxError && (error as { type?: string }).type === 'entity.parse.failed';

// Express identifies error middleware by its 4-argument signature, so `_next` must stay.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, message: error.message, errors: error.details });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(error.errors).map((e) => ({ field: e.path, message: e.message })),
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({ success: false, message: `Invalid value for ${error.path}` });
    return;
  }

  if (isDuplicateKeyError(error)) {
    const fields = Object.keys(error.keyValue ?? {}).join(', ') || 'field';
    res.status(409).json({ success: false, message: `A record with this ${fields} already exists` });
    return;
  }

  if (isMalformedJsonError(error)) {
    res.status(400).json({ success: false, message: 'Malformed JSON in request body' });
    return;
  }

  console.error(error);
  res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : String((error as Error)?.message ?? error),
  });
};
