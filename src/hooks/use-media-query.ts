import { useEffect, useState } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)
  
  useEffect(() => {
    // 创建媒体查询
    const mediaQuery = window.matchMedia(query)
    
    // 设置初始值
    setMatches(mediaQuery.matches)
    
    // 定义事件处理函数
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // 添加事件监听器
    mediaQuery.addEventListener("change", handleChange)
    
    // 清理函数
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [query])
  
  return matches
} 