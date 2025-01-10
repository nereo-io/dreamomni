"use client"

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HourSelectProps {
  value?: number;
  onChange?: (hour: number) => void;
}

export function HourSelect({ value, onChange }: HourSelectProps) {
  const defaultHour = value ?? new Date().getHours()
  
  const handleValueChange = React.useCallback((newValue: string) => {
    onChange?.(parseInt(newValue))
  }, [onChange])

  return (
    <Select
      value={defaultHour.toString()}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select birth time" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 24 }, (_, i) => ({
          value: i.toString(),
          label: `${i.toString().padStart(2, '0')}:00 - ${i.toString().padStart(2, '0')}:59`
        })).map((hour) => (
          <SelectItem key={hour.value} value={hour.value}>
            {hour.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

