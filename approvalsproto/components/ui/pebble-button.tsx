"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const ButtonSizes = {
  XS: "xs",
  S: "s",
  M: "m",
  L: "l",
} as const

export const ButtonAppearances = {
  PRIMARY: "primary",
  ACCENT: "accent",
  DESTRUCTIVE: "destructive",
  SUCCESS: "success",
  OUTLINE: "outline",
  GHOST: "ghost",
} as const

interface PebbleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: typeof ButtonSizes[keyof typeof ButtonSizes]
  appearance?: typeof ButtonAppearances[keyof typeof ButtonAppearances]
  children: React.ReactNode
  disabled?: boolean
  isFullWidth?: boolean
}

const PebbleButton = React.forwardRef<HTMLButtonElement, PebbleButtonProps>(
  ({ 
    className, 
    size = ButtonSizes.M,
    appearance = ButtonAppearances.PRIMARY,
    disabled = false,
    isFullWidth = false,
    children,
    ...props 
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    
    const sizeStyles = {
      [ButtonSizes.XS]: "h-7 px-2 text-xs rounded-md",
      [ButtonSizes.S]: "h-8 px-3 text-sm rounded-md",
      [ButtonSizes.M]: "h-10 px-4 text-sm rounded-lg",
      [ButtonSizes.L]: "h-12 px-6 text-base rounded-lg",
    }
    
    const appearanceStyles = {
      [ButtonAppearances.PRIMARY]: "bg-[#106964] text-white hover:bg-[#0d5651] focus:ring-[#106964]",
      [ButtonAppearances.ACCENT]: "bg-[#7A005D] text-white hover:bg-[#6a004f] focus:ring-[#7A005D]",
      [ButtonAppearances.DESTRUCTIVE]: "bg-[#BB3D2A] text-white hover:bg-[#a53523] focus:ring-[#BB3D2A]",
      [ButtonAppearances.SUCCESS]: "bg-[#2D8A70] text-white hover:bg-[#257a62] focus:ring-[#2D8A70]",
      [ButtonAppearances.OUTLINE]: "border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500",
      [ButtonAppearances.GHOST]: "text-gray-700 bg-transparent hover:bg-gray-100 focus:ring-gray-500",
    }
    
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseStyles,
          sizeStyles[size],
          appearanceStyles[appearance],
          isFullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

PebbleButton.displayName = "PebbleButton"

export { PebbleButton }

