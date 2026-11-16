import { PipelineStage, Types } from 'mongoose';
import { Session, SessionStatus } from '../models/session.model';
import { Teacher } from '../models/teacher.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { getUtcDayRange } from '../utils/date';
import { CreateSessionInput } from '../validators/session.validator';

const teacherLookupStages = (): PipelineStage[] => [
  {
    $lookup: {
      from: Teacher.collection.name,
      localField: 'teacherId',
      foreignField: '_id',
      as: 'teacher',
    },
  },
  { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
];

const teacherProjection = {
  _id: '$teacher._id',
  fullName: '$teacher.fullName',
  email: '$teacher.email',
  specialization: '$teacher.specialization',
  experience: '$teacher.experience',
};

export const createSession = async (input: CreateSessionInput) => {
  const teacherExists = await Teacher.exists({ _id: input.teacherId });
  if (!teacherExists) {
    throw new AppError(404, 'Teacher not found');
  }

  return Session.create({
    teacherId: input.teacherId,
    startTime: input.startTime,
    endTime: input.endTime,
    status: SessionStatus.AVAILABLE,
    userId: null,
  });
};

/**
 * API 3 - AVAILABLE sessions that start on the given (UTC) day, with teacher details.
 */
export const getAvailableSessions = async (dateTimestamp: number) => {
  const range = getUtcDayRange(dateTimestamp);
  if (!range) {
    throw new AppError(400, 'dateTimestamp is out of range');
  }

  return Session.aggregate([
    {
      $match: {
        status: SessionStatus.AVAILABLE,
        startTime: { $gte: range.start, $lt: range.end },
      },
    },
    { $sort: { startTime: 1 } },
    ...teacherLookupStages(),
    {
      $project: {
        _id: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        teacher: teacherProjection,
      },
    },
  ]);
};

/**
 * API 4 - Book a session.
 * The status check and the update happen in one atomic operation, so two users
 * racing for the same session can never both succeed.
 */
export const bookSession = async (sessionId: string, userId: string) => {
  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new AppError(404, 'User not found');
  }

  const booked = await Session.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.AVAILABLE },
    { $set: { status: SessionStatus.BOOKED, userId } },
    { new: true },
  );
  if (booked) {
    return booked;
  }

  const existing = await Session.findById(sessionId).select('status');
  if (!existing) {
    throw new AppError(404, 'Session not found');
  }

  const message =
    existing.status === SessionStatus.BOOKED
      ? 'Session is already booked'
      : `Only AVAILABLE sessions can be booked (current status: ${existing.status})`;
  throw new AppError(409, message);
};

/**
 * API 5 - Mark a BOOKED session as COMPLETED (atomic, same reasoning as booking).
 */
export const completeSession = async (sessionId: string) => {
  const completed = await Session.findOneAndUpdate(
    { _id: sessionId, status: SessionStatus.BOOKED },
    { $set: { status: SessionStatus.COMPLETED, completedAt: new Date() } },
    { new: true },
  );
  if (completed) {
    return completed;
  }

  const existing = await Session.findById(sessionId).select('status');
  if (!existing) {
    throw new AppError(404, 'Session not found');
  }

  throw new AppError(
    409,
    `Only BOOKED sessions can be marked as completed (current status: ${existing.status})`,
  );
};

/**
 * API 6 - A user's sessions split into upcoming (BOOKED) and completed (COMPLETED).
 */
export const getUserSessions = async (userId: string) => {
  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new AppError(404, 'User not found');
  }

  // Aggregation does not cast values using the schema, so the id must be an ObjectId.
  const [result] = await Session.aggregate<{
    upcomingSessions: unknown[];
    completedSessions: unknown[];
  }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: [SessionStatus.BOOKED, SessionStatus.COMPLETED] },
      },
    },
    ...teacherLookupStages(),
    {
      $project: {
        _id: 1,
        startTime: 1,
        endTime: 1,
        status: 1,
        completedAt: 1,
        teacher: teacherProjection,
      },
    },
    {
      $facet: {
        upcomingSessions: [
          { $match: { status: SessionStatus.BOOKED } },
          { $sort: { startTime: 1 } },
        ],
        completedSessions: [
          { $match: { status: SessionStatus.COMPLETED } },
          { $sort: { completedAt: -1 } },
        ],
      },
    },
  ]);

  return {
    userId,
    upcomingSessions: result?.upcomingSessions ?? [],
    completedSessions: result?.completedSessions ?? [],
  };
};
