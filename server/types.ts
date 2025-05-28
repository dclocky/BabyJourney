import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: User;
  isAuthenticated(): boolean;
}

export type RouteHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;