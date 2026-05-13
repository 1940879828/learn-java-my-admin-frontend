import { ErrorCode } from '../types/common';

export const ERROR_MESSAGES: Record<number, string> = {
  [ErrorCode.VALIDATION_FAILED]: '请检查输入内容',
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.REFRESH_TOKEN_INVALID]: '会话已失效，请重新登录',
  [ErrorCode.FORBIDDEN]: '您无权执行该操作',
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.ROLE_NOT_FOUND]: '角色不存在',
  [ErrorCode.MENU_NOT_FOUND]: '菜单不存在',
  [ErrorCode.DUPLICATE_RESOURCE]: '资源已存在',
  [ErrorCode.RESOURCE_IN_USE]: '资源被占用，无法删除',
  [ErrorCode.LOCKED]: '账户已被锁定，请联系管理员',
  [ErrorCode.TOO_MANY_REQUESTS]: '请求过于频繁，请稍后再试',
  [ErrorCode.INTERNAL_ERROR]: '服务器繁忙，请稍后再试',
};

export const friendlyMessage = (code: number, fallback: string): string =>
  ERROR_MESSAGES[code] ?? fallback;
