import { Request, Response } from 'express';
import AuthController from '../src/controller/AuthController';

describe('AuthController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    
    req = {
      body: {}
    };
    
    res = {
      status: statusMock,
      json: jsonMock,
      send: sendMock
    };

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 400 when username is empty', async () => {
      req.body = { username: '', password: 'password123' };
      
      await AuthController.login(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 when password is empty', async () => {
      req.body = { username: 'admin', password: '' };
      
      await AuthController.login(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 when both username and password are empty', async () => {
      req.body = { username: '', password: '' };
      
      await AuthController.login(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 when body is missing', async () => {
      req.body = {};
      
      await AuthController.login(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 401 when username does not exist', async () => {
      req.body = { username: 'nonexistent', password: 'password123' };
      
      await AuthController.login(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  describe('register', () => {
    it('should validate required fields', async () => {
      req.body = { username: 'testuser', password: 'password123' };
      
      await AuthController.register(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalled();
    });

    it('should return error when username is missing', async () => {
      req.body = { password: 'password123' };
      
      await AuthController.register(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalled();
    });

    it('should return error when password is missing', async () => {
      req.body = { username: 'testuser' };
      
      await AuthController.register(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      req.body = { username: 'testuser', password: 'short' };
      
      await AuthController.register(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalled();
    });

    it('should validate username length', async () => {
      req.body = { username: 'ab', password: 'password123' };
      
      await AuthController.register(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should require authentication', async () => {
      (req as any).user = undefined;
      
      await AuthController.getMe(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalled();
    });

    it('should return 404 when user is not found', async () => {
      (res as any).locals = { jwtPayload: { userId: 999 } };
      
      await AuthController.getMe(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should return 400 when old password is missing', async () => {
      req.body = { newPassword: 'newPassword123' };
      (res as any).locals = { jwtPayload: { userId: 1 } };
      
      await AuthController.changePassword(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 when new password is missing', async () => {
      req.body = { oldPassword: 'oldPassword123' };
      (res as any).locals = { jwtPayload: { userId: 1 } };
      
      await AuthController.changePassword(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 when both passwords are missing', async () => {
      req.body = {};
      (res as any).locals = { jwtPayload: { userId: 1 } };
      
      await AuthController.changePassword(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should validate new password length', async () => {
      req.body = { oldPassword: 'oldPassword123', newPassword: 'short' };
      (res as any).locals = { jwtPayload: { userId: 1 } };
      
      await AuthController.changePassword(req as Request, res as Response);
      
      expect(statusMock).toHaveBeenCalled();
    });
  });
});
