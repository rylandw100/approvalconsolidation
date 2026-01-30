"use client"

import { NavSectionData } from "./types"
import { NavItem } from "./NavItem"

interface NavSectionProps {
  section: NavSectionData
  isCollapsed: boolean
  activePageId?: string
}

export function NavSection({ section, isCollapsed, activePageId }: NavSectionProps) {
  return (
    <div className="pt-2.5 px-2 flex flex-col gap-1">
      {section.label && (
        <div
          className={`text-xs font-semibold text-foreground/70 uppercase tracking-wider border-t border-border pt-2.5 pb-1 px-2 transition-opacity ${
            isCollapsed ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {section.label}
        </div>
      )}
      {section.items.map(item => (
        <NavItem key={item.id} item={item} isCollapsed={isCollapsed} isActive={activePageId === item.id} />
      ))}
    </div>
  )
}


