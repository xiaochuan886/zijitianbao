'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  departments: {
    id: string;
    name: string;
  }[];
}

interface OrganizationSelectorProps {
  value: {
    organizationId: string;
    departmentIds: string[];
  }[];
  onChange: (value: { organizationId: string; departmentIds: string[]; }[]) => void;
  disabled?: boolean;
}

export function OrganizationSelector({ value, onChange, disabled }: OrganizationSelectorProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 从API获取机构列表
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations');
        const data = await response.json();
        setOrganizations(data);
      } catch (error) {
        console.error('获取机构列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleOrganizationChange = (index: number, organizationId: string) => {
    const newValue = [...value];
    newValue[index] = { organizationId, departmentIds: [] };
    onChange(newValue);
  };

  const handleDepartmentChange = (index: number, departmentIds: string[]) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], departmentIds };
    onChange(newValue);
  };

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleAdd = () => {
    onChange([...value, { organizationId: '', departmentIds: [] }]);
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {value.map((item, index) => {
        const organization = organizations.find(org => org.id === item.organizationId);
        
        return (
          <Card key={index} className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-4">
                <Select
                  value={item.organizationId}
                  onValueChange={(value) => handleOrganizationChange(index, value)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择机构" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {organization && (
                  <Select
                    value={item.departmentIds.join(',')}
                    onValueChange={(value) => handleDepartmentChange(index, value.split(','))}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent>
                      {organization.departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled || value.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={handleAdd}
        disabled={disabled}
        className="w-full"
      >
        添加机构
      </Button>
    </div>
  );
}