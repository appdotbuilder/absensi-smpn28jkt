
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teachersTable, studentsTable, dutySchedulesTable, attendanceRecordsTable } from '../db/schema';
import { type CreateAttendanceRecordInput, type UpdateAttendanceRecordInput } from '../schema';
import {
  createAttendanceRecord,
  updateAttendanceRecord,
  getAttendanceByDutySchedule,
  deleteAttendanceRecord,
  generateAttendanceReport,
  getAttendanceSummary
} from '../handlers/attendance';
import { eq } from 'drizzle-orm';

// Test data setup
let testUser: any;
let testTeacher: any;
let testStudent: any;
let testDutySchedule: any;

const setupTestData = async () => {
  // Create test user
  const userResult = await db.insert(usersTable)
    .values({
      username: 'testteacher',
      password: 'password123',
      role: 'teacher'
    })
    .returning()
    .execute();
  testUser = userResult[0];

  // Create test teacher
  const teacherResult = await db.insert(teachersTable)
    .values({
      name: 'Test Teacher',
      nip: '123456789',
      user_id: testUser.id
    })
    .returning()
    .execute();
  testTeacher = teacherResult[0];

  // Create test student
  const studentResult = await db.insert(studentsTable)
    .values({
      name: 'Test Student',
      class_level: '7',
      class_section: 'A'
    })
    .returning()
    .execute();
  testStudent = studentResult[0];

  // Create test duty schedule
  const dutyResult = await db.insert(dutySchedulesTable)
    .values({
      teacher_id: testTeacher.id,
      duty_date: new Date('2024-01-15'),
      floor: '2'
    })
    .returning()
    .execute();
  testDutySchedule = dutyResult[0];
};

const testAttendanceInput: CreateAttendanceRecordInput = {
  duty_schedule_id: 0, // Will be set in beforeEach
  student_id: 0, // Will be set in beforeEach
  status: 'present',
  is_late: false,
  notes: 'Test notes'
};

describe('createAttendanceRecord', () => {
  beforeEach(async () => {
    await createDB();
    await setupTestData();
    testAttendanceInput.duty_schedule_id = testDutySchedule.id;
    testAttendanceInput.student_id = testStudent.id;
  });
  afterEach(resetDB);

  it('should create an attendance record', async () => {
    const result = await createAttendanceRecord(testAttendanceInput);

    expect(result.duty_schedule_id).toEqual(testDutySchedule.id);
    expect(result.student_id).toEqual(testStudent.id);
    expect(result.status).toEqual('present');
    expect(result.is_late).toEqual(false);
    expect(result.notes).toEqual('Test notes');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save attendance record to database', async () => {
    const result = await createAttendanceRecord(testAttendanceInput);

    const records = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].duty_schedule_id).toEqual(testDutySchedule.id);
    expect(records[0].student_id).toEqual(testStudent.id);
    expect(records[0].status).toEqual('present');
    expect(records[0].is_late).toEqual(false);
    expect(records[0].notes).toEqual('Test notes');
  });

  it('should throw error for invalid duty schedule', async () => {
    const invalidInput = { ...testAttendanceInput, duty_schedule_id: 99999 };

    await expect(createAttendanceRecord(invalidInput)).rejects.toThrow(/duty schedule not found/i);
  });

  it('should throw error for invalid student', async () => {
    const invalidInput = { ...testAttendanceInput, student_id: 99999 };

    await expect(createAttendanceRecord(invalidInput)).rejects.toThrow(/student not found/i);
  });

  it('should handle null notes', async () => {
    const inputWithoutNotes = { ...testAttendanceInput, notes: undefined };
    const result = await createAttendanceRecord(inputWithoutNotes);

    expect(result.notes).toBeNull();
  });
});

describe('updateAttendanceRecord', () => {
  let testRecord: any;

  beforeEach(async () => {
    await createDB();
    await setupTestData();
    testAttendanceInput.duty_schedule_id = testDutySchedule.id;
    testAttendanceInput.student_id = testStudent.id;
    testRecord = await createAttendanceRecord(testAttendanceInput);
  });
  afterEach(resetDB);

  it('should update attendance record', async () => {
    const updateInput: UpdateAttendanceRecordInput = {
      id: testRecord.id,
      status: 'absent',
      is_late: true,
      notes: 'Updated notes'
    };

    const result = await updateAttendanceRecord(updateInput);

    expect(result.id).toEqual(testRecord.id);
    expect(result.status).toEqual('absent');
    expect(result.is_late).toEqual(true);
    expect(result.notes).toEqual('Updated notes');
    expect(result.updated_at.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateAttendanceRecordInput = {
      id: testRecord.id,
      status: 'sick'
    };

    const result = await updateAttendanceRecord(updateInput);

    expect(result.status).toEqual('sick');
    expect(result.is_late).toEqual(false); // Should remain unchanged
    expect(result.notes).toEqual('Test notes'); // Should remain unchanged
  });

  it('should throw error for non-existent record', async () => {
    const updateInput: UpdateAttendanceRecordInput = {
      id: 99999,
      status: 'absent'
    };

    await expect(updateAttendanceRecord(updateInput)).rejects.toThrow(/attendance record not found/i);
  });
});

describe('getAttendanceByDutySchedule', () => {
  beforeEach(async () => {
    await createDB();
    await setupTestData();
    testAttendanceInput.duty_schedule_id = testDutySchedule.id;
    testAttendanceInput.student_id = testStudent.id;
  });
  afterEach(resetDB);

  it('should return attendance records for duty schedule', async () => {
    await createAttendanceRecord(testAttendanceInput);
    
    const results = await getAttendanceByDutySchedule(testDutySchedule.id);

    expect(results).toHaveLength(1);
    expect(results[0].duty_schedule_id).toEqual(testDutySchedule.id);
    expect(results[0].student_id).toEqual(testStudent.id);
    expect(results[0].status).toEqual('present');
  });

  it('should return empty array for duty schedule with no records', async () => {
    const results = await getAttendanceByDutySchedule(testDutySchedule.id);
    
    expect(results).toHaveLength(0);
  });
});

describe('deleteAttendanceRecord', () => {
  let testRecord: any;

  beforeEach(async () => {
    await createDB();
    await setupTestData();
    testAttendanceInput.duty_schedule_id = testDutySchedule.id;
    testAttendanceInput.student_id = testStudent.id;
    testRecord = await createAttendanceRecord(testAttendanceInput);
  });
  afterEach(resetDB);

  it('should delete attendance record', async () => {
    const result = await deleteAttendanceRecord(testRecord.id);

    expect(result).toBe(true);

    const records = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.id, testRecord.id))
      .execute();

    expect(records).toHaveLength(0);
  });

  it('should return false for non-existent record', async () => {
    const result = await deleteAttendanceRecord(99999);

    expect(result).toBe(false);
  });
});

describe('getAttendanceSummary', () => {
  beforeEach(async () => {
    await createDB();
    await setupTestData();
  });
  afterEach(resetDB);

  it('should return correct attendance summary', async () => {
    // Create multiple attendance records with different statuses
    await createAttendanceRecord({
      duty_schedule_id: testDutySchedule.id,
      student_id: testStudent.id,
      status: 'present',
      is_late: true
    });

    // Create another student for more test data
    const student2 = await db.insert(studentsTable)
      .values({
        name: 'Test Student 2',
        class_level: '7',
        class_section: 'B'
      })
      .returning()
      .execute();

    await createAttendanceRecord({
      duty_schedule_id: testDutySchedule.id,
      student_id: student2[0].id,
      status: 'absent',
      is_late: false
    });

    const summary = await getAttendanceSummary(testDutySchedule.id);

    expect(summary.total).toEqual(2);
    expect(summary.present).toEqual(1);
    expect(summary.absent).toEqual(1);
    expect(summary.sick).toEqual(0);
    expect(summary.permission).toEqual(0);
    expect(summary.late).toEqual(1);
  });

  it('should return zero summary for duty schedule with no records', async () => {
    const summary = await getAttendanceSummary(testDutySchedule.id);

    expect(summary.total).toEqual(0);
    expect(summary.present).toEqual(0);
    expect(summary.absent).toEqual(0);
    expect(summary.sick).toEqual(0);
    expect(summary.permission).toEqual(0);
    expect(summary.late).toEqual(0);
  });
});

describe('generateAttendanceReport', () => {
  beforeEach(async () => {
    await createDB();
    await setupTestData();
    testAttendanceInput.duty_schedule_id = testDutySchedule.id;
    testAttendanceInput.student_id = testStudent.id;
  });
  afterEach(resetDB);

  it('should generate attendance report', async () => {
    await createAttendanceRecord(testAttendanceInput);

    const report = await generateAttendanceReport({
      duty_schedule_id: testDutySchedule.id
    });

    expect(report).toBeInstanceOf(Buffer);
    const reportContent = report.toString('utf-8');
    
    expect(reportContent).toContain('ATTENDANCE REPORT');
    expect(reportContent).toContain('Test Teacher');
    expect(reportContent).toContain('123456789');
    expect(reportContent).toContain('Floor: 2');
    expect(reportContent).toContain('Test Student');
    expect(reportContent).toContain('present');
  });

  it('should throw error for non-existent duty schedule', async () => {
    await expect(generateAttendanceReport({
      duty_schedule_id: 99999
    })).rejects.toThrow(/duty schedule not found/i);
  });
});
