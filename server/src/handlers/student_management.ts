
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput, type UpdateStudentInput, type Student, type BulkImportStudentsInput, type ClassLevel, type ClassSection } from '../schema';
import { eq, inArray, and, or } from 'drizzle-orm';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    const result = await db.insert(studentsTable)
      .values({
        name: input.name,
        class_level: input.class_level,
        class_section: input.class_section
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};

export const updateStudent = async (input: UpdateStudentInput): Promise<Student> => {
  try {
    const updateData: Partial<typeof studentsTable.$inferInsert> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.class_level !== undefined) updateData.class_level = input.class_level;
    if (input.class_section !== undefined) updateData.class_section = input.class_section;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    const result = await db.update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Student with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Student update failed:', error);
    throw error;
  }
};

export const deleteStudent = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(studentsTable)
      .where(eq(studentsTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Student deletion failed:', error);
    throw error;
  }
};

export const getStudents = async (): Promise<Student[]> => {
  try {
    const result = await db.select()
      .from(studentsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Students fetch failed:', error);
    throw error;
  }
};

export const getStudentById = async (id: number): Promise<Student | null> => {
  try {
    const result = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Student fetch by id failed:', error);
    throw error;
  }
};

export const getStudentsByFloor = async (floor: string): Promise<Student[]> => {
  try {
    let conditions: any[] = [];

    // Floor mapping based on school structure:
    // Floor 2: 9A-9F
    // Floor 3: 8A-8F, 9G  
    // Floor 4: 7A-7G, 8G
    switch (floor) {
      case '2':
        // Grade 9, sections A-F
        conditions.push(
          and(
            eq(studentsTable.class_level, '9' as ClassLevel),
            inArray(studentsTable.class_section, ['A', 'B', 'C', 'D', 'E', 'F'] as ClassSection[])
          )
        );
        break;
      case '3':
        // Grade 8 sections A-F, OR Grade 9 section G
        conditions.push(
          or(
            and(
              eq(studentsTable.class_level, '8' as ClassLevel),
              inArray(studentsTable.class_section, ['A', 'B', 'C', 'D', 'E', 'F'] as ClassSection[])
            ),
            and(
              eq(studentsTable.class_level, '9' as ClassLevel),
              eq(studentsTable.class_section, 'G' as ClassSection)
            )
          )
        );
        break;
      case '4':
        // Grade 7 sections A-G, OR Grade 8 section G
        conditions.push(
          or(
            and(
              eq(studentsTable.class_level, '7' as ClassLevel),
              inArray(studentsTable.class_section, ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as ClassSection[])
            ),
            and(
              eq(studentsTable.class_level, '8' as ClassLevel),
              eq(studentsTable.class_section, 'G' as ClassSection)
            )
          )
        );
        break;
      default:
        throw new Error(`Invalid floor: ${floor}. Valid floors are 2, 3, 4`);
    }

    const result = await db.select()
      .from(studentsTable)
      .where(conditions[0])
      .execute();

    return result;
  } catch (error) {
    console.error('Students fetch by floor failed:', error);
    throw error;
  }
};

export const bulkImportStudents = async (input: BulkImportStudentsInput): Promise<Student[]> => {
  try {
    if (input.students.length === 0) {
      return [];
    }

    const values = input.students.map(student => ({
      name: student.name,
      class_level: student.class_level,
      class_section: student.class_section
    }));

    const result = await db.insert(studentsTable)
      .values(values)
      .returning()
      .execute();

    return result;
  } catch (error) {
    console.error('Bulk import students failed:', error);
    throw error;
  }
};

export const exportStudents = async (): Promise<Buffer> => {
  try {
    const students = await getStudents();
    
    // Create a simple CSV format for Excel compatibility
    const headers = 'ID,Name,Class Level,Class Section,Created At,Updated At\n';
    const rows = students.map(student => 
      `${student.id},"${student.name}",${student.class_level},${student.class_section},"${student.created_at.toISOString()}","${student.updated_at.toISOString()}"`
    ).join('\n');
    
    const csvContent = headers + rows;
    return Buffer.from(csvContent, 'utf-8');
  } catch (error) {
    console.error('Students export failed:', error);
    throw error;
  }
};
