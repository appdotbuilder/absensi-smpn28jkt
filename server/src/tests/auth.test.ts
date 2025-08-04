
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type CreateUserInput } from '../schema';
import { login, validateSession } from '../handlers/auth';
import { createUser } from '../handlers/user_management';

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
      // Create test user with proper password hashing
      await createUser(testUser);

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
      // Create test user with proper password hashing
      await createUser(testUser);

      const loginInput: LoginInput = {
        username: 'wronguser',
        password: 'testpass123'
      };

      const result = await login(loginInput);

      expect(result).toBeNull();
    });

    it('should return null for invalid password', async () => {
      // Create test user with proper password hashing
      await createUser(testUser);

      const loginInput: LoginInput = {
        username: 'testuser',
        password: 'wrongpassword'
      };

      const result = await login(loginInput);

      expect(result).toBeNull();
    });

    it('should work for admin role', async () => {
      // Create admin user with proper password hashing
      await createUser(testAdmin);

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
      // Create test user with proper password hashing
      const userResult = await createUser(testUser);

      const userId = userResult.id;

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
      // Create test user with proper password hashing
      await createUser(testUser);

      const result = await validateSession(99999); // Non-existent ID

      expect(result).toBeNull();
    });

    it('should work for admin user', async () => {
      // Create admin user with proper password hashing
      const adminResult = await createUser(testAdmin);

      const adminId = adminResult.id;

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
