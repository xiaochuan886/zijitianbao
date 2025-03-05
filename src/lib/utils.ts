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

/**
 * 格式化日期为本地字符串
 * @param dateString 日期字符串或Date对象
 * @param options 格式化选项
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleString("zh-CN", options);
}

/**
 * 格式化金额为人民币格式
 * @param amount 金额数值
 * @returns 格式化后的金额字符串
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * 截断文本并添加省略号
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
