
import { db } from '../db';
import { teachersTable, usersTable } from '../db/schema';
import { type CreateTeacherInput, type UpdateTeacherInput, type Teacher, type BulkImportTeachersInput } from '../schema';
import { eq } from 'drizzle-orm';

export const createTeacher = async (input: CreateTeacherInput): Promise<Teacher> => {
  try {
    // If user_id is provided, verify the user exists
    if (input.user_id) {
      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.user_id))
        .execute();
      
      if (user.length === 0) {
        throw new Error(`User with id ${input.user_id} does not exist`);
      }
    }

    const result = await db.insert(teachersTable)
      .values({
        name: input.name,
        nip: input.nip,
        user_id: input.user_id || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Teacher creation failed:', error);
    throw error;
  }
};

export const updateTeacher = async (input: UpdateTeacherInput): Promise<Teacher> => {
  try {
    // Verify teacher exists
    const existingTeacher = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, input.id))
      .execute();
    
    if (existingTeacher.length === 0) {
      throw new Error(`Teacher with id ${input.id} does not exist`);
    }

    // If user_id is provided, verify the user exists
    if (input.user_id) {
      const user = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.user_id))
        .execute();
      
      if (user.length === 0) {
        throw new Error(`User with id ${input.user_id} does not exist`);
      }
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.nip !== undefined) updateData.nip = input.nip;
    if (input.user_id !== undefined) updateData.user_id = input.user_id;

    const result = await db.update(teachersTable)
      .set(updateData)
      .where(eq(teachersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Teacher update failed:', error);
    throw error;
  }
};

export const deleteTeacher = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(teachersTable)
      .where(eq(teachersTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('Teacher deletion failed:', error);
    throw error;
  }
};

export const getTeachers = async (): Promise<Teacher[]> => {
  try {
    const result = await db.select()
      .from(teachersTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Teachers fetch failed:', error);
    throw error;
  }
};

export const getTeacherById = async (id: number): Promise<Teacher | null> => {
  try {
    const result = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, id))
      .execute();

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Teacher fetch by id failed:', error);
    throw error;
  }
};

export const bulkImportTeachers = async (input: BulkImportTeachersInput): Promise<Teacher[]> => {
  try {
    const results: Teacher[] = [];

    for (const teacherData of input.teachers) {
      // If user_id is provided, verify the user exists
      if (teacherData.user_id) {
        const user = await db.select()
          .from(usersTable)
          .where(eq(usersTable.id, teacherData.user_id))
          .execute();
        
        if (user.length === 0) {
          throw new Error(`User with id ${teacherData.user_id} does not exist`);
        }
      }

      const result = await db.insert(teachersTable)
        .values({
          name: teacherData.name,
          nip: teacherData.nip,
          user_id: teacherData.user_id || null
        })
        .returning()
        .execute();

      results.push(result[0]);
    }

    return results;
  } catch (error) {
    console.error('Bulk import teachers failed:', error);
    throw error;
  }
};

export const exportTeachers = async (): Promise<Buffer> => {
  try {
    const teachers = await db.select()
      .from(teachersTable)
      .execute();

    // Create simple CSV format for export
    const headers = 'ID,Name,NIP,User ID,Created At,Updated At\n';
    const rows = teachers.map(teacher => 
      `${teacher.id},${teacher.name},${teacher.nip},${teacher.user_id || ''},${teacher.created_at.toISOString()},${teacher.updated_at.toISOString()}`
    ).join('\n');

    return Buffer.from(headers + rows, 'utf-8');
  } catch (error) {
    console.error('Teachers export failed:', error);
    throw error;
  }
};
