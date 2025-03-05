/**
 * API基础类
 * 提供基本的HTTP请求方法
 */
export class ApiBase {
  // API 基础URL
  protected baseUrl: string = "/api"
  // 最大重试次数
  protected maxRetries: number = 1

  /**
   * GET 请求
   */
  protected async get(endpoint: string, params?: Record<string, any>) {
    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : ''
    return this.request(`${endpoint}${queryString}`, { method: 'GET' })
  }

  /**
   * POST 请求
   */
  protected async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * PUT 请求
   */
  protected async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * DELETE 请求
   */
  protected async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  /**
   * 执行API请求并处理错误
   */
  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
  private async fetchWithRetry<T>(url: string, config: RequestInit, retriesLeft: number): Promise<T> {
    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth/login"
          throw new Error("未授权访问，请重新登录")
        }

        const errorData = await response.json().catch(() => ({
          error: "未知错误",
        }))
        throw new Error(errorData.error || `请求失败: ${response.status}`)
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        return await response.json()
      } else {
        return await response.text() as unknown as T
      }
    } catch (error: any) {
      if (retriesLeft > 0 && !error.message.includes("未授权访问")) {
        console.log(`请求失败，剩余重试次数: ${retriesLeft}`)
        await new Promise(r => setTimeout(r, 1000))
        return this.fetchWithRetry<T>(url, config, retriesLeft - 1)
      }
      throw error
    }
  }
}