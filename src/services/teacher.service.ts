import { Teacher } from '../models/teacher.model';
import { CreateTeacherInput } from '../validators/teacher.validator';

export const createTeacher = async (input: CreateTeacherInput) => {
  return Teacher.create(input);
};
