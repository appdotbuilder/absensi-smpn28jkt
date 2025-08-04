
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable, usersTable } from '../db/schema';
import { type CreateTeacherInput, type UpdateTeacherInput, type BulkImportTeachersInput } from '../schema';
import { 
  createTeacher, 
  updateTeacher, 
  deleteTeacher, 
  getTeachers, 
  getTeacherById, 
  bulkImportTeachers, 
  exportTeachers 
} from '../handlers/teacher_management';
import { eq } from 'drizzle-orm';

// Test inputs
const testTeacherInput: CreateTeacherInput = {
  name: 'John Doe',
  nip: '123456789',
  user_id: null
};

const testTeacherWithUserInput: CreateTeacherInput = {
  name: 'Jane Smith',
  nip: '987654321',
  user_id: 1
};

describe('Teacher Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createTeacher', () => {
    it('should create a teacher without user_id', async () => {
      const result = await createTeacher(testTeacherInput);

      expect(result.name).toEqual('John Doe');
      expect(result.nip).toEqual('123456789');
      expect(result.user_id).toBeNull();
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a teacher with valid user_id', async () => {
      // Create a user first
      await db.insert(usersTable)
        .values({
          username: 'testuser',
          password: 'password123',
          role: 'teacher'
        })
        .execute();

      const result = await createTeacher(testTeacherWithUserInput);

      expect(result.name).toEqual('Jane Smith');
      expect(result.nip).toEqual('987654321');
      expect(result.user_id).toEqual(1);
      expect(result.id).toBeDefined();
    });

    it('should throw error for non-existent user_id', async () => {
      const invalidInput: CreateTeacherInput = {
        name: 'Test Teacher',
        nip: '111111111',
        user_id: 999
      };

      expect(createTeacher(invalidInput)).rejects.toThrow(/User with id 999 does not exist/i);
    });

    it('should save teacher to database', async () => {
      const result = await createTeacher(testTeacherInput);

      const teachers = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, result.id))
        .execute();

      expect(teachers).toHaveLength(1);
      expect(teachers[0].name).toEqual('John Doe');
      expect(teachers[0].nip).toEqual('123456789');
    });
  });

  describe('updateTeacher', () => {
    it('should update teacher fields', async () => {
      const teacher = await createTeacher(testTeacherInput);

      const updateInput: UpdateTeacherInput = {
        id: teacher.id,
        name: 'Updated Name',
        nip: '999999999'
      };

      const result = await updateTeacher(updateInput);

      expect(result.id).toEqual(teacher.id);
      expect(result.name).toEqual('Updated Name');
      expect(result.nip).toEqual('999999999');
      expect(result.updated_at.getTime()).toBeGreaterThan(teacher.updated_at.getTime());
    });

    it('should throw error for non-existent teacher', async () => {
      const updateInput: UpdateTeacherInput = {
        id: 999,
        name: 'Test'
      };

      expect(updateTeacher(updateInput)).rejects.toThrow(/Teacher with id 999 does not exist/i);
    });

    it('should validate user_id when updating', async () => {
      const teacher = await createTeacher(testTeacherInput);

      const updateInput: UpdateTeacherInput = {
        id: teacher.id,
        user_id: 999
      };

      expect(updateTeacher(updateInput)).rejects.toThrow(/User with id 999 does not exist/i);
    });
  });

  describe('deleteTeacher', () => {
    it('should delete existing teacher', async () => {
      const teacher = await createTeacher(testTeacherInput);

      const result = await deleteTeacher(teacher.id);

      expect(result).toBe(true);

      const teachers = await db.select()
        .from(teachersTable)
        .where(eq(teachersTable.id, teacher.id))
        .execute();

      expect(teachers).toHaveLength(0);
    });

    it('should return false for non-existent teacher', async () => {
      const result = await deleteTeacher(999);

      expect(result).toBe(false);
    });
  });

  describe('getTeachers', () => {
    it('should return empty array when no teachers', async () => {
      const result = await getTeachers();

      expect(result).toEqual([]);
    });

    it('should return all teachers', async () => {
      await createTeacher(testTeacherInput);
      await createTeacher({
        name: 'Teacher 2',
        nip: '222222222',
        user_id: null
      });

      const result = await getTeachers();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('John Doe');
      expect(result[1].name).toEqual('Teacher 2');
    });
  });

  describe('getTeacherById', () => {
    it('should return teacher by id', async () => {
      const teacher = await createTeacher(testTeacherInput);

      const result = await getTeacherById(teacher.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(teacher.id);
      expect(result!.name).toEqual('John Doe');
    });

    it('should return null for non-existent teacher', async () => {
      const result = await getTeacherById(999);

      expect(result).toBeNull();
    });
  });

  describe('bulkImportTeachers', () => {
    it('should import multiple teachers', async () => {
      const bulkInput: BulkImportTeachersInput = {
        teachers: [
          {
            name: 'Bulk Teacher 1',
            nip: '111111111',
            user_id: null
          },
          {
            name: 'Bulk Teacher 2',
            nip: '222222222',
            user_id: null
          }
        ]
      };

      const result = await bulkImportTeachers(bulkInput);

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Bulk Teacher 1');
      expect(result[1].name).toEqual('Bulk Teacher 2');
    });

    it('should validate user_id during bulk import', async () => {
      const bulkInput: BulkImportTeachersInput = {
        teachers: [
          {
            name: 'Test Teacher',
            nip: '111111111',
            user_id: 999
          }
        ]
      };

      expect(bulkImportTeachers(bulkInput)).rejects.toThrow(/User with id 999 does not exist/i);
    });
  });

  describe('exportTeachers', () => {
    it('should export teachers as CSV buffer', async () => {
      await createTeacher(testTeacherInput);

      const result = await exportTeachers();

      expect(result).toBeInstanceOf(Buffer);
      
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('ID,Name,NIP,User ID,Created At,Updated At');
      expect(csvContent).toContain('John Doe');
      expect(csvContent).toContain('123456789');
    });

    it('should export empty CSV when no teachers', async () => {
      const result = await exportTeachers();

      expect(result).toBeInstanceOf(Buffer);
      
      const csvContent = result.toString('utf-8');
      expect(csvContent).toEqual('ID,Name,NIP,User ID,Created At,Updated At\n');
    });
  });
});
