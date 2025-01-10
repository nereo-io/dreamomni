'use client'

import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DatePickerProps {
  onYearChange?: (year: number) => void;
  onMonthChange?: (month: number) => void;
  onDayChange?: (day: number) => void;
  year?: number;
  month?: number;
  day?: number;
}

export function DatePicker({ 
  onYearChange, 
  onMonthChange, 
  onDayChange,
  year = new Date().getFullYear() - 18,
  month = new Date().getMonth() + 1,
  day = new Date().getDate()
}: DatePickerProps) {
  // Generate arrays for options
  const years = Array.from(
    { length: 100 },
    (_, i) => new Date().getFullYear() - 117 + i
  )
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const days = Array.from(
    { length: new Date(year, month, 0).getDate() },
    (_, i) => i + 1
  )

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={month.toString()}
        onValueChange={(value) => onMonthChange?.(parseInt(value))}
      >
        <SelectTrigger className="w-[110px] flex-grow">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((monthName, index) => (
            <SelectItem key={index + 1} value={(index + 1).toString()}>
              {monthName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={day.toString()}
        onValueChange={(value) => onDayChange?.(parseInt(value))}
      >
        <SelectTrigger className="w-[90px] flex-grow">
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent>
          {days.map((day) => (
            <SelectItem key={day} value={day.toString()}>
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={year.toString()}
        onValueChange={(value) => onYearChange?.(parseInt(value))}
      >
        <SelectTrigger className="w-[100px] flex-grow">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

