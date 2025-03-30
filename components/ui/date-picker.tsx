"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerDemoProps {
  date?: Date | null;
  setDate?: (date: Date | null) => void;
  placeholder?: string;
}

export function DatePickerDemo({
  date,
  setDate,
  placeholder = "Pick a date",
}: DatePickerDemoProps) {
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    date instanceof Date ? date : undefined
  );

  // Update internalDate when the date prop changes
  React.useEffect(() => {
    // If date is null, clear the internal date
    if (date === null) {
      setInternalDate(undefined);
    } 
    // Otherwise, if it's a valid date, update internal date
    else if (date instanceof Date && !isNaN(date.getTime())) {
      setInternalDate(date);
    }
  }, [date]);

  const handleSelect = (selectedDate: Date | undefined) => {
    setInternalDate(selectedDate);
    if (setDate) {
      setDate(selectedDate || null);
    }
  };

  // Use either controlled (external) or uncontrolled (internal) state
  const displayDate = date instanceof Date ? date : internalDate;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !displayDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayDate ? (
            format(displayDate, "PPP")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={displayDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
