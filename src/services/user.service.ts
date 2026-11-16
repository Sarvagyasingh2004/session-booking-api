import { User } from '../models/user.model';
import { CreateUserInput } from '../validators/user.validator';

export const createUser = async (input: CreateUserInput) => {
  // Duplicate emails are rejected by the unique index and mapped to 409 by the error handler.
  return User.create(input);
};
