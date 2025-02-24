// 通用响应类型
export interface ApiResponse<T> {
  code: number;      // 状态码
  message: string;   // 响应消息
  data?: T;         // 响应数据
  timestamp: number; // 时间戳
}

// 分页请求参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应数据
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 查询参数
export interface QueryParams {
  search?: string;
  filters?: Record<string, unknown>;
  sorting?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

// 服务错误
export class ServiceError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
} 