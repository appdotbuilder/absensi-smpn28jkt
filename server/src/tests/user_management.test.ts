
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { createUser, updateUser, deleteUser, getUsers, getUserById } from '../handlers/user_management';
import { eq } from 'drizzle-orm';

// Test input data
const testUserInput: CreateUserInput = {
  username: 'testuser',
  password: 'password123',
  role: 'teacher'
};

const testAdminInput: CreateUserInput = {
  username: 'admin',
  password: 'adminpass123',
  role: 'admin'
};

describe('User Management', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createUser', () => {
    it('should create a user with hashed password', async () => {
      const result = await createUser(testUserInput);

      expect(result.id).toBeDefined();
      expect(result.username).toEqual('testuser');
      expect(result.role).toEqual('teacher');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      
      // Password should be hashed, not plain text
      expect(result.password).not.toEqual('password123');
      expect(result.password.length).toBeGreaterThan(10);
    });

    it('should save user to database', async () => {
      const result = await createUser(testUserInput);

      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, result.id))
        .execute();

      expect(users).toHaveLength(1);
      expect(users[0].username).toEqual('testuser');
      expect(users[0].role).toEqual('teacher');
      expect(users[0].password).not.toEqual('password123');
    });

    it('should create admin user', async () => {
      const result = await createUser(testAdminInput);

      expect(result.username).toEqual('admin');
      expect(result.role).toEqual('admin');
    });

    it('should prevent duplicate usernames', async () => {
      await createUser(testUserInput);

      await expect(createUser(testUserInput))
        .rejects.toThrow(/unique/i);
    });
  });

  describe('updateUser', () => {
    it('should update username only', async () => {
      const user = await createUser(testUserInput);
      const originalPassword = user.password;

      const updateInput: UpdateUserInput = {
        id: user.id,
        username: 'updateduser'
      };

      const result = await updateUser(updateInput);

      expect(result.id).toEqual(user.id);
      expect(result.username).toEqual('updateduser');
      expect(result.role).toEqual('teacher'); // Should remain unchanged
      expect(result.password).toEqual(originalPassword); // Should remain unchanged
      expect(result.updated_at).not.toEqual(user.updated_at);
    });

    it('should update password and hash it', async () => {
      const user = await createUser(testUserInput);
      const originalPassword = user.password;

      const updateInput: UpdateUserInput = {
        id: user.id,
        password: 'newpassword123'
      };

      const result = await updateUser(updateInput);

      expect(result.password).not.toEqual(originalPassword);
      expect(result.password).not.toEqual('newpassword123');
      expect(result.password.length).toBeGreaterThan(10);
    });

    it('should update role', async () => {
      const user = await createUser(testUserInput);

      const updateInput: UpdateUserInput = {
        id: user.id,
        role: 'admin'
      };

      const result = await updateUser(updateInput);

      expect(result.role).toEqual('admin');
      expect(result.username).toEqual('testuser'); // Should remain unchanged
    });

    it('should update multiple fields', async () => {
      const user = await createUser(testUserInput);

      const updateInput: UpdateUserInput = {
        id: user.id,
        username: 'newusername',
        password: 'newpassword123',
        role: 'admin'
      };

      const result = await updateUser(updateInput);

      expect(result.username).toEqual('newusername');
      expect(result.role).toEqual('admin');
      expect(result.password).not.toEqual('newpassword123');
      expect(result.password).not.toEqual(user.password);
    });

    it('should throw error for non-existent user', async () => {
      const updateInput: UpdateUserInput = {
        id: 999,
        username: 'nonexistent'
      };

      await expect(updateUser(updateInput))
        .rejects.toThrow(/not found/i);
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', async () => {
      const user = await createUser(testUserInput);

      const result = await deleteUser(user.id);

      expect(result).toBe(true);

      // Verify user is deleted
      const users = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .execute();

      expect(users).toHaveLength(0);
    });

    it('should return false for non-existent user', async () => {
      const result = await deleteUser(999);

      expect(result).toBe(false);
    });
  });

  describe('getUsers', () => {
    it('should return empty array when no users exist', async () => {
      const users = await getUsers();

      expect(users).toEqual([]);
    });

    it('should return all users', async () => {
      const user1 = await createUser(testUserInput);
      const user2 = await createUser(testAdminInput);

      const users = await getUsers();

      expect(users).toHaveLength(2);
      
      const usernames = users.map(u => u.username);
      expect(usernames).toContain('testuser');
      expect(usernames).toContain('admin');

      // Verify all users have required fields
      users.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.username).toBeDefined();
        expect(user.role).toBeDefined();
        expect(user.created_at).toBeInstanceOf(Date);
        expect(user.updated_at).toBeInstanceOf(Date);
        expect(user.password).toBeDefined(); // Password included but should be filtered in API layer
      });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const createdUser = await createUser(testUserInput);

      const user = await getUserById(createdUser.id);

      expect(user).not.toBeNull();
      expect(user!.id).toEqual(createdUser.id);
      expect(user!.username).toEqual('testuser');
      expect(user!.role).toEqual('teacher');
      expect(user!.created_at).toBeInstanceOf(Date);
      expect(user!.updated_at).toBeInstanceOf(Date);
      expect(user!.password).toBeDefined(); // Password included but should be filtered in API layer
    });

    it('should return null when user not found', async () => {
      const user = await getUserById(999);

      expect(user).toBeNull();
    });
  });
});
