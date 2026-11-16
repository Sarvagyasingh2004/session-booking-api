import { Router } from 'express';
import * as teacherController from '../controllers/teacher.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/', asyncHandler(teacherController.createTeacher));

export default router;
