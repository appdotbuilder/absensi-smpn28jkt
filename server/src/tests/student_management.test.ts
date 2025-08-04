
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput, type UpdateStudentInput, type BulkImportStudentsInput } from '../schema';
import { 
  createStudent, 
  updateStudent, 
  deleteStudent, 
  getStudents, 
  getStudentById, 
  getStudentsByFloor, 
  bulkImportStudents, 
  exportStudents 
} from '../handlers/student_management';
import { eq, and } from 'drizzle-orm';

// Test data
const testStudentInput: CreateStudentInput = {
  name: 'John Doe',
  class_level: '8',
  class_section: 'A'
};

const testStudent2Input: CreateStudentInput = {
  name: 'Jane Smith',
  class_level: '9',
  class_section: 'G'
};

const testStudent3Input: CreateStudentInput = {
  name: 'Bob Wilson',
  class_level: '7',
  class_section: 'C'
};

describe('Student Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createStudent', () => {
    it('should create a student', async () => {
      const result = await createStudent(testStudentInput);

      expect(result.name).toEqual('John Doe');
      expect(result.class_level).toEqual('8');
      expect(result.class_section).toEqual('A');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save student to database', async () => {
      const result = await createStudent(testStudentInput);

      const students = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, result.id))
        .execute();

      expect(students).toHaveLength(1);
      expect(students[0].name).toEqual('John Doe');
      expect(students[0].class_level).toEqual('8');
      expect(students[0].class_section).toEqual('A');
    });
  });

  describe('updateStudent', () => {
    it('should update student name', async () => {
      const student = await createStudent(testStudentInput);

      const updateInput: UpdateStudentInput = {
        id: student.id,
        name: 'John Updated'
      };

      const result = await updateStudent(updateInput);

      expect(result.id).toEqual(student.id);
      expect(result.name).toEqual('John Updated');
      expect(result.class_level).toEqual('8');
      expect(result.class_section).toEqual('A');
      expect(result.updated_at > student.updated_at).toBe(true);
    });

    it('should update student class information', async () => {
      const student = await createStudent(testStudentInput);

      const updateInput: UpdateStudentInput = {
        id: student.id,
        class_level: '9',
        class_section: 'B'
      };

      const result = await updateStudent(updateInput);

      expect(result.id).toEqual(student.id);
      expect(result.name).toEqual('John Doe');
      expect(result.class_level).toEqual('9');
      expect(result.class_section).toEqual('B');
    });

    it('should throw error for non-existent student', async () => {
      const updateInput: UpdateStudentInput = {
        id: 999,
        name: 'Non-existent'
      };

      expect(updateStudent(updateInput)).rejects.toThrow(/not found/i);
    });
  });

  describe('deleteStudent', () => {
    it('should delete existing student', async () => {
      const student = await createStudent(testStudentInput);

      const result = await deleteStudent(student.id);

      expect(result).toBe(true);

      const students = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, student.id))
        .execute();

      expect(students).toHaveLength(0);
    });

    it('should return false for non-existent student', async () => {
      const result = await deleteStudent(999);

      expect(result).toBe(false);
    });
  });

  describe('getStudents', () => {
    it('should return empty array when no students', async () => {
      const result = await getStudents();

      expect(result).toEqual([]);
    });

    it('should return all students', async () => {
      await createStudent(testStudentInput);
      await createStudent(testStudent2Input);

      const result = await getStudents();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('John Doe');
      expect(result[1].name).toEqual('Jane Smith');
    });
  });

  describe('getStudentById', () => {
    it('should return student by id', async () => {
      const student = await createStudent(testStudentInput);

      const result = await getStudentById(student.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(student.id);
      expect(result!.name).toEqual('John Doe');
    });

    it('should return null for non-existent student', async () => {
      const result = await getStudentById(999);

      expect(result).toBeNull();
    });
  });

  describe('getStudentsByFloor', () => {
    beforeEach(async () => {
      // Create test students for different floors
      await createStudent({ name: 'Grade 9A Student', class_level: '9', class_section: 'A' });
      await createStudent({ name: 'Grade 9F Student', class_level: '9', class_section: 'F' });
      await createStudent({ name: 'Grade 9G Student', class_level: '9', class_section: 'G' });
      await createStudent({ name: 'Grade 8A Student', class_level: '8', class_section: 'A' });
      await createStudent({ name: 'Grade 8F Student', class_level: '8', class_section: 'F' });
      await createStudent({ name: 'Grade 8G Student', class_level: '8', class_section: 'G' });
      await createStudent({ name: 'Grade 7A Student', class_level: '7', class_section: 'A' });
      await createStudent({ name: 'Grade 7G Student', class_level: '7', class_section: 'G' });
    });

    it('should return floor 2 students (9A-9F)', async () => {
      const result = await getStudentsByFloor('2');

      expect(result).toHaveLength(2);
      expect(result.every(s => s.class_level === '9' && ['A', 'F'].includes(s.class_section))).toBe(true);
    });

    it('should return floor 3 students (8A-8F, 9G)', async () => {
      const result = await getStudentsByFloor('3');

      expect(result).toHaveLength(3);
      
      const grade8Students = result.filter(s => s.class_level === '8');
      const grade9Students = result.filter(s => s.class_level === '9');
      
      expect(grade8Students).toHaveLength(2);
      expect(grade8Students.every(s => ['A', 'F'].includes(s.class_section))).toBe(true);
      
      expect(grade9Students).toHaveLength(1);
      expect(grade9Students[0].class_section).toEqual('G');
    });

    it('should return floor 4 students (7A-7G, 8G)', async () => {
      const result = await getStudentsByFloor('4');

      expect(result).toHaveLength(3);
      
      const grade7Students = result.filter(s => s.class_level === '7');
      const grade8Students = result.filter(s => s.class_level === '8');
      
      expect(grade7Students).toHaveLength(2);
      expect(grade7Students.every(s => ['A', 'G'].includes(s.class_section))).toBe(true);
      
      expect(grade8Students).toHaveLength(1);
      expect(grade8Students[0].class_section).toEqual('G');
    });

    it('should throw error for invalid floor', async () => {
      expect(getStudentsByFloor('5')).rejects.toThrow(/invalid floor/i);
    });
  });

  describe('bulkImportStudents', () => {
    it('should import multiple students', async () => {
      const bulkInput: BulkImportStudentsInput = {
        students: [
          testStudentInput,
          testStudent2Input,
          testStudent3Input
        ]
      };

      const result = await bulkImportStudents(bulkInput);

      expect(result).toHaveLength(3);
      expect(result[0].name).toEqual('John Doe');
      expect(result[1].name).toEqual('Jane Smith');
      expect(result[2].name).toEqual('Bob Wilson');

      // Verify in database
      const allStudents = await getStudents();
      expect(allStudents).toHaveLength(3);
    });

    it('should return empty array for empty input', async () => {
      const bulkInput: BulkImportStudentsInput = {
        students: []
      };

      const result = await bulkImportStudents(bulkInput);

      expect(result).toEqual([]);
    });
  });

  describe('exportStudents', () => {
    it('should export students as CSV buffer', async () => {
      await createStudent(testStudentInput);
      await createStudent(testStudent2Input);

      const result = await exportStudents();

      expect(result).toBeInstanceOf(Buffer);
      
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('ID,Name,Class Level,Class Section');
      expect(csvContent).toContain('John Doe');
      expect(csvContent).toContain('Jane Smith');
      expect(csvContent).toContain('8,A');
      expect(csvContent).toContain('9,G');
    });

    it('should export empty CSV when no students', async () => {
      const result = await exportStudents();

      expect(result).toBeInstanceOf(Buffer);
      
      const csvContent = result.toString('utf-8');
      expect(csvContent).toContain('ID,Name,Class Level,Class Section');
      expect(csvContent.split('\n')).toHaveLength(2); // Header + empty line
    });
  });
});
