import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { authRouter } from './auth';
import { dashboardRouter } from './dashboard';
import {usersRouter} from './users';
import { clubsRouter } from './clubs';
import { studentsRouter } from './students';
import { attendanceRouter } from './attendance';
import { sessionsRouter } from './sessions';
import { inngestRouter } from './inngest';
import { contactRouter } from './contact';

export const appRouter = createTRPCRouter({
  inngest: inngestRouter,
  auth: authRouter,
  dashboard: dashboardRouter,
  users: usersRouter,
  clubs: clubsRouter,
  students: studentsRouter,
  attendance: attendanceRouter,
  sessions: sessionsRouter,
  contact: contactRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;