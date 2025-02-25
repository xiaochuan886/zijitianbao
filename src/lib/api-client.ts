const getAuthToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>
}

async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // 处理查询参数
  if (options.params) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value)
    })
    url = `${url}?${searchParams.toString()}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || '请求失败')
  }

  return data
}

export const apiClient = {
  // 机构相关
  organizations: {
    list: (params?: { page?: number; pageSize?: number; search?: string }) =>
      fetchWithAuth('/api/organizations', { params: params as Record<string, string> }),
    
    create: (data: { name: string; code: string }) =>
      fetchWithAuth('/api/organizations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: { name: string; code: string }) =>
      fetchWithAuth(`/api/organizations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      fetchWithAuth(`/api/organizations/${id}`, {
        method: 'DELETE',
      }),
    
    getById: (id: string) =>
      fetchWithAuth(`/api/organizations/${id}`),
  },
} 