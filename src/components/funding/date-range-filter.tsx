"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { RotateCcw } from "lucide-react"

export interface DateRangeFilterProps {
  startYear: number
  startMonth: number
  endYear: number
  endMonth: number
  onChange: (range: { startYear: number; startMonth: number; endYear: number; endMonth: number }) => void
  onReset?: () => void
}

export function DateRangeFilter({
  startYear,
  startMonth,
  endYear,
  endMonth,
  onChange,
  onReset,
}: DateRangeFilterProps) {
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">开始年份</label>
            <Combobox
              options={yearOptions}
              value={startYear.toString()}
              onChange={(value) =>
                onChange({
                  startYear: parseInt(value),
                  startMonth,
                  endYear,
                  endMonth,
                })
              }
              placeholder="选择开始年份"
            />
          </div>

          <div>
            <label className="text-sm font-medium">开始月份</label>
            <Combobox
              options={monthOptions}
              value={startMonth.toString()}
              onChange={(value) =>
                onChange({
                  startYear,
                  startMonth: parseInt(value),
                  endYear,
                  endMonth,
                })
              }
              placeholder="选择开始月份"
            />
          </div>

          <div>
            <label className="text-sm font-medium">结束年份</label>
            <Combobox
              options={yearOptions}
              value={endYear.toString()}
              onChange={(value) =>
                onChange({
                  startYear,
                  startMonth,
                  endYear: parseInt(value),
                  endMonth,
                })
              }
              placeholder="选择结束年份"
            />
          </div>

          <div>
            <label className="text-sm font-medium">结束月份</label>
            <Combobox
              options={monthOptions}
              value={endMonth.toString()}
              onChange={(value) =>
                onChange({
                  startYear,
                  startMonth,
                  endYear,
                  endMonth: parseInt(value),
                })
              }
              placeholder="选择结束月份"
            />
          </div>
        </div>

        {onReset && (
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重置
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 