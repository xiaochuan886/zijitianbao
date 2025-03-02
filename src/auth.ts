import NextAuth from "next-auth"
import { authOptions } from "./lib/auth-options"

// Next.js 14 App Router 兼容的 Auth.js 配置
const handler = NextAuth(authOptions)

// 导出为处理函数和辅助方法
export const { auth, signIn, signOut, handlers } = handler 