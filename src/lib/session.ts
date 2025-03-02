import { redirect } from 'next/navigation';
import { Role } from "./enums";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";

/**
 * 从NextAuth会话中获取当前登录用户
 * @returns 当前登录用户或null
 */
export async function getCurrentUser() {
  try {
    // 使用 getServerSession 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log("未找到用户会话");
      return null;
    }
    
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      image: session.user.image
    };
  } catch (error) {
    console.error("获取当前用户失败:", error);
    return null;
  }
}

/**
 * 验证用户是否已登录，未登录则重定向到登录页
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    console.log("用户未登录，重定向到登录页");
    redirect('/auth/login');
  }
  
  return user;
}

/**
 * 验证用户角色权限
 * @param allowedRoles 允许的角色数组
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth();
  
  if (!allowedRoles.includes(user.role)) {
    console.log(`用户角色 ${user.role} 不在允许的角色列表中: ${allowedRoles.join(', ')}`);
    redirect('/unauthorized');
  }
  
  return user;
}

/**
 * 检查用户是否为管理员
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === Role.ADMIN;
} 