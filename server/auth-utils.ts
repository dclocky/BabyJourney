import { AuthenticatedRequest } from './types';
import { Response } from 'express';

export function requireAuth(req: AuthenticatedRequest, res: Response): boolean {
  if (!req.user || !req.isAuthenticated()) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }
  return true;
}

export function getUserId(req: AuthenticatedRequest): number {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user.id;
}

export function handleError(err: unknown, res: Response): void {
  console.error('Route error:', err);
  
  if (err instanceof Error) {
    if (err.message.includes('validation')) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(500).json({ error: 'Unknown error occurred' });
  }
}