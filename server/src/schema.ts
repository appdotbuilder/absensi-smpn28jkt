
import { z } from 'zod';

// User roles enum
export const userRoleSchema = z.enum(['admin', 'teacher']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Class levels and sections
export const classLevelSchema = z.enum(['7', '8', '9']);
export const classSectionSchema = z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
export type ClassLevel = z.infer<typeof classLevelSchema>;
export type ClassSection = z.infer<typeof classSectionSchema>;

// Floor enum based on school structure
export const floorSchema = z.enum(['2', '3', '4']);
export type Floor = z.infer<typeof floorSchema>;

// Attendance status enum
export const attendanceStatusSchema = z.enum(['present', 'sick', 'permission', 'absent']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Teacher schema
export const teacherSchema = z.object({
  id: z.number(),
  name: z.string(),
  nip: z.string(),
  user_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Teacher = z.infer<typeof teacherSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  name: z.string(),
  class_level: classLevelSchema,
  class_section: classSectionSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Duty schedule schema
export const dutyScheduleSchema = z.object({
  id: z.number(),
  teacher_id: z.number(),
  duty_date: z.coerce.date(),
  floor: floorSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type DutySchedule = z.infer<typeof dutyScheduleSchema>;

// Attendance record schema
export const attendanceRecordSchema = z.object({
  id: z.number(),
  duty_schedule_id: z.number(),
  student_id: z.number(),
  status: attendanceStatusSchema,
  is_late: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

// Input schemas for creating/updating
export const createUserInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  role: userRoleSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  role: userRoleSchema.optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const createTeacherInputSchema = z.object({
  name: z.string().min(1),
  nip: z.string().min(1),
  user_id: z.number().nullable().optional()
});

export type CreateTeacherInput = z.infer<typeof createTeacherInputSchema>;

export const updateTeacherInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  nip: z.string().min(1).optional(),
  user_id: z.number().nullable().optional()
});

export type UpdateTeacherInput = z.infer<typeof updateTeacherInputSchema>;

export const createStudentInputSchema = z.object({
  name: z.string().min(1),
  class_level: classLevelSchema,
  class_section: classSectionSchema
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

export const updateStudentInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  class_level: classLevelSchema.optional(),
  class_section: classSectionSchema.optional()
});

export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

export const createDutyScheduleInputSchema = z.object({
  teacher_id: z.number(),
  duty_date: z.coerce.date(),
  floor: floorSchema
});

export type CreateDutyScheduleInput = z.infer<typeof createDutyScheduleInputSchema>;

export const createAttendanceRecordInputSchema = z.object({
  duty_schedule_id: z.number(),
  student_id: z.number(),
  status: attendanceStatusSchema,
  is_late: z.boolean(),
  notes: z.string().nullable().optional()
});

export type CreateAttendanceRecordInput = z.infer<typeof createAttendanceRecordInputSchema>;

export const updateAttendanceRecordInputSchema = z.object({
  id: z.number(),
  status: attendanceStatusSchema.optional(),
  is_late: z.boolean().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateAttendanceRecordInput = z.infer<typeof updateAttendanceRecordInputSchema>;

// Login schema
export const loginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Report query schema
export const attendanceReportQuerySchema = z.object({
  duty_schedule_id: z.number()
});

export type AttendanceReportQuery = z.infer<typeof attendanceReportQuerySchema>;

// Bulk import schemas
export const bulkImportStudentsInputSchema = z.object({
  students: z.array(createStudentInputSchema)
});

export type BulkImportStudentsInput = z.infer<typeof bulkImportStudentsInputSchema>;

export const bulkImportTeachersInputSchema = z.object({
  teachers: z.array(createTeacherInputSchema)
});

export type BulkImportTeachersInput = z.infer<typeof bulkImportTeachersInputSchema>;
