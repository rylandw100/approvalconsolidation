"use client"

import { Button } from "@/components/ui/button"
import { CheckSquare, Inbox } from "lucide-react"

interface SidebarProps {
  activePage: "tasks" | "inbox"
  onPageChange: (page: "tasks" | "inbox") => void
}

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <div className="w-[56px] flex-shrink-0 rippling-sidebar flex flex-col items-center py-6 space-y-4">
      <div className="w-full flex justify-center">
        <Button 
          variant="ghost"
          size="icon"
          className={`h-12 w-12 rounded-xl transition-all duration-200 ${
            activePage === "inbox" 
              ? 'bg-[rgb(231,225,222)]' 
              : 'rippling-btn-ghost hover:bg-muted'
          }`}
          onClick={() => onPageChange("inbox")}
        >
          <Inbox className={`h-6 w-6 ${activePage === "inbox" ? "text-black" : ""}`} />
        </Button>
      </div>
    </div>
  )
}

