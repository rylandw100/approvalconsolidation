"use client"

import { Search } from "lucide-react"

interface SearchBarProps {
  placeholder?: string;
  adminMode?: boolean;
}

export function SearchBar({ 
  placeholder = 'Search or jump to...', 
  adminMode = false
}: SearchBarProps) {
  return (
    <div className={`flex-1 max-w-[600px] rounded-lg flex items-center gap-2 px-3 py-2 transition-all ${
      adminMode 
        ? 'bg-white/20 opacity-75 focus-within:opacity-100' 
        : 'bg-muted opacity-75 focus-within:opacity-100'
    }`}>
      <Search 
        className={`h-5 w-5 flex-shrink-0 ${
          adminMode ? 'text-white' : 'text-muted-foreground'
        }`}
      />
      <input 
        id="global-search" 
        type="text" 
        placeholder={placeholder}
        className={`flex-1 bg-transparent border-none outline-none text-sm ${
          adminMode 
            ? 'text-white placeholder:text-white' 
            : 'text-foreground placeholder:text-muted-foreground'
        }`}
      />
    </div>
  );
}






