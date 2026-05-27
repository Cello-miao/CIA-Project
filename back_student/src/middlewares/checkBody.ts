import {NextFunction, Request, Response} from 'express';

export const validateEmpty = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (
    req.body === undefined ||
    req.body.username === undefined ||
    req.body.password === undefined ||
    req.body.username === '' ||
    req.body.password === ''
  ) {
    return res.status(400).send('Invalid request body');
  }
  // if string value is longer than 0, continue with next function in route
  next();
};
