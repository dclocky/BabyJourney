import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

export interface AuthenticatedRequest extends Request {
  user?: User;
  isAuthenticated(): boolean;
  login(user: User, callback: (err?: any) => void): void;
  logout(callback?: (err?: any) => void): void;
}

export type RouteHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;