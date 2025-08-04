
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Define enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'teacher']);
export const classLevelEnum = pgEnum('class_level', ['7', '8', '9']);
export const classSectionEnum = pgEnum('class_section', ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
export const floorEnum = pgEnum('floor', ['2', '3', '4']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'sick', 'permission', 'absent']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Teachers table
export const teachersTable = pgTable('teachers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  nip: text('nip').notNull().unique(),
  user_id: integer('user_id').references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Students table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  class_level: classLevelEnum('class_level').notNull(),
  class_section: classSectionEnum('class_section').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Duty schedules table
export const dutySchedulesTable = pgTable('duty_schedules', {
  id: serial('id').primaryKey(),
  teacher_id: integer('teacher_id').notNull().references(() => teachersTable.id),
  duty_date: timestamp('duty_date').notNull(),
  floor: floorEnum('floor').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Attendance records table
export const attendanceRecordsTable = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  duty_schedule_id: integer('duty_schedule_id').notNull().references(() => dutySchedulesTable.id),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  status: attendanceStatusEnum('status').notNull(),
  is_late: boolean('is_late').notNull().default(false),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the tables
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Teacher = typeof teachersTable.$inferSelect;
export type NewTeacher = typeof teachersTable.$inferInsert;

export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;

export type DutySchedule = typeof dutySchedulesTable.$inferSelect;
export type NewDutySchedule = typeof dutySchedulesTable.$inferInsert;

export type AttendanceRecord = typeof attendanceRecordsTable.$inferSelect;
export type NewAttendanceRecord = typeof attendanceRecordsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  teachers: teachersTable,
  students: studentsTable,
  dutySchedules: dutySchedulesTable,
  attendanceRecords: attendanceRecordsTable
};
