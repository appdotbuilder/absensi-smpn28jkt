
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type CreateUserInput } from '../schema';
import { login, validateSession } from '../handlers/auth';

// Test user data
const testUser: CreateUserInput = {
  username: 'testuser',
  password: 'testpass123',
  role: 'teacher'
};

const testAdmin: CreateUserInput = {
  username: 'admin',
  password: 'adminpass123',
  role: 'admin'
};

describe('auth handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('login', () => {
    it('should return user data on valid credentials', async () => {
      // Create test user
      await db.insert(usersTable)
        .values(testUser)
        .execute();

      const loginInput: LoginInput = {
        username: 'testuser',
        password: 'testpass123'
      };

      const result = await login(loginInput);

      expect(result).not.toBeNull();
      expect(result!.username).toEqual('testuser');
      expect(result!.password).toEqual(''); // Password should be empty
      expect(result!.role).toEqual('teacher');
      expect(result!.id).toBeDefined();
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for invalid username', async () => {
      // Create test user
      await db.insert(usersTable)
        .values(testUser)
        .execute();

      const loginInput: LoginInput = {
        username: 'wronguser',
        password: 'testpass123'
      };

      const result = await login(loginInput);

      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      // Create test user
      await db.insert(usersTable)
        .values(testUser)
        .execute();

      const loginInput: LoginInput = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const result = await login(loginInput);

      expect(result).toBeNull();
    });

    it('should work for admin role', async () => {
      // Create admin user
      await db.insert(usersTable)
        .values(testAdmin)
        .execute();

      const loginInput: LoginInput = {
        username: 'admin',
        password: 'adminpass123'
      };

      const result = await login(loginInput);

      expect(result).not.toBeNull();
      expect(result!.username).toEqual('admin');
      expect(result!.role).toEqual('admin');
      expect(result!.password).toEqual(''); // Password should be empty
    });

    it('should return null when no users exist', async () => {
      const loginInput: LoginInput = {
        username: 'nonexistent',
        password: 'password'
      };

      const result = await login(loginInput);

      expect(result).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('should return user data for valid user ID', async () => {
      // Create test user
      const userResult = await db.insert(usersTable)
        .values(testUser)
        .returning()
        .execute();

      const userId = userResult[0].id;

      const result = await validateSession(userId);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(userId);
      expect(result!.username).toEqual('testuser');
      expect(result!.password).toEqual(''); // Password should be empty
      expect(result!.role).toEqual('teacher');
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return null for invalid user ID', async () => {
      // Create test user
      await db.insert(usersTable)
        .values(testUser)
        .execute();

      const result = await validateSession(99999); // Non-existent ID

      expect(result).toBeNull();
    });

    it('should work for admin user', async () => {
      // Create admin user
      const adminResult = await db.insert(usersTable)
        .values(testAdmin)
        .returning()
        .execute();

      const adminId = adminResult[0].id;

      const result = await validateSession(adminId);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(adminId);
      expect(result!.username).toEqual('admin');
      expect(result!.role).toEqual('admin');
      expect(result!.password).toEqual(''); // Password should be empty
    });

    it('should return null when no users exist', async () => {
      const result = await validateSession(1);

      expect(result).toBeNull();
    });
  });
});
