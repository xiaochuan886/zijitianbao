export class PermissionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

export const PermissionErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  INVALID_RESOURCE: 'INVALID_RESOURCE',
  INVALID_ACTION: 'INVALID_ACTION',
  CACHE_ERROR: 'CACHE_ERROR',
  AUDIT_ERROR: 'AUDIT_ERROR',
} as const;

export function createPermissionError(
  code: keyof typeof PermissionErrorCodes,
  message?: string,
  details?: unknown
): PermissionError {
  const statusCodes: Record<keyof typeof PermissionErrorCodes, number> = {
    UNAUTHORIZED: 401,
    INSUFFICIENT_PERMISSIONS: 403,
    INVALID_RESOURCE: 400,
    INVALID_ACTION: 400,
    CACHE_ERROR: 500,
    AUDIT_ERROR: 500,
  };

  const defaultMessages: Record<keyof typeof PermissionErrorCodes, string> = {
    UNAUTHORIZED: '未授权访问',
    INSUFFICIENT_PERMISSIONS: '权限不足',
    INVALID_RESOURCE: '无效的资源',
    INVALID_ACTION: '无效的操作',
    CACHE_ERROR: '权限缓存错误',
    AUDIT_ERROR: '审计日志错误',
  };

  return new PermissionError(
    message || defaultMessages[code],
    PermissionErrorCodes[code],
    statusCodes[code],
    details
  );
}

export function handlePermissionError(error: unknown): PermissionError {
  if (error instanceof PermissionError) {
    return error;
  }

  if (error instanceof Error) {
    return createPermissionError(
      'INSUFFICIENT_PERMISSIONS',
      error.message,
      { originalError: error }
    );
  }

  return createPermissionError(
    'INSUFFICIENT_PERMISSIONS',
    '未知权限错误',
    { originalError: error }
  );
} 