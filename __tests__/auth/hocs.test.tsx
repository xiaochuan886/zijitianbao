import { render, screen, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/use-auth'
import { withAdminPermission } from '@/lib/auth/hocs'
import { useRouter } from 'next/navigation'

// Mock useAuth and useRouter
jest.mock('@/hooks/use-auth')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('权限控制 HOC 测试', () => {
  // 创建一个测试组件
  const TestComponent = () => <div>测试组件内容</div>
  const WrappedComponent = withAdminPermission(TestComponent)

  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  test('管理员用户应该能看到组件内容', async () => {
    // 模拟管理员用户
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { role: 'ADMIN' },
      isLoading: false,
    })

    render(<WrappedComponent />)
    
    expect(screen.getByText('测试组件内容')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('非管理员用户应该被重定向到仪表盘', async () => {
    // 模拟普通用户
    ;(useAuth as jest.Mock).mockReturnValue({
      user: { role: 'USER' },
      isLoading: false,
    })

    render(<WrappedComponent />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
    expect(screen.queryByText('测试组件内容')).not.toBeInTheDocument()
  })

  test('未登录用户应该被重定向到仪表盘', async () => {
    // 模拟未登录状态
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
    })

    render(<WrappedComponent />)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
    expect(screen.queryByText('测试组件内容')).not.toBeInTheDocument()
  })

  test('加载中状态应该显示加载提示', () => {
    // 模拟加载状态
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
    })

    render(<WrappedComponent />)

    expect(screen.getByText('加载中...')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
}) 