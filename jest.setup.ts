/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { beforeEach, jest } from '@jest/globals';

// Mock PrismaClient
const prismaMock = mockDeep<PrismaClient>();

// Mock prisma module
jest.mock('./lib/prisma', () => ({
  prisma: prismaMock
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
  compare: jest.fn().mockImplementation(() => Promise.resolve(true))
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementation((...args: any[]) => {
    const token = args[0];
    if (token === 'admin-token') {
      return {
        user: {
          id: 'admin-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
          organizationId: null,
          departmentId: null,
        },
      };
    }
    throw new Error('Invalid token');
  }),
  sign: jest.fn(),
}));

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
  jest.clearAllMocks();
});

export { prismaMock }; 