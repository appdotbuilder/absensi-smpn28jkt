
import { db } from '../db';
import { dutySchedulesTable, teachersTable } from '../db/schema';
import { type CreateDutyScheduleInput, type DutySchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const createDutySchedule = async (input: CreateDutyScheduleInput): Promise<DutySchedule> => {
  try {
    // Verify teacher exists
    const teacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, input.teacher_id))
      .execute();

    if (teacher.length === 0) {
      throw new Error('Teacher not found');
    }

    // Insert duty schedule record
    const result = await db.insert(dutySchedulesTable)
      .values({
        teacher_id: input.teacher_id,
        duty_date: input.duty_date,
        floor: input.floor
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Duty schedule creation failed:', error);
    throw error;
  }
};

export const getDutySchedulesByTeacher = async (teacherId: number): Promise<DutySchedule[]> => {
  try {
    const result = await db.select()
      .from(dutySchedulesTable)
      .where(eq(dutySchedulesTable.teacher_id, teacherId))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch duty schedules by teacher:', error);
    throw error;
  }
};

export const getDutyScheduleById = async (id: number): Promise<DutySchedule | null> => {
  try {
    const result = await db.select()
      .from(dutySchedulesTable)
      .where(eq(dutySchedulesTable.id, id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Failed to fetch duty schedule by ID:', error);
    throw error;
  }
};

export const deleteDutySchedule = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(dutySchedulesTable)
      .where(eq(dutySchedulesTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete duty schedule:', error);
    throw error;
  }
};
