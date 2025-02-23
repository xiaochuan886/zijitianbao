import { Department } from '@prisma/client'

// 扩展 Department 类型
export interface TestDepartment extends Department {
  id: string
  name: string
  parentId: string | null
  order: number
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

// Organization 类型
export interface TestOrganization {
  id: number
  name: string
  code: string
  departments: number
  projects: number
}

// 声明全局类型
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
    }
  }
} 