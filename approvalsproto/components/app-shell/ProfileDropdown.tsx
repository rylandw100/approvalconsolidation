"use client"

import { useState } from "react"
import { ChevronDown, Sun, Moon, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProfileDropdownProps {
  companyName: string;
  userInitial: string;
  adminMode: boolean;
  currentMode: 'light' | 'dark';
  onAdminModeToggle: () => void;
}

export function ProfileDropdown({
  companyName,
  userInitial,
  adminMode,
  currentMode,
  onAdminModeToggle,
}: ProfileDropdownProps) {
  const [mode, setMode] = useState<'light' | 'dark'>(currentMode)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={`flex items-center gap-3 px-2 py-1 rounded-lg cursor-pointer transition-colors hover:bg-muted ${
          adminMode ? 'hover:bg-white/10' : ''
        }`}>
          <span className={`text-sm font-semibold whitespace-nowrap ${
            adminMode ? 'text-white' : 'text-foreground'
          }`}>
            {companyName}
          </span>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 border transition-colors ${
            adminMode 
              ? 'bg-white text-[#4A0039] border-white' 
              : 'bg-primary text-primary-foreground border-border'
          }`}>
            {userInitial}
          </div>
          <ChevronDown 
            className={`h-4 w-4 ${
              adminMode ? 'text-white' : 'text-foreground'
            }`}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={() => {
            setMode('light')
          }}
          className="flex items-center gap-2"
        >
          <Sun className="h-4 w-4" />
          {mode === 'light' ? 'Light Mode ✓' : 'Light Mode'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            setMode('dark')
          }}
          className="flex items-center gap-2"
        >
          <Moon className="h-4 w-4" />
          {mode === 'dark' ? 'Dark Mode ✓' : 'Dark Mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={onAdminModeToggle}
          className="flex items-center gap-2"
        >
          <Lock className="h-4 w-4" />
          {adminMode ? 'Turn off Admin Mode' : 'Turn on Admin Mode'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

