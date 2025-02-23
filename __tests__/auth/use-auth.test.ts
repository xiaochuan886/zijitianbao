import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useAuth Hook 测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('应该正确获取用户信息', async () => {
    const mockUser = {
      id: '1',
      name: '测试用户',
      role: 'ADMIN',
      organizationId: '1',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user: mockUser }),
    })

    const { result } = renderHook(() => useAuth())

    // 初始状态
    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.error).toBe(null)

    // 等待数据加载
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 验证结果
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.error).toBe(null)
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me')
  })

  test('应该处理获取用户信息失败的情况', async () => {
    const errorMessage = '获取用户信息失败'
    mockFetch.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useAuth())

    // 初始状态
    expect(result.current.isLoading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.error).toBe(null)

    // 等待错误处理
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 验证错误状态
    expect(result.current.user).toBe(null)
    expect(result.current.error).toEqual(new Error(errorMessage))
  })

  test('应该处理API返回错误的情况', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBe(null)
    expect(result.current.error).toEqual(new Error('获取用户信息失败'))
  })
}) 