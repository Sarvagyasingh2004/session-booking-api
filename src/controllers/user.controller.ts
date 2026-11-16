import { Request, Response } from 'express';
import * as sessionService from '../services/session.service';
import * as userService from '../services/user.service';
import { idParamSchema } from '../validators/common.validator';
import { createUserSchema } from '../validators/user.validator';

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const input = createUserSchema.parse(req.body);
  const user = await userService.createUser(input);
  res.status(201).json({ success: true, message: 'User created', data: user });
};

export const getUserSessions = async (req: Request, res: Response): Promise<void> => {
  const { id } = idParamSchema.parse(req.params);
  const data = await sessionService.getUserSessions(id);
  res.status(200).json({ success: true, data });
};
