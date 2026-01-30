"use client"

import { Pin } from "lucide-react"
import { NavSection } from "./NavSection"
import { NavSectionData } from "./types"

interface SidebarProps {
  mainSections: NavSectionData[];
  platformSection?: NavSectionData;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activePageId?: string;
}

export function Sidebar({
  mainSections,
  platformSection,
  isCollapsed,
  onToggleCollapse,
  activePageId,
}: SidebarProps) {
  return (
    <aside className={`fixed left-0 top-14 bottom-0 bg-card border-r border-border flex flex-col justify-between z-50 overflow-y-auto overflow-x-hidden transition-all ${
      isCollapsed ? 'w-[60px]' : 'w-[266px]'
    }`}>
      <div>
        {/* Main Navigation Sections */}
        {mainSections.map((section, index) => (
          <div key={`main-section-${index}`}>
            <NavSection 
              section={section} 
              isCollapsed={isCollapsed}
              activePageId={activePageId}
            />
            {/* Add divider after first section if it has no label */}
            {index === 0 && !section.label && mainSections.length > 1 && (
              <div className="pt-2.5 px-2 flex flex-col gap-1">
                <div className="h-6 flex items-center justify-center px-1 w-full flex-shrink-0">
                  <div className="flex-1 h-px bg-border" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Platform Section */}
        {platformSection && (
          <NavSection 
            section={platformSection} 
            isCollapsed={isCollapsed}
            activePageId={activePageId}
          />
        )}
      </div>

      <div className="bg-card pb-2">
        <button
          onClick={onToggleCollapse}
          className="w-full h-10 flex items-center gap-2 pr-2.5 pl-0 bg-transparent border-none border-t border-border rounded-lg text-sm text-foreground cursor-pointer transition-all hover:bg-muted active:bg-muted/80 mt-2"
        >
          <div className="p-2 flex items-center justify-center flex-shrink-0">
            <Pin className="h-5 w-5 text-foreground" />
          </div>
          <div className={`flex-1 whitespace-nowrap overflow-hidden text-ellipsis transition-opacity ${
            isCollapsed ? 'opacity-0' : 'opacity-100'
          }`}>
            Collapse panel
          </div>
        </button>
      </div>
    </aside>
  );
}




