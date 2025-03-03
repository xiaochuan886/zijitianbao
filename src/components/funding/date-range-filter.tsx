"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { RotateCcw, Search } from "lucide-react"

export interface DateRangeFilterProps {
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  onChange: (range: { startYear: number; startMonth: number; endYear: number; endMonth: number }) => void
  onReset?: () => void
  onSearch?: () => void
}

export function DateRangeFilter({
  startYear,
  startMonth,
  endYear,
  endMonth,
  onChange,
  onReset,
  onSearch,
}: DateRangeFilterProps) {
  // 本地状态，用于跟踪用户选择但尚未提交的值
  const [localRange, setLocalRange] = useState({
    startYear,
    startMonth,
    endYear,
    endMonth
  });

  // 当props变化时更新本地状态
  useEffect(() => {
    setLocalRange({
      startYear,
      startMonth,
      endYear,
      endMonth
    });
  }, [startYear, startMonth, endYear, endMonth]);

  // 生成年份选项
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return {
      value: year.toString(),
      label: `${year}年`,
    }
  })

  // 生成月份选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    return {
      value: month.toString(),
      label: `${month}月`,
    }
  })

  // 处理本地值变化
  const handleLocalChange = (field: string, value: number) => {
    const newRange = { ...localRange, [field]: value };
    setLocalRange(newRange);
  };

  // 处理搜索按钮点击
  const handleSearch = () => {
    console.log("搜索按钮点击，提交日期范围:", localRange);
    
    // 将本地状态提交给父组件
    onChange(localRange);
    
    // 如果提供了onSearch回调，则调用它
    if (onSearch) {
      console.log("调用onSearch回调");
      onSearch();
    }
  };

  // 处理重置
  const handleReset = () => {
    console.log("重置按钮点击");
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium">开始年份</label>
          <Combobox
            options={yearOptions}
            value={localRange.startYear.toString()}
            onChange={(value) => handleLocalChange("startYear", parseInt(value))}
            placeholder="选择开始年份"
          />
        </div>

        <div>
          <label className="text-sm font-medium">开始月份</label>
          <Combobox
            options={monthOptions}
            value={localRange.startMonth.toString()}
            onChange={(value) => handleLocalChange("startMonth", parseInt(value))}
            placeholder="选择开始月份"
          />
        </div>

        <div>
          <label className="text-sm font-medium">结束年份</label>
          <Combobox
            options={yearOptions}
            value={localRange.endYear.toString()}
            onChange={(value) => handleLocalChange("endYear", parseInt(value))}
            placeholder="选择结束年份"
          />
        </div>

        <div>
          <label className="text-sm font-medium">结束月份</label>
          <Combobox
            options={monthOptions}
            value={localRange.endMonth.toString()}
            onChange={(value) => handleLocalChange("endMonth", parseInt(value))}
            placeholder="选择结束月份"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onReset && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
        )}
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          搜索
        </Button>
      </div>
    </div>
  )
} 