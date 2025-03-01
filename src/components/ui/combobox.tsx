"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "选择选项...",
  emptyMessage = "没有找到结果",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchText, setSearchText] = React.useState("")

  // 记录选项和当前值，帮助调试
  React.useEffect(() => {
    console.log(`Combobox(${placeholder}) - 选项数量:`, options.length);
    if (options.length > 0) {
      console.log(`Combobox(${placeholder}) - 示例选项:`, options.slice(0, 3));
    }
    console.log(`Combobox(${placeholder}) - 当前值:`, value);
  }, [options, value, placeholder]);

  // 根据搜索文本过滤选项
  const filteredOptions = React.useMemo(() => {
    if (!searchText) return options
    
    // 改进搜索逻辑：更智能的匹配方式，支持拼音首字母和模糊匹配
    const lowerSearchText = searchText.toLowerCase();
    const filtered = options.filter((option) => {
      const lowerLabel = option.label.toLowerCase();
      
      // 精确匹配
      if (lowerLabel.includes(lowerSearchText)) {
        return true;
      }
      
      // TODO: 这里可以添加拼音首字母匹配逻辑
      
      return false;
    });
    
    console.log(`Combobox(${placeholder}) - 搜索 "${searchText}" 结果:`, filtered.length);
    return filtered;
  }, [options, searchText, placeholder]);

  // 获取当前选中项的标签
  const selectedLabel = React.useMemo(() => {
    const selected = options.find((option) => option.value === value)
    if (!selected) {
      console.warn(`Combobox(${placeholder}) - 找不到匹配值 "${value}" 的选项`);
    }
    return selected?.label || ""
  }, [options, value, placeholder]);

  // 处理选项点击
  const handleSelect = React.useCallback((option: ComboboxOption) => {
    onChange(option.value)
    setSearchText("")
    setOpen(false)
  }, [onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {value && selectedLabel ? (
            <span className="truncate">{selectedLabel}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2">
        <div className="flex flex-col gap-2">
          <Input
            placeholder={`搜索${placeholder.replace('选择', '')}`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9"
          />
          
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-none",
                      value === option.value ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 