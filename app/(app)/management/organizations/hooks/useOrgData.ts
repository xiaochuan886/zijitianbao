import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Organization } from "../columns"

interface UseOrgDataReturn {
  data: Organization[]
  isLoading: boolean
  error: Error | null
  totalCount: number
  currentPage: number
  pageSize: number
  fetchData: (page?: number, search?: string) => Promise<void>
}

export function useOrgData(): UseOrgDataReturn {
  const [data, setData] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const searchParams = useSearchParams()

  const fetchData = useCallback(async (page = 1, search = "") => {
    try {
      setIsLoading(true)
      setError(null)
      setCurrentPage(page)
      
      const response = await fetch(
        `/api/organizations?page=${page}&pageSize=${pageSize}&search=${search}`
      )
      
      if (!response.ok) {
        throw new Error("获取机构数据失败")
      }

      const result = await response.json()
      setData(result.data)
      setTotalCount(result.total)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("未知错误"))
    } finally {
      setIsLoading(false)
    }
  }, [pageSize])

  return {
    data,
    isLoading,
    error,
    totalCount,
    currentPage,
    pageSize,
    fetchData,
  }
} 