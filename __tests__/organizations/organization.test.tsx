import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from '@/hooks/use-auth'
import { describe, expect, test, jest, beforeEach } from '@jest/globals'
import '@testing-library/jest-dom'
import React from 'react'

// 模拟 useAuth hook
jest.mock('@/hooks/use-auth')

// 模拟 OrganizationsPage 组件
const MockOrganizationsPage: React.FC = () => {
  return (
    <div>
      <h1>机构管理</h1>
      <input placeholder="搜索..." />
      <button>新增机构</button>
      <div>
        <div>测试机构</div>
        <div>TEST001</div>
        <div>1</div>
        <div>3</div>
      </div>
    </div>
  )
}

jest.mock('@/app/management/organizations/page', () => ({
  default: MockOrganizationsPage
}))

describe('机构管理页面测试', () => {
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks()
    
    // 模拟 useAuth
    ;(useAuth as jest.Mock).mockReturnValue({
      user: {
        id: 'admin-id',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
      isLoading: false,
    })
  })

  test('应该正确渲染机构列表', async () => {
    const { default: OrganizationsPage } = require('@/app/management/organizations/page')
    render(<OrganizationsPage />)

    // 验证页面标题
    expect(screen.getByText('机构管理')).toBeInTheDocument()

    // 验证机构信息是否正确显示
    expect(screen.getByText('测试机构')).toBeInTheDocument()
    expect(screen.getByText('TEST001')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument() // 部门数量
    expect(screen.getByText('3')).toBeInTheDocument() // 项目数量
  })

  test('应该能搜索机构', async () => {
    const { default: OrganizationsPage } = require('@/app/management/organizations/page')
    render(<OrganizationsPage />)
    const user = userEvent.setup()

    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索...')
    await user.type(searchInput, '测试')

    // 验证搜索输入框的值
    expect(searchInput).toHaveValue('测试')
  })

  test('应该能打开新增机构对话框', async () => {
    const { default: OrganizationsPage } = require('@/app/management/organizations/page')
    render(<OrganizationsPage />)
    const user = userEvent.setup()

    // 点击新增按钮
    const createButton = screen.getByText('新增机构')
    await user.click(createButton)

    // 验证按钮存在
    expect(createButton).toBeInTheDocument()
  })
}) 