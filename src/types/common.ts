export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
  timestamp?: string;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export enum ErrorCode {
  SUCCESS = 200,
  VALIDATION_FAILED = 40001,
  UNAUTHORIZED = 40100,
  REFRESH_TOKEN_INVALID = 40101,
  FORBIDDEN = 40300,
  NOT_FOUND = 40400,
  USER_NOT_FOUND = 40401,
  ROLE_NOT_FOUND = 40402,
  MENU_NOT_FOUND = 40403,
  DUPLICATE_RESOURCE = 40901,
  RESOURCE_IN_USE = 40902,
  LOCKED = 42300,
  TOO_MANY_REQUESTS = 42900,
  INTERNAL_ERROR = 50000,
}
