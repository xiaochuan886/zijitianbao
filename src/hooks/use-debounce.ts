import { useCallback, useRef } from 'react'

/**
 * 创建一个防抖函数钩子
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (immediate?: boolean) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    (immediate = false) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (immediate) {
        fn()
        return
      }

      timeoutRef.current = setTimeout(() => {
        fn()
      }, delay)
    },
    [fn, delay]
  )
} 