import {NextFunction, Request, Response} from 'express';
import { AppDataSource } from '../config/datasource';

import {User} from '../entity/User';

export const checkRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Get the user ID from previous middleware
    const id = res.locals.jwtPayload.userId;

    // Get user role from the database
    const userRepository = AppDataSource.getRepository(User);
    let user: User | null;
    try {
      user = await userRepository.findOneBy({ id });
    } catch (error) {
      res.status(401).send('Unauthorized');
      return;
    }
    
    if (!user) {
      res.status(401).send('Unauthorized');
      return;
    }

    // Check if array of authorized roles includes the user's role
    if (roles.indexOf(user.role) > -1) {
      next();
    } else {
      res.status(401).send('Insufficient permissions');
    }
  };
};
