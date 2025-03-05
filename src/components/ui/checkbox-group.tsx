"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export interface CheckboxOption {
  value: string
  label: string
}

interface CheckboxGroupProps {
  options: CheckboxOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
  id?: string
  disabled?: boolean
}

export function CheckboxGroup({
  options,
  selected = [],
  onChange,
  className,
  id,
  disabled = false,
}: CheckboxGroupProps) {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selected, value])
    } else {
      onChange(selected.filter((item) => item !== value))
    }
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <Checkbox
            id={`${id}-${option.value}`}
            checked={selected.includes(option.value)}
            onCheckedChange={(checked) => handleChange(option.value, !!checked)}
            disabled={disabled}
          />
          <Label 
            htmlFor={`${id}-${option.value}`}
            className="cursor-pointer"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  )
} 