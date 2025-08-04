
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const login = async (input: LoginInput): Promise<User | null> => {
  try {
    // Query user by username
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.username, input.username))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const user = results[0];

    // Use Bun.password.verify to compare the input password with hashed password
    const isValid = await Bun.password.verify(input.password, user.password);
    if (!isValid) {
      return null;
    }

    // Return user data without password
    return {
      id: user.id,
      username: user.username,
      password: '', // Don't return actual password
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const validateSession = async (userId: number): Promise<User | null> => {
  try {
    // Query user by ID
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const user = results[0];

    // Return user data without password
    return {
      id: user.id,
      username: user.username,
      password: '', // Don't return actual password
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    throw error;
  }
};
