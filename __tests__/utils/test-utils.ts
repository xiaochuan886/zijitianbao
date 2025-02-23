import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestDepartment, TestOrganization } from '../types/test-types'
import { screen, waitFor } from '@testing-library/react'

// 创建模拟部门数据
export const createMockDepartment = (override: Partial<TestDepartment> = {}): TestDepartment => ({
  id: Math.random().toString(),
  name: '测试部门',
  parentId: null,
  order: 0,
  organizationId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...override
})

// 创建模拟机构数据
export const createMockOrganization = (override: Partial<TestOrganization> = {}): TestOrganization => ({
  id: 1,
  name: '测试机构',
  code: 'TEST',
  departments: 0,
  projects: 0,
  ...override
})

// 创建用户事件
export const setupUserEvent = () => userEvent.setup()

// 创建模拟 fetch 响应
export const createMockResponse = (data: any, options: ResponseInit = { status: 200 }) => {
  const status = options.status ?? 200
  return {
    ok: status >= 200 && status < 300,
    json: async () => data,
    status,
    headers: new Headers(options.headers)
  }
}

// 等待元素加载的工具函数
export const waitForElement = async (getElement: () => Element | null) => {
  let element = null
  let attempts = 0
  const maxAttempts = 50
  const interval = 100

  while (!element && attempts < maxAttempts) {
    element = getElement()
    if (!element) {
      await new Promise(resolve => setTimeout(resolve, interval))
      attempts++
    }
  }

  return element
}

// 自定义渲染函数
export const renderWithProviders = (ui: React.ReactElement) => {
  return {
    ...render(ui),
    user: setupUserEvent()
  }
}

// 等待对话框加载
export const waitForDialog = async (role: string = "dialog") => {
  return await waitFor(() => {
    const dialog = screen.getByRole(role)
    expect(dialog).toBeInTheDocument()
    return dialog
  })
}

// 等待对话框内容加载
export const waitForDialogContent = async (textMatcher: string | RegExp | ((content: string) => boolean)) => {
  return await waitFor(() => {
    const content = screen.getByText(textMatcher)
    expect(content).toBeInTheDocument()
    return content
  })
}

// 等待动画完成
export const waitForAnimation = async (element: Element, state: string = "open") => {
  await waitFor(() => {
    expect(element).toHaveAttribute("data-state", state)
  })
}

// 等待加载状态消失
export const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByText("加载中...")).not.toBeInTheDocument()
  })
}

// 查找对话框标题
export const findDialogTitle = (text: string) => {
  const elements = screen.getAllByText(text)
  return elements.find(el => el.tagName === "H2")
}

// 查找按钮
export const findButtonByName = (name: string) => {
  return screen.getByRole("button", { name: new RegExp(name, "i") })
}

// 创建错误响应
export const createErrorResponse = (message: string) => {
  return Promise.resolve({
    ok: false,
    status: 400,
    json: () => Promise.resolve({ message })
  })
}

// 等待错误提示
export const waitForErrorMessage = async (message: string) => {
  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent(message)
  })
}

// 等待成功提示
export const waitForSuccessMessage = async (message: string) => {
  await waitFor(() => {
    expect(screen.getByRole("status")).toHaveTextContent(message)
  })
}

// 等待表单错误消息
export const waitForFormError = async (message: string) => {
  await waitFor(() => {
    const errorMessage = screen.getByRole("alert")
    expect(errorMessage).toHaveTextContent(message)
  })
}

// 生成测试数据
export const generateTestData = {
  // 生成部门树
  departmentTree: (depth: number = 3, breadth: number = 3): TestDepartment[] => {
    const generateDepartment = (level: number, parentId: string | null = null): TestDepartment[] => {
      if (level >= depth) return []
      
      const departments: TestDepartment[] = []
      for (let i = 0; i < breadth; i++) {
        const id = `${level}-${i}`
        departments.push({
          id,
          name: `部门${id}`,
          parentId,
          order: i,
          organizationId: '1',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        departments.push(...generateDepartment(level + 1, id))
      }
      return departments
    }
    
    return generateDepartment(0)
  },
  
  // 生成特殊字符部门名称
  specialDepartmentNames: [
    '   空格测试   ',
    '引号"测试"',
    '换行\n测试',
    '特殊字符!@#$%^&*()',
    'a'.repeat(51)
  ]
} 