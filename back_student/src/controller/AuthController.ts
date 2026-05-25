import {validate} from 'class-validator';
import {Request, Response} from 'express';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/datasource';
import config from '../config/config';
import {User} from '../entity/User';

class AuthController {

  public static register = async (req: Request, res: Response) => {
    const {username, password} = req.body;
    const user = new User();
    user.username = username;
    user.password = password;
    user.role = "NORMAL";

    // Validate if the parameters are ok
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }

    // Hash the password, to securely store on DB
    user.hashPassword();

    // Try to save. If fails, the username is already in use
    const userRepository = AppDataSource.getRepository(User);
    try {
      await userRepository.save(user);
    } catch (e) {
      res.status(409).send('username already in use');
      return;
    }

    // If all ok, send 201 response
    res.status(201).send('User created');
  };

  public static login = async (req: Request, res: Response) => {
    const {username, password} = req.body;
    if (!(username && password)) {
      res.status(400).send('Body was empty');
      return;
    }
    
    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    let user: User | null;
    try {
      user = await userRepository.findOneBy({
        username,
      });
    } catch (error) {
      res.status(401).send('username or password incorrect');
      return;
    }
    
    if (!user) {
      res.status(401).send('username or password incorrect');
      return;
    }
    
    // Check if encrypted password match
    if (!user.checkIfUnencryptedPasswordIsValid(password)) {
      res.status(401).send('username or password incorrect');
      return;
    }

    // Sign JWT, valid for 1 hour
    const token = jwt.sign(
      {userId: user.id, username: user.username},
      config.jwtSecret,
      {expiresIn: '1h'},
    );
    res.send({token});
  };

  public static getMe = async (req: Request, res: Response) => {
    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    let user: User | null;
    try {
      user = await userRepository.findOneBy({
        id: res.locals.jwtPayload.userId,
      });
      
      if (!user) {
        res.status(404).send('User not found');
        return;
      }
      
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.send({ user: userWithoutPassword });
    } catch (error) {
      res.status(404).send('User not found');
      return;
    }
  };

  public static changePassword = async (req: Request, res: Response) => {
    // Get ID from JWT
    const id = res.locals.jwtPayload.userId;

    // Get parameters from the body
    const {oldPassword, newPassword} = req.body;
    if (!(oldPassword && newPassword)) {
      res.status(400).send('Old and new passwords are required');
      return;
    }

    // Get user from the database
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

    // Check if old password matches
    if (!user.checkIfUnencryptedPasswordIsValid(oldPassword)) {
      res.status(401).send('Current password is incorrect');
      return;
    }

    // Validate the model (password length)
    user.password = newPassword;
    const errors = await validate(user);
    if (errors.length > 0) {
      res.status(400).send(errors);
      return;
    }
    
    // Hash the new password and save
    user.hashPassword();
    await userRepository.save(user);

    res.status(204).send();
  };
}
export default AuthController;
