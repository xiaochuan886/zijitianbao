'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface FundingType {
  id: string;
  name: string;
}

interface SubProject {
  name: string;
  fundingTypes: string[];
}

interface SubProjectFormProps {
  form: UseFormReturn<any>;
  disabled?: boolean;
}

export function SubProjectForm({ form, disabled }: SubProjectFormProps) {
  const [fundingTypes, setFundingTypes] = useState<FundingType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFundingTypes = async () => {
      try {
        const response = await fetch('/api/funding-types');
        const { data } = await response.json();
        setFundingTypes(data.items || []);
      } catch (error) {
        console.error('获取资金需求类型失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFundingTypes();
  }, []);

  const subProjects = form.watch('subProjects') as SubProject[];

  const handleRemove = (index: number) => {
    const currentSubProjects = form.getValues('subProjects');
    form.setValue('subProjects', currentSubProjects.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {subProjects.map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-4">
              <FormField
                control={form.control}
                name={`subProjects.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>子项目名称</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={disabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`subProjects.${index}.fundingTypes`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>资金需求类型</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? field.value.join(',') : ''}
                        onValueChange={(value) => field.onChange(value ? value.split(',') : [])}
                        disabled={disabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择资金需求类型" />
                        </SelectTrigger>
                        <SelectContent>
                          {fundingTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemove(index)}
              disabled={disabled || subProjects.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}