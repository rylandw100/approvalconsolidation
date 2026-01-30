"use client"

import { ChevronRight } from "lucide-react"

interface NavItemProps {
  item: {
    id: string;
    label: string;
    icon: React.ReactNode;
    hasSubmenu?: boolean;
    onClick?: () => void;
  };
  isCollapsed: boolean;
  isActive?: boolean;
}

export function NavItem({ item, isCollapsed, isActive = false }: NavItemProps) {
  return (
    <button
      onClick={item.onClick}
      className={`w-full h-10 flex items-center gap-2 pr-2 border-none rounded-lg text-sm text-left cursor-pointer transition-all overflow-hidden ${
        isActive 
          ? 'bg-muted text-foreground font-medium' 
          : 'bg-transparent text-foreground hover:bg-muted active:bg-muted/80'
      }`}
    >
      <div className="p-2 flex items-center justify-center flex-shrink-0">
        {item.icon}
      </div>
      <div className={`flex-1 whitespace-nowrap overflow-hidden text-ellipsis transition-opacity ${
        isCollapsed ? 'opacity-0' : 'opacity-100'
      }`}>
        {item.label}
      </div>
      {item.hasSubmenu && !isCollapsed && (
        <div className="ml-auto">
          <ChevronRight className="h-4 w-4 text-foreground" />
        </div>
      )}
    </button>
  );
}





