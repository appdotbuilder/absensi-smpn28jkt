
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { db } from './db';
import { usersTable } from './db/schema';
import { eq } from 'drizzle-orm';

// Import schemas
import {
  loginInputSchema,
  createUserInputSchema,
  updateUserInputSchema,
  createTeacherInputSchema,
  updateTeacherInputSchema,
  bulkImportTeachersInputSchema,
  createStudentInputSchema,
  updateStudentInputSchema,
  bulkImportStudentsInputSchema,
  createDutyScheduleInputSchema,
  createAttendanceRecordInputSchema,
  updateAttendanceRecordInputSchema,
  attendanceReportQuerySchema
} from './schema';

// Import handlers
import { login, validateSession } from './handlers/auth';
import { createUser, updateUser, deleteUser, getUsers, getUserById } from './handlers/user_management';
import { 
  createTeacher, 
  updateTeacher, 
  deleteTeacher, 
  getTeachers, 
  getTeacherById, 
  bulkImportTeachers, 
  exportTeachers 
} from './handlers/teacher_management';
import { 
  createStudent, 
  updateStudent, 
  deleteStudent, 
  getStudents, 
  getStudentById, 
  getStudentsByFloor, 
  bulkImportStudents, 
  exportStudents 
} from './handlers/student_management';
import { 
  createDutySchedule, 
  getDutySchedulesByTeacher, 
  getDutyScheduleById, 
  deleteDutySchedule 
} from './handlers/duty_schedule';
import { 
  createAttendanceRecord, 
  updateAttendanceRecord, 
  getAttendanceByDutySchedule, 
  deleteAttendanceRecord, 
  generateAttendanceReport, 
  getAttendanceSummary 
} from './handlers/attendance';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  
  validateSession: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => validateSession(input.userId)),

  // User management (Admin only)
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  
  deleteUser: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteUser(input.id)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  getUserById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getUserById(input.id)),

  // Teacher management
  createTeacher: publicProcedure
    .input(createTeacherInputSchema)
    .mutation(({ input }) => createTeacher(input)),
  
  updateTeacher: publicProcedure
    .input(updateTeacherInputSchema)
    .mutation(({ input }) => updateTeacher(input)),
  
  deleteTeacher: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteTeacher(input.id)),
  
  getTeachers: publicProcedure
    .query(() => getTeachers()),
  
  getTeacherById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getTeacherById(input.id)),
  
  bulkImportTeachers: publicProcedure
    .input(bulkImportTeachersInputSchema)
    .mutation(({ input }) => bulkImportTeachers(input)),
  
  exportTeachers: publicProcedure
    .query(() => exportTeachers()),

  // Student management
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),
  
  updateStudent: publicProcedure
    .input(updateStudentInputSchema)
    .mutation(({ input }) => updateStudent(input)),
  
  deleteStudent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteStudent(input.id)),
  
  getStudents: publicProcedure
    .query(() => getStudents()),
  
  getStudentById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getStudentById(input.id)),
  
  getStudentsByFloor: publicProcedure
    .input(z.object({ floor: z.string() }))
    .query(({ input }) => getStudentsByFloor(input.floor)),
  
  bulkImportStudents: publicProcedure
    .input(bulkImportStudentsInputSchema)
    .mutation(({ input }) => bulkImportStudents(input)),
  
  exportStudents: publicProcedure
    .query(() => exportStudents()),

  // Duty schedule management
  createDutySchedule: publicProcedure
    .input(createDutyScheduleInputSchema)
    .mutation(({ input }) => createDutySchedule(input)),
  
  getDutySchedulesByTeacher: publicProcedure
    .input(z.object({ teacherId: z.number() }))
    .query(({ input }) => getDutySchedulesByTeacher(input.teacherId)),
  
  getDutyScheduleById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getDutyScheduleById(input.id)),
  
  deleteDutySchedule: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteDutySchedule(input.id)),

  // Attendance management
  createAttendanceRecord: publicProcedure
    .input(createAttendanceRecordInputSchema)
    .mutation(({ input }) => createAttendanceRecord(input)),
  
  updateAttendanceRecord: publicProcedure
    .input(updateAttendanceRecordInputSchema)
    .mutation(({ input }) => updateAttendanceRecord(input)),
  
  getAttendanceByDutySchedule: publicProcedure
    .input(z.object({ dutyScheduleId: z.number() }))
    .query(({ input }) => getAttendanceByDutySchedule(input.dutyScheduleId)),
  
  deleteAttendanceRecord: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteAttendanceRecord(input.id)),
  
  generateAttendanceReport: publicProcedure
    .input(attendanceReportQuerySchema)
    .mutation(({ input }) => generateAttendanceReport(input)),
  
  getAttendanceSummary: publicProcedure
    .input(z.object({ dutyScheduleId: z.number() }))
    .query(({ input }) => getAttendanceSummary(input.dutyScheduleId)),
});

export type AppRouter = typeof appRouter;

async function seedUsers() {
  console.log('Starting user seeding...');

  // Check for admin user
  const adminUser = await db.select().from(usersTable).where(eq(usersTable.username, 'admin')).execute();
  if (adminUser.length === 0) {
    console.log('Creating admin user...');
    await createUser({
      username: 'admin',
      password: 'password123',
      role: 'admin'
    });
    console.log('Admin user created.');
  } else {
    console.log('Admin user already exists.');
  }

  // Check for teacher user
  const teacherUser = await db.select().from(usersTable).where(eq(usersTable.username, 'guru1')).execute();
  if (teacherUser.length === 0) {
    console.log('Creating teacher user...');
    await createUser({
      username: 'guru1',
      password: 'password123',
      role: 'teacher'
    });
    console.log('Teacher user created.');
  } else {
    console.log('Teacher user already exists.');
  }
  console.log('User seeding completed.');
}

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);

  // Call seedUsers after server starts
  await seedUsers();
}

start();
