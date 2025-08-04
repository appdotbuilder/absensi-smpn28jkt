
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dutySchedulesTable, teachersTable, usersTable } from '../db/schema';
import { type CreateDutyScheduleInput, type CreateTeacherInput, type CreateUserInput } from '../schema';
import { createDutySchedule, getDutySchedulesByTeacher, getDutyScheduleById, deleteDutySchedule } from '../handlers/duty_schedule';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  username: 'teacher_user',
  password: 'password123',
  role: 'teacher'
};

const testTeacher: CreateTeacherInput = {
  name: 'Test Teacher',
  nip: '123456789',
  user_id: null
};

const testDutySchedule: CreateDutyScheduleInput = {
  teacher_id: 1, // Will be updated with actual teacher ID
  duty_date: new Date('2024-01-15'),
  floor: '2'
};

describe('createDutySchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a duty schedule', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values({
        ...testTeacher,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create duty schedule
    const dutyScheduleInput = {
      ...testDutySchedule,
      teacher_id: teacherResult[0].id
    };

    const result = await createDutySchedule(dutyScheduleInput);

    expect(result.teacher_id).toEqual(teacherResult[0].id);
    expect(result.duty_date).toEqual(new Date('2024-01-15'));
    expect(result.floor).toEqual('2');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save duty schedule to database', async () => {
    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values(testTeacher)
      .returning()
      .execute();

    const dutyScheduleInput = {
      ...testDutySchedule,
      teacher_id: teacherResult[0].id
    };

    const result = await createDutySchedule(dutyScheduleInput);

    const schedules = await db.select()
      .from(dutySchedulesTable)
      .where(eq(dutySchedulesTable.id, result.id))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].teacher_id).toEqual(teacherResult[0].id);
    expect(schedules[0].duty_date).toEqual(new Date('2024-01-15'));
    expect(schedules[0].floor).toEqual('2');
  });

  it('should throw error when teacher does not exist', async () => {
    const dutyScheduleInput = {
      ...testDutySchedule,
      teacher_id: 999 // Non-existent teacher ID
    };

    await expect(createDutySchedule(dutyScheduleInput)).rejects.toThrow(/teacher not found/i);
  });
});

describe('getDutySchedulesByTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return duty schedules for a teacher', async () => {
    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values(testTeacher)
      .returning()
      .execute();

    // Create multiple duty schedules
    await db.insert(dutySchedulesTable)
      .values([
        {
          teacher_id: teacherResult[0].id,
          duty_date: new Date('2024-01-15'),
          floor: '2'
        },
        {
          teacher_id: teacherResult[0].id,
          duty_date: new Date('2024-01-16'),
          floor: '3'
        }
      ])
      .execute();

    const result = await getDutySchedulesByTeacher(teacherResult[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].teacher_id).toEqual(teacherResult[0].id);
    expect(result[1].teacher_id).toEqual(teacherResult[0].id);
    expect(result[0].floor).toEqual('2');
    expect(result[1].floor).toEqual('3');
  });

  it('should return empty array for teacher with no schedules', async () => {
    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values(testTeacher)
      .returning()
      .execute();

    const result = await getDutySchedulesByTeacher(teacherResult[0].id);

    expect(result).toHaveLength(0);
  });
});

describe('getDutyScheduleById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return duty schedule by ID', async () => {
    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values(testTeacher)
      .returning()
      .execute();

    // Create duty schedule
    const scheduleResult = await db.insert(dutySchedulesTable)
      .values({
        teacher_id: teacherResult[0].id,
        duty_date: new Date('2024-01-15'),
        floor: '2'
      })
      .returning()
      .execute();

    const result = await getDutyScheduleById(scheduleResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(scheduleResult[0].id);
    expect(result!.teacher_id).toEqual(teacherResult[0].id);
    expect(result!.duty_date).toEqual(new Date('2024-01-15'));
    expect(result!.floor).toEqual('2');
  });

  it('should return null for non-existent ID', async () => {
    const result = await getDutyScheduleById(999);

    expect(result).toBeNull();
  });
});

describe('deleteDutySchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete duty schedule and return true', async () => {
    // Create teacher
    const teacherResult = await db.insert(teachersTable)
      .values(testTeacher)
      .returning()
      .execute();

    // Create duty schedule
    const scheduleResult = await db.insert(dutySchedulesTable)
      .values({
        teacher_id: teacherResult[0].id,
        duty_date: new Date('2024-01-15'),
        floor: '2'
      })
      .returning()
      .execute();

    const result = await deleteDutySchedule(scheduleResult[0].id);

    expect(result).toBe(true);

    // Verify deletion
    const schedules = await db.select()
      .from(dutySchedulesTable)
      .where(eq(dutySchedulesTable.id, scheduleResult[0].id))
      .execute();

    expect(schedules).toHaveLength(0);
  });

  it('should return false for non-existent ID', async () => {
    const result = await deleteDutySchedule(999);

    expect(result).toBe(false);
  });
});
