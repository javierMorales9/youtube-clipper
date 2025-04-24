"use client"

import * as React from "react"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"

import { cn } from "@/app/_components/common/utils"
import { Button } from "@/app/_components/common/Button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/_components/common/Command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/common/Popover"
import { Label } from "./Label"

export function NewSelect({
  options,
  onSelect,
  value: initialValue = "",
  contentClassName,
  label,
}: {
  options: { value: string; label: string }[],
  onSelect: (value: string) => void,
  value?: string,
  contentClassName?: string,
  label?: string,
}) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(initialValue)

  return (
    <div className="flex flex-col gap-y-1">
      {label && <Label>{label}</Label>}
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            {value
              ? options.find((option) => option.value === value)?.label
              : "Select an option..."}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-[200px] p-0", contentClassName)}>
          <Command>
            <CommandInput placeholder="Search..." className="h-9" />
            <CommandList>
              <CommandEmpty>No element found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      onSelect(currentValue);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
