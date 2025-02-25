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

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '请求失败')
  }

  const data = await response.json()
  return data.data || data
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

    // 部门相关
    departments: {
      update: (organizationId: string, departments: { id?: string; name: string; isDeleted?: boolean }[]) =>
        fetchWithAuth(`/api/organizations/${organizationId}/departments`, {
          method: 'PUT',
          body: JSON.stringify({ departments }),
        }),
    },
  },
  
  // 用户相关
  users: {
    list: (params?: { 
      page?: number; 
      pageSize?: number; 
      search?: string;
      organizationId?: string;
      role?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) =>
      fetchWithAuth('/api/users', { params: params as Record<string, string> }),
    
    create: (data: { 
      name: string; 
      email: string; 
      password: string;
      role: string;
      organizationId?: string;
      organizationIds?: string[];
    }) =>
      fetchWithAuth('/api/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    
    update: (id: string, data: { 
      name?: string; 
      email?: string; 
      role?: string;
      organizationId?: string;
      organizationIds?: string[];
      active?: boolean;
    }) =>
      fetchWithAuth(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    
    delete: (id: string) =>
      fetchWithAuth(`/api/users/${id}`, {
        method: 'DELETE',
      }),
    
    getById: (id: string) =>
      fetchWithAuth(`/api/users/${id}`),

    resetPassword: (id: string, password: string) =>
      fetchWithAuth(`/api/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
  },
} 