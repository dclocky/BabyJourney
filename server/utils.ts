import { AuthenticatedRequest } from './types';
import { ZodError } from 'zod';

export function getAuthenticatedUser(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user;
}

export function handleError(err: unknown): { message: string; statusCode: number } {
  if (err instanceof ZodError) {
    return {
      message: err.errors.map(e => e.message).join(', '),
      statusCode: 400
    };
  }
  
  if (err instanceof Error) {
    return {
      message: err.message,
      statusCode: 500
    };
  }
  
  return {
    message: 'An unknown error occurred',
    statusCode: 500
  };
}