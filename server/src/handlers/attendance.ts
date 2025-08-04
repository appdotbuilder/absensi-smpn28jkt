
import { db } from '../db';
import { attendanceRecordsTable, dutySchedulesTable, studentsTable, teachersTable } from '../db/schema';
import { type CreateAttendanceRecordInput, type UpdateAttendanceRecordInput, type AttendanceRecord, type AttendanceReportQuery } from '../schema';
import { eq, and, count, SQL } from 'drizzle-orm';

export const createAttendanceRecord = async (input: CreateAttendanceRecordInput): Promise<AttendanceRecord> => {
  try {
    // Verify duty schedule exists
    const dutySchedule = await db.select()
      .from(dutySchedulesTable)
      .where(eq(dutySchedulesTable.id, input.duty_schedule_id))
      .execute();

    if (dutySchedule.length === 0) {
      throw new Error('Duty schedule not found');
    }

    // Verify student exists
    const student = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (student.length === 0) {
      throw new Error('Student not found');
    }

    // Insert attendance record
    const result = await db.insert(attendanceRecordsTable)
      .values({
        duty_schedule_id: input.duty_schedule_id,
        student_id: input.student_id,
        status: input.status,
        is_late: input.is_late,
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Attendance record creation failed:', error);
    throw error;
  }
};

export const updateAttendanceRecord = async (input: UpdateAttendanceRecordInput): Promise<AttendanceRecord> => {
  try {
    // Check if record exists
    const existing = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      throw new Error('Attendance record not found');
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof attendanceRecordsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.is_late !== undefined) {
      updateData.is_late = input.is_late;
    }

    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update record
    const result = await db.update(attendanceRecordsTable)
      .set(updateData)
      .where(eq(attendanceRecordsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Attendance record update failed:', error);
    throw error;
  }
};

export const getAttendanceByDutySchedule = async (dutyScheduleId: number): Promise<AttendanceRecord[]> => {
  try {
    const result = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.duty_schedule_id, dutyScheduleId))
      .execute();

    return result;
  } catch (error) {
    console.error('Get attendance by duty schedule failed:', error);
    throw error;
  }
};

export const deleteAttendanceRecord = async (id: number): Promise<boolean> => {
  try {
    // Check if record exists
    const existing = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.id, id))
      .execute();

    if (existing.length === 0) {
      return false;
    }

    // Delete record
    await db.delete(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.id, id))
      .execute();

    return true;
  } catch (error) {
    console.error('Delete attendance record failed:', error);
    throw error;
  }
};

export const generateAttendanceReport = async (query: AttendanceReportQuery): Promise<Buffer> => {
  try {
    // Get duty schedule with teacher info
    const dutyInfo = await db.select()
      .from(dutySchedulesTable)
      .innerJoin(teachersTable, eq(dutySchedulesTable.teacher_id, teachersTable.id))
      .where(eq(dutySchedulesTable.id, query.duty_schedule_id))
      .execute();

    if (dutyInfo.length === 0) {
      throw new Error('Duty schedule not found');
    }

    // Get attendance records with student info
    const attendanceData = await db.select()
      .from(attendanceRecordsTable)
      .innerJoin(studentsTable, eq(attendanceRecordsTable.student_id, studentsTable.id))
      .where(eq(attendanceRecordsTable.duty_schedule_id, query.duty_schedule_id))
      .execute();

    // Get summary data
    const summary = await getAttendanceSummary(query.duty_schedule_id);

    // Create simple text report (placeholder for PDF generation)
    const duty = dutyInfo[0];
    const reportContent = [
      `ATTENDANCE REPORT`,
      `================`,
      `Teacher: ${duty.teachers.name} (${duty.teachers.nip})`,
      `Date: ${duty.duty_schedules.duty_date.toDateString()}`,
      `Floor: ${duty.duty_schedules.floor}`,
      ``,
      `SUMMARY:`,
      `Total Students: ${summary.total}`,
      `Present: ${summary.present}`,
      `Sick: ${summary.sick}`,
      `Permission: ${summary.permission}`,
      `Absent: ${summary.absent}`,
      `Late: ${summary.late}`,
      ``,
      `DETAILED LIST:`,
      `==============`
    ];

    attendanceData.forEach(record => {
      const student = record.students;
      const attendance = record.attendance_records;
      reportContent.push(
        `${student.name} (${student.class_level}${student.class_section}) - ${attendance.status}${attendance.is_late ? ' (Late)' : ''}${attendance.notes ? ` - ${attendance.notes}` : ''}`
      );
    });

    return Buffer.from(reportContent.join('\n'), 'utf-8');
  } catch (error) {
    console.error('Generate attendance report failed:', error);
    throw error;
  }
};

export const getAttendanceSummary = async (dutyScheduleId: number): Promise<{
  total: number;
  present: number;
  sick: number;
  permission: number;
  absent: number;
  late: number;
}> => {
  try {
    // Get all attendance records for the duty schedule
    const records = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.duty_schedule_id, dutyScheduleId))
      .execute();

    const summary = {
      total: records.length,
      present: 0,
      sick: 0,
      permission: 0,
      absent: 0,
      late: 0
    };

    records.forEach(record => {
      switch (record.status) {
        case 'present':
          summary.present++;
          break;
        case 'sick':
          summary.sick++;
          break;
        case 'permission':
          summary.permission++;
          break;
        case 'absent':
          summary.absent++;
          break;
      }

      if (record.is_late) {
        summary.late++;
      }
    });

    return summary;
  } catch (error) {
    console.error('Get attendance summary failed:', error);
    throw error;
  }
};
