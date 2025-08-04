
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Hash password using Bun's built-in password hashing
    const hashedPassword = await Bun.password.hash(input.password);

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        username: input.username,
        password: hashedPassword,
        role: input.role
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Build update values - only include provided fields
    const updateValues: any = {};
    
    if (input.username !== undefined) {
      updateValues.username = input.username;
    }
    
    if (input.password !== undefined) {
      updateValues.password = await Bun.password.hash(input.password);
    }
    
    if (input.role !== undefined) {
      updateValues.role = input.role;
    }

    updateValues.updated_at = new Date();

    // Update user record
    const result = await db.update(usersTable)
      .set(updateValues)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};

export const deleteUser = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};

export const getUsers = async (): Promise<User[]> => {
  try {
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      password: usersTable.password, // Include password field but don't expose in API
      role: usersTable.role,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at
    })
    .from(usersTable)
    .execute();

    return users;
  } catch (error) {
    console.error('Fetching users failed:', error);
    throw error;
  }
};

export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const users = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      password: usersTable.password, // Include password field but don't expose in API
      role: usersTable.role,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .execute();

    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Fetching user by ID failed:', error);
    throw error;
  }
};
