import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 获取当前年月
 * @returns 包含年份和月份的对象
 */
export function getCurrentMonth() {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1 // JavaScript 月份从 0 开始，需要 +1
  }
}
