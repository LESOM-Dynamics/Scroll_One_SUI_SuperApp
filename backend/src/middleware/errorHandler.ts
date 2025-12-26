import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { createErrorResponse } from '../utils/responses';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Error handler', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle known AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      createErrorResponse(err.code, err.message, err.details)
    );
    return;
  }

  // Database errors
  if (err.name === 'QueryError' || err.name === 'DatabaseError') {
    res.status(500).json(
      createErrorResponse('DATABASE_ERROR', 'Database operation failed')
    );
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json(
      createErrorResponse('VALIDATION_ERROR', err.message)
    );
    return;
  }

  // Default error
  res.status(500).json(
    createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
  );
}

