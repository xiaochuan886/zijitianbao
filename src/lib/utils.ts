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
 * 格式化货币显示
 * @param value 数值
 * @param currency 货币符号，默认为¥
 * @param decimals 小数位数，默认为2
 * @returns 格式化后的货币字符串
 */
export function formatCurrency(
  value: number | undefined | null,
  currency: string = "¥",
  decimals: number = 2
): string {
  if (value === undefined || value === null) {
    return `${currency}0.00`;
  }

  const formatter = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${currency}${formatter.format(value)}`;
}

/**
 * 格式化日期显示
 * @param date 日期对象或日期字符串
 * @param format 格式化模式，默认为'yyyy-MM-dd'
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string | undefined | null,
  format: string = "yyyy-MM-dd"
): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  
  if (!(d instanceof Date) || isNaN(d.getTime())) {
    return "";
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return format
    .replace("yyyy", String(year))
    .replace("MM", month)
    .replace("dd", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
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
