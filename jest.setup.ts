/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';
import { NextResponse } from 'next/server';
import { Session, Permission } from '@/lib/auth/types';
import { PrismaClient } from '.prisma/client';

// 添加全局类型定义
declare global {
  var TextEncoder: typeof TextEncoder
  var TextDecoder: typeof TextDecoder
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveValue(value: string | number | string[]): R
      toHaveStyle(style: Record<string, any>): R
    }
  }
}

// Mock TextEncoder/TextDecoder
Object.defineProperty(global, 'TextEncoder', {
  value: TextEncoder,
})

Object.defineProperty(global, 'TextDecoder', {
  value: TextDecoder,
})

// 模拟 window 对象
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// 模拟 ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver

// 模拟 IntersectionObserver
const mockIntersectionObserver = jest.fn().mockImplementation(() => ({
  root: null,
  rootMargin: '',
  thresholds: [],
  disconnect: jest.fn(),
  observe: jest.fn(),
  takeRecords: jest.fn(),
  unobserve: jest.fn(),
}))

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: mockIntersectionObserver,
})

// 模拟 fetch
const mockFetchImplementation = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return Promise.resolve(new Response())
}

Object.defineProperty(global, 'fetch', {
  writable: true,
  value: jest.fn(mockFetchImplementation),
})

// 模拟 next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    set: jest.fn(),
  }),
}))

// Mock Response and NextRequest
class MockResponse {
  private body: any
  private options: ResponseInit

  constructor(body?: BodyInit | null, init: ResponseInit = {}) {
    this.body = body
    this.options = init
  }

  get status() {
    return this.options.status || 200
  }

  get headers() {
    return new Headers(this.options.headers)
  }

  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }

  static json(data: any, init: ResponseInit = {}) {
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    })
  }
}

class MockRequest {
  private url: string
  private options: RequestInit

  constructor(url: string, options: RequestInit = {}) {
    this.url = url
    this.options = options
  }

  get headers() {
    return this.options.headers || {}
  }
}

global.Response = MockResponse as any
global.Request = MockRequest as any
global.Headers = Headers

// Mock next/server
jest.mock('next/server', () => {
  class MockNextResponse extends Response {
    static json(data: any, init?: ResponseInit) {
      return new MockNextResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
      })
    }

    static redirect(url: string) {
      return new MockNextResponse(null, {
        status: 302,
        headers: { Location: url },
      })
    }

    static next() {
      return new MockNextResponse(null)
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockRequest,
  }
})

// Mock session
jest.mock('@/lib/auth/session', () => ({
  parseSession: jest.fn((authHeader: string | null): Session | null => {
    if (authHeader === 'Bearer admin-token') {
      return {
        user: {
          id: 'admin-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
          organizationId: null,
          departmentId: null,
        },
      }
    }
    return null
  }),
}))

// Mock permission
jest.mock('@/lib/auth/permission', () => ({
  checkPermission: jest.fn(async (session: Session | null, required: Permission): Promise<boolean> => {
    if (!session?.user) return false
    return session.user.role === 'ADMIN'
  }),
}))

// 模拟 bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('hashed_password')),
  compare: jest.fn(() => Promise.resolve(true)),
}))

// 模拟 jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock_token'),
  verify: jest.fn(() => ({ userId: '1' })),
}))

// 模拟 PrismaClient
jest.mock('.prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      organization: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      department: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
  }
})

// Mock sonner
jest.mock('sonner', () => {
  const mockToast = {
    success: jest.fn(),
    error: jest.fn(),
    promise: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  }
  return {
    toast: mockToast,
    Toaster: () => null,
  }
})

// 在每个测试前设置必要的 DOM 环境
beforeEach(() => {
  // 清除所有模拟
  jest.clearAllMocks()
  
  // 添加 portal 根节点
  if (!document.getElementById('portal-root')) {
    const portalRoot = document.createElement('div')
    portalRoot.setAttribute('id', 'portal-root')
    document.body.appendChild(portalRoot)
  }

  // 添加 sheet 根节点
  if (!document.getElementById('sheet-portal')) {
    const sheetPortal = document.createElement('div')
    sheetPortal.setAttribute('id', 'sheet-portal')
    document.body.appendChild(sheetPortal)
  }

  // 添加 dialog 根节点
  if (!document.getElementById('dialog-portal')) {
    const dialogPortal = document.createElement('div')
    dialogPortal.setAttribute('id', 'dialog-portal')
    document.body.appendChild(dialogPortal)
  }
}) 