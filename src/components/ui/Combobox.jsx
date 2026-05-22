import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"

export const Combobox = React.forwardRef(({
  items = [], // Array of { value: string, label: string, ...CustomFields }
  value = "",
  onSelect, // Callback: (item) => void
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  emptyMessage = "لا توجد نتائج.",
  className = "",
  buttonClassName = "",
  disabled = false,
  autoFocus = false,
  dir = "rtl"
}, ref) => {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef(null)

  React.useImperativeHandle(ref, () => triggerRef.current)

  const selectedItem = items.find((item) => item.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            "w-full h-9 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 font-tajawal font-bold text-sm outline-none transition-all focus:border-[#279489]/40 focus:ring-4 focus:ring-[#279489]/5 text-right flex items-center justify-between no-select-click",
            buttonClassName
          )}
        >
          <span className="truncate text-slate-700 dark:text-slate-200">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start" dir={dir}>
        <Command className="font-tajawal">
          <CommandInput placeholder={searchPlaceholder} className="text-right font-tajawal" />
          <CommandList className="max-h-[250px]">
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.label} [id:${item.value}]`}
                  onSelect={(currentValue) => {
                    // Match items by extracting the ID from [id:...]
                    const matchedItem = items.find(i => 
                      currentValue.toLowerCase().endsWith(`[id:${i.value.toLowerCase()}]`)
                    ) || item
                    if (onSelect) {
                      onSelect(matchedItem)
                    }
                    setOpen(false)
                  }}
                  className="flex items-center justify-between text-right font-tajawal py-2.5 px-3"
                >
                  <span className="font-bold">{item.label}</span>
                  {value === item.value && <Check className="h-4 w-4 text-[#279489] ml-2" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})

Combobox.displayName = "Combobox"
