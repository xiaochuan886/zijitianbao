"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"

export type ProjectFilters = {
  organization: string
  department: string
  project: string
  status: string
}

export type PredictionData = {
  id: string
  projectId: string
  subProjectId: string
  organization: string
  department: string
  project: string
  subProject: string
  month: string
  status: string
  predictUserStatus?: string
  remark?: string
  year: string
}

export function useFundingPredict() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<PredictionData[]>([])
  const [filters, setFilters] = useState<ProjectFilters>({
    organization: "all",
    department: "all",
    project: "",
    status: "all"
  })
  const prevFiltersRef = useRef(filters)
  const [organizations, setOrganizations] = useState<{value: string, label: string}[]>([])
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([])
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 获取当前月份的下一个月
  const getNextMonth = useCallback(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 2 // +1 是下个月，+1 是因为 getMonth() 从 0 开始
    return { year, month }
  }, [])

  // 获取项目列表
  const fetchProjects = useCallback(async (forceRefresh = false) => {
    try {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
      
      if (!forceRefresh && 
          JSON.stringify(filters) === JSON.stringify(prevFiltersRef.current) && 
          projects.length > 0) {
        return
      }
      
      prevFiltersRef.current = {...filters}
      setLoading(true)
      
      const nextMonth = getNextMonth()
      const response = await fetch(`/api/funding/predict/list?year=${nextMonth.year}&month=${nextMonth.month}`)
      
      if (!response.ok) {
        throw new Error("获取项目列表失败")
      }
      
      const data = await response.json()
      setProjects(data.projects)
      setOrganizations(data.organizations)
      setDepartments(data.departments)
    } catch (error) {
      console.error("获取项目列表失败", error)
      toast({
        title: "获取项目列表失败",
        description: error instanceof Error ? error.message : "请求失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, projects.length, toast, getNextMonth])

  // 提交项目
  const submitProject = async (projectId: string, subProjectId?: string) => {
    try {
      const nextMonth = getNextMonth()
      const response = await fetch(`/api/funding/predict/submit-single/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: nextMonth.year,
          month: nextMonth.month,
          subProjectId
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "提交失败")
      }
      
      toast({
        title: "提交成功",
        description: "项目已成功提交",
      })
      
      return true
    } catch (error) {
      console.error("提交失败", error)
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交失败",
        variant: "destructive"
      })
      return false
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    loading,
    projects,
    filters,
    setFilters,
    organizations,
    departments,
    fetchProjects,
    submitProject,
    getNextMonth
  }
}