"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PebbleCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  checked?: boolean
  indeterminate?: boolean
  onChange?: (checked: boolean) => void
  appearance?: 'list' | 'basic' | 'box' | 'card'
}

const PebbleCheckbox = React.forwardRef<HTMLInputElement, PebbleCheckboxProps>(
  ({ 
    className, 
    checked = false, 
    indeterminate = false,
    onChange,
    disabled = false,
    appearance = 'list',
    ...props 
  }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    React.useEffect(() => {
      if (inputRef.current && ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current)
        } else {
          ref.current = inputRef.current
        }
      }
    }, [ref])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e.target.checked)
      }
    }

    const handleClick = (e: React.MouseEvent) => {
      if (!disabled && inputRef.current) {
        e.preventDefault()
        e.stopPropagation()
        const newChecked = !checked
        if (onChange) {
          onChange(newChecked)
        }
        inputRef.current.checked = newChecked
      }
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={inputRef}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "relative flex items-center justify-center transition-all",
            "h-4 w-4 rounded border-2",
            appearance === 'list' && "border-[#A3A3A5]",
            checked && !indeterminate && "bg-[#7A005D] border-[#7A005D]",
            indeterminate && "bg-[#7A005D] border-[#7A005D]",
            !checked && !indeterminate && "bg-white border-[#A3A3A5]",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
            className
          )}
          onClick={handleClick}
        >
          {checked && !indeterminate && (
            <Check className="h-3 w-3 text-white stroke-[3]" />
          )}
          {indeterminate && (
            <div className="h-0.5 w-2 bg-white rounded" />
          )}
        </div>
      </div>
    )
  }
)

PebbleCheckbox.displayName = "PebbleCheckbox"

export { PebbleCheckbox }

