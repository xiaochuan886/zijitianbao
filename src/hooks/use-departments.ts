import { useEffect, useState } from "react";

interface Department {
  id: string;
  name: string;
  organizationId?: string;
}

export function useDepartments(organizationId?: string) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true);
        const url = organizationId
          ? `/api/departments?organizationId=${organizationId}`
          : "/api/departments";
          
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error("获取部门列表失败");
        }
        
        const data = await response.json();
        setDepartments(data);
      } catch (err) {
        console.error("获取部门列表出错:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, [organizationId]);

  return { departments, isLoading, error };
} 