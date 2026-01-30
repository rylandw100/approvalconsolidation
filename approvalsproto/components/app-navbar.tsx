"use client"

import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

interface AppNavBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  page?: "tasks" | "inbox"
  pendingCount?: number
}

export function AppNavBar({ activeTab, onTabChange, page = "tasks", pendingCount }: AppNavBarProps) {
  const title = "Inbox"
  const [isPendingDropdownOpen, setIsPendingDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPendingDropdownOpen(false)
      }
    }

    if (isPendingDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPendingDropdownOpen])

  const isPendingActive = activeTab === "pending"

  return (
    <div className="bg-card border-b border-border">
      <div className="px-16" style={{ paddingTop: '0px', paddingBottom: '0px', height: '122px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="rippling-text-2xl text-foreground">{title}</h1>
          </div>
        </div>
        
        <div className="flex border-b border-border">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                if (isPendingActive) {
                  setIsPendingDropdownOpen(!isPendingDropdownOpen)
                } else {
                  onTabChange("pending")
                }
              }}
              className={`h-[40px] px-6 border-b-2 transition-all duration-200 flex items-center gap-2 ${
                isPendingActive
                  ? "border-[#000000]"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              <span className={`rippling-text-sm transition-colors ${
                isPendingActive
                  ? "text-[#000000] font-normal"
                  : "text-muted-foreground hover:text-foreground"
              }`}>
                Needs my attention
              </span>
              {pendingCount !== undefined && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-normal text-white" style={{ backgroundColor: '#7A005D' }}>
                  {pendingCount}
                </span>
              )}
              {isPendingActive && (
                <ChevronDown className={`h-4 w-4 transition-transform ${isPendingDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
            {isPendingDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[200px]">
                <button
                  onClick={() => {
                    onTabChange("pending")
                    setIsPendingDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "pending" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  Needs my attention
                </button>
                <button
                  onClick={() => {
                    onTabChange("snoozed")
                    setIsPendingDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "snoozed" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  Snoozed
                </button>
                <button
                  onClick={() => {
                    onTabChange("reviewed")
                    setIsPendingDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "reviewed" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  Resolved
                </button>
                <button
                  onClick={() => {
                    onTabChange("created")
                    setIsPendingDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "created" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  Created by me
                </button>
                <button
                  onClick={() => {
                    onTabChange("all")
                    setIsPendingDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "all" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  All tasks
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => onTabChange("reviewed")}
            className={`px-6 pb-3 border-b-2 transition-all duration-200 ${
              activeTab === "reviewed"
                ? "border-[#000000]"
                : "border-transparent hover:border-muted-foreground/30"
            }`}
          >
            <span className={`rippling-text-sm transition-colors ${
              activeTab === "reviewed"
                ? "text-[#000000] font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}>
              Reviewed
            </span>
          </button>
          <button
            onClick={() => onTabChange("snoozed")}
            className={`px-6 pb-3 border-b-2 transition-all duration-200 ${
              activeTab === "snoozed"
                ? "border-[#000000]"
                : "border-transparent hover:border-muted-foreground/30"
            }`}
          >
            <span className={`rippling-text-sm transition-colors ${
              activeTab === "snoozed"
                ? "text-[#000000] font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}>
              Snoozed
            </span>
          </button>
          <button
            onClick={() => onTabChange("created")}
            className={`px-6 pb-3 border-b-2 transition-all duration-200 ${
              activeTab === "created"
                ? "border-[#000000]"
                : "border-transparent hover:border-muted-foreground/30"
            }`}
          >
            <span className={`rippling-text-sm transition-colors ${
              activeTab === "created"
                ? "text-[#000000] font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}>
              Created by me
            </span>
          </button>
          <button
            onClick={() => onTabChange("all")}
            className={`px-6 pb-3 border-b-2 transition-all duration-200 ${
              activeTab === "all"
                ? "border-[#000000]"
                : "border-transparent hover:border-muted-foreground/30"
            }`}
          >
            <span className={`rippling-text-sm transition-colors ${
              activeTab === "all"
                ? "text-[#000000] font-normal"
                : "text-muted-foreground hover:text-foreground"
            }`}>
              All tasks
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
