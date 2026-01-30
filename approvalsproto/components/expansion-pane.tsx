"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExpansionPaneProps {
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  categoryCounts?: Record<string, number>
  activeTab?: string
  onTabChange?: (tab: string) => void
  viewMode?: "full-width" | "split"
  selectedItem?: number | null
  onSelectItem?: (id: number | null) => void
  page?: "tasks" | "inbox" | "reimbursements" | "approvals"
  isExpanded?: boolean
}

export function ExpansionPane({ selectedCategory, onCategoryChange, categoryCounts = {}, activeTab, onTabChange, viewMode, selectedItem, onSelectItem, page, isExpanded }: ExpansionPaneProps) {
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  // Base categories structure
  const baseCategories = [
    {
      id: "All",
      label: "All",
      children: [
        { id: "Critical", label: "Critical" }
      ]
    },
    {
      id: "Approvals",
      label: "Approvals",
      children: [
        { id: "HR Management", label: "HR Management" },
        { id: "Time and Attendance", label: "Time and Attendance" },
        { id: "Reimbursements", label: "Reimbursements" },
      ]
    },
    {
      id: "Tasks",
      label: "Tasks",
      children: [
        { id: "Documents", label: "Documents" },
        { id: "Training", label: "Learning Management" },
        { id: "Miscellaneous", label: "Miscellaneous" },
        { id: "Payroll", label: "Payroll" },
      ]
    },
  ]

  // Filter categories based on page
  const allCategories = page === "approvals"
    ? (() => {
        // Get all unique task types from categoryCounts (excluding standard categories)
        // Note: "Payroll" is removed from standardCategories because it's an actual task type that should appear in quick filters
        const standardCategories = ["All", "Approvals", "Tasks", "HR Management", "Time and Attendance", "Reimbursements", "Documents", "Training", "Miscellaneous", "Critical"]
        const taskTypes = Object.keys(categoryCounts || {})
          .filter(key => !standardCategories.includes(key) && categoryCounts[key] > 0)
          .sort() // Sort alphabetically
        
        return [
          {
            id: "All",
            label: "All",
            children: taskTypes.map(taskType => ({
              id: taskType,
              label: taskType
            }))
          }
        ]
      })()
    : baseCategories

  const getCount = (id: string) => {
    return categoryCounts[id] || 0
  }

  // Close select dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false)
      }
    }

    if (isSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSelectOpen])

  // Only highlight if this exact item is selected, not if a child is selected
  const isItemSelected = (itemId: string) => {
    return selectedCategory === itemId
  }

  const getAllCount = () => {
    // For approvals page, "All" should be the sum of all task type counts (quick filters)
    if (page === "approvals") {
      // Get all task types from categoryCounts (excluding standard categories)
      const standardCategories = ["All", "Approvals", "Tasks", "HR Management", "Time and Attendance", "Reimbursements", "Documents", "Training", "Miscellaneous", "Critical"]
      const taskTypes = Object.keys(categoryCounts || {})
        .filter(key => !standardCategories.includes(key) && categoryCounts[key] > 0)
      
      // Sum up all task type counts
      return taskTypes.reduce((sum, taskType) => sum + (categoryCounts[taskType] || 0), 0)
    }
    // For other pages, sum of all Approvals and Tasks items
    const approvalsCount = getCount("Approvals")
    const tasksCount = getCount("Tasks")
    return approvalsCount + tasksCount
  }

  const handleCategoryClick = (categoryId: string) => {
    if (onCategoryChange) {
      onCategoryChange(categoryId)
    }
  }

  const handleTabChange = (newTab: string) => {
    if (!onTabChange) return
    // Always call the parent's handler - it has access to viewMode and selectedItem
    onTabChange(newTab)
  }

  // Set "All" as default on mount if no category is selected
  useEffect(() => {
    if (!selectedCategory && onCategoryChange) {
      onCategoryChange("All")
    }
  }, [selectedCategory, onCategoryChange])

  return (
    <div className="bg-[#F9F7F6] border-r border-[rgba(0,0,0,0.1)] h-full flex flex-shrink-0">
      {/* 24px left spacer */}
      <div style={{ width: (page === "approvals" && isExpanded) ? '24px' : (page === "approvals" ? '64px' : '24px'), flexShrink: 0 }}></div>
      
      {/* Content area - fixed width */}
      <div className="flex flex-col h-full" style={{ width: '200px', flexShrink: 0 }}>
        {/* Header with Select dropdown */}
        <div className="pt-6 pb-4">
          <div className="relative" ref={selectRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSelectOpen(!isSelectOpen)}
              className="h-[40px] text-sm gap-2 px-3 rounded-[8px] w-full justify-between"
            >
              <span>
                {activeTab === "pending" ? "Needs my attention" :
                 activeTab === "snoozed" ? "Snoozed" :
                 activeTab === "reviewed" ? "Resolved" :
                 activeTab === "created" ? "Created by me" :
                 activeTab === "all" ? "All tasks" : "Needs my attention"}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
            </Button>
            {isSelectOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 w-full">
                <button
                  onClick={() => {
                    handleTabChange("pending")
                    setIsSelectOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "pending" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  Needs my attention
                </button>
                <button
                  onClick={() => {
                    handleTabChange("snoozed")
                    setIsSelectOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "snoozed" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  Snoozed
                </button>
                <button
                  onClick={() => {
                    handleTabChange("reviewed")
                    setIsSelectOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "reviewed" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  Resolved
                </button>
                <button
                  onClick={() => {
                    handleTabChange("created")
                    setIsSelectOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                    activeTab === "created" ? 'bg-gray-50 font-normal' : ''
                  }`}
                >
                  Created by me
                </button>
                <button
                  onClick={() => {
                    handleTabChange("all")
                    setIsSelectOpen(false)
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
        </div>
        
        {/* Divider */}
        <div>
          <div className="h-px bg-[rgba(0,0,0,0.1)]"></div>
        </div>
        
        {/* Category list */}
        <div className="flex-1 overflow-y-auto py-2">
          <div className="flex flex-col gap-4">
            {allCategories.map((category, index) => {
              const isParentSelected = isItemSelected(category.id)
              const count = category.id === "All" ? getAllCount() : getCount(category.id)
              const hasChildren = category.children && category.children.length > 0
              
              return (
                <div key={category.id} className="flex flex-col">
                  {/* Parent item */}
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg min-h-[36px] transition-colors text-left ${
                      isParentSelected ? 'bg-blue-100' : 'bg-transparent hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm leading-5 ${
                      isParentSelected ? 'text-blue-700 font-normal' : 'text-[#05142e]'
                    }`}>
                      {category.label}
                    </span>
                    <span className="text-xs text-[#716f6c] font-normal ml-auto">
                      {count}
                    </span>
                  </button>
                  
                  {/* Child items - hide if count is 0 */}
                  {hasChildren && (
                    <div className="flex flex-col mt-1">
                      {category.children
                        .filter((child) => {
                          const childCount = getCount(child.id)
                          return childCount > 0
                        })
                        .map((child) => {
                        const isChildSelected = isItemSelected(child.id)
                        const childCount = getCount(child.id)
                        
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleCategoryClick(child.id)}
                            className={`flex items-center justify-between pr-2 py-1 rounded-lg min-h-[32px] transition-colors text-left ${
                              isChildSelected ? 'bg-blue-100' : 'hover:bg-gray-50'
                            }`}
                            style={{ paddingLeft: '24px' }}
                          >
                            <span className={`text-sm leading-5 ${
                              isChildSelected ? 'text-blue-700 font-normal' : 'text-[#716f6c]'
                            }`} style={{ 
                              maxWidth: 'calc(100% - 48px)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {child.label}
                            </span>
                            <span className="text-xs text-[#716f6c] font-normal ml-auto flex-shrink-0" style={{ marginLeft: '24px' }}>
                              {childCount}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* 24px right spacer */}
      <div style={{ width: '24px', flexShrink: 0 }}></div>
    </div>
  )
}
