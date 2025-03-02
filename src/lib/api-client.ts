import { toast } from "sonner"

/**
 * API调用基础类，实现请求处理和错误处理
 */
class ApiBase {
  // API 基础URL
  private baseUrl: string = "/api"
  // 最大重试次数
  private maxRetries: number = 1
  
  /**
   * 执行API请求并处理错误
   * @param endpoint API端点
   * @param options 请求选项
   * @returns 请求响应数据
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    const config = {
      ...options,
      headers,
    }

    return this.fetchWithRetry<T>(url, config, this.maxRetries)
  }

  /**
   * 支持重试的请求方法
   */
  private async fetchWithRetry<T>(
    url: string,
    config: RequestInit,
    retriesLeft: number
  ): Promise<T> {
    try {
      const response = await fetch(url, config)

      // 如果响应不成功，抛出错误
      if (!response.ok) {
        // 检查是否是认证错误
        if (response.status === 401) {
          // 如果是认证错误，重定向到登录页面
          // 但给用户一个提示
          toast.error("登录已过期，请重新登录")
          setTimeout(() => {
            window.location.href = "/auth/login"
          }, 1500)
          throw new Error("未授权访问，请重新登录")
        }

        const errorData = await response.json().catch(() => ({
          error: "未知错误",
        }))
        throw new Error(errorData.error || `请求失败: ${response.status}`)
      }

      // 检查响应内容类型
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        return await response.json()
      } else {
        // 非JSON响应
        return await response.text() as unknown as T
      }
    } catch (error: any) {
      if (retriesLeft > 0 && !error.message.includes("未授权访问")) {
        console.log(`请求失败，剩余重试次数: ${retriesLeft}`)
        // 延迟重试
        await new Promise(r => setTimeout(r, 1000))
        return this.fetchWithRetry<T>(url, config, retriesLeft - 1)
      }
      throw error
    }
  }

  /**
   * GET请求
   */
  protected get<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    // 构建URL查询参数
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const url = params && Object.keys(params).length
      ? `${endpoint}?${queryParams.toString()}`
      : endpoint

    return this.request<T>(url, {
      method: "GET",
    })
  }

  /**
   * POST请求
   */
  protected post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT请求
   */
  protected put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE请求
   */
  protected delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    })
  }
}

// 组织类型定义
interface Organization {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

// 组织与关联数据类型
interface OrganizationWithRelations extends Organization {
  departments: { id: string; name: string }[];
  users: { id: string; name: string; role: string }[];
  projects: { id: string; name: string; status: string }[];
}

// 部门类型
interface Department {
  id?: string;
  name: string;
  isDeleted?: boolean;
}

/**
 * 组织API客户端
 */
class OrganizationsApi extends ApiBase {
  /**
   * 获取组织列表
   */
  async list(includeRelations: boolean = true): Promise<OrganizationWithRelations[] | Organization[]> {
    return this.get('/organizations', { includeRelations });
  }

  /**
   * 创建组织
   */
  async create(data: { name: string; code: string }): Promise<Organization> {
    return this.post<Organization>('/organizations', data);
  }

  /**
   * 更新组织
   */
  async update(id: string, data: { name: string; code: string }): Promise<Organization> {
    return this.put<Organization>(`/organizations/${id}`, data);
  }

  /**
   * 删除组织
   */
  async delete(id: string): Promise<void> {
    return this.delete<void>(`/organizations/${id}`);
  }

  /**
   * 组织部门API
   */
  departments = {
    /**
     * 更新部门
     */
    update: (organizationId: string, departments: Department[]): Promise<void> => {
      return this.put<void>(`/organizations/${organizationId}/departments`, { departments });
    }
  }
}

/**
 * 项目API客户端
 */
class ProjectsApi extends ApiBase {
  /**
   * 获取项目列表
   */
  async list() {
    return this.get('/projects');
  }

  // 其他项目相关API方法...
}

/**
 * 用户API客户端
 */
class UsersApi extends ApiBase {
  /**
   * 获取用户列表
   */
  async list() {
    return this.get('/users');
  }

  // 其他用户相关API方法...
}

/**
 * API客户端实例
 */
export const apiClient = {
  organizations: new OrganizationsApi(),
  projects: new ProjectsApi(),
  users: new UsersApi(),
}