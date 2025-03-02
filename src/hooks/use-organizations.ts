import { useEffect, useState } from "react";

interface Organization {
  id: string;
  name: string;
  code: string;
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/organizations");
        
        if (!response.ok) {
          throw new Error("获取组织列表失败");
        }
        
        const data = await response.json();
        setOrganizations(data);
      } catch (err) {
        console.error("获取组织列表出错:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  return { organizations, isLoading, error };
} 