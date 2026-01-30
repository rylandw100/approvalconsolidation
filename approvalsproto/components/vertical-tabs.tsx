"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

interface VerticalTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  pendingCount?: number
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

export function VerticalTabs({ activeTab, onTabChange, pendingCount, selectedCategory, onCategoryChange }: VerticalTabsProps) {
  const tabs = [
    { id: "pending", label: "Needs my attention" },
    { id: "reviewed", label: "Reviewed" },
    { id: "snoozed", label: "Snoozed" },
    { id: "created", label: "Created by me" },
    { id: "all", label: "All tasks" },
  ]

  const filterOptions = [
    { 
      id: "All",
      label: "All",
      children: [
        { id: "Critical", label: "Critical" },
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
        { id: "Trainings", label: "Learning Management" },
        { id: "Miscellaneous", label: "Miscellaneous" },
        { id: "Payroll", label: "Payroll" },
      ]
    },
  ]

  const isPendingActive = activeTab === "pending"
  const isAllActive = activeTab === "all"
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set())
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set())
  
  const toggleTabExpansion = (tabId: string) => {
    setExpandedTabs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tabId)) {
        newSet.delete(tabId)
      } else {
        newSet.add(tabId)
      }
      return newSet
    })
  }

  const toggleFilterExpansion = (filterId: string) => {
    setExpandedFilters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(filterId)) {
        newSet.delete(filterId)
      } else {
        newSet.add(filterId)
      }
      return newSet
    })
  }

  // Auto-expand parent when a child is selected
  useEffect(() => {
    if (selectedCategory) {
      filterOptions.forEach(filter => {
        if (filter.children && filter.children.some(child => child.id === selectedCategory)) {
          setExpandedFilters(prev => {
            const newSet = new Set(prev)
            newSet.add(filter.id)
            return newSet
          })
        }
      })
      // Auto-expand "All" tab if "Critical" is selected
      if (selectedCategory === "Critical") {
        setExpandedTabs(prev => {
          const newSet = new Set(prev)
          newSet.add("all")
          return newSet
        })
      }
    }
  }, [selectedCategory])
  
  // Auto-expand "All" tab when it becomes active and has children
  useEffect(() => {
    if (activeTab === "all") {
      const allFilter = filterOptions.find(f => f.id === "All")
      if (allFilter?.children && allFilter.children.length > 0) {
        setExpandedTabs(prev => {
          const newSet = new Set(prev)
          newSet.add("all")
          return newSet
        })
      }
    }
  }, [activeTab])

  return (
    <div className="flex flex-col flex-shrink-0 w-[200px]" style={{ backgroundColor: '#F9F7F6' }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const isPending = tab.id === "pending"
        const isAll = tab.id === "all"
        const allFilter = filterOptions.find(f => f.id === "All")
        const hasChildren = isAll && allFilter?.children
        const shouldShowChildren = hasChildren && isAll
        
        return (
          <div key={tab.id}>
            <button
              onClick={() => {
                if (!isPending) {
                  onTabChange(tab.id)
                }
              }}
              className={`flex items-center h-[40px] w-full transition-all duration-200 hover:bg-gray-50 relative ${
                isActive && !isPending
                  ? "border-l-[2px]"
                  : "border-l"
              }`}
              style={{
                borderLeftColor: (isActive && !isPending) ? '#000000' : '#E5E7EB',
                paddingLeft: '12px'
              }}
            >
              <div className="flex items-center gap-1 w-full">
                <span className={`text-sm leading-5 ${
                  isActive && !isPending
                    ? "text-black font-semibold"
                    : "text-[#716f6c] font-normal"
                }`} style={{ fontSize: '14px', lineHeight: '20px', fontWeight: (isActive && !isPending) ? 600 : 400 }}>
                  {tab.label}
                </span>
              </div>
            </button>
            {shouldShowChildren && (
              <div>
                {allFilter?.children?.map((child) => {
                  const isChildActive = selectedCategory === child.id
                  return (
                    <button
                      key={child.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onCategoryChange) {
                          onCategoryChange(child.id)
                        }
                      }}
                      className={`flex items-center h-[40px] w-full transition-all duration-200 hover:bg-gray-50 relative ${
                        isChildActive
                          ? "border-l-[2px]"
                          : "border-l"
                      }`}
                      style={{
                        borderLeftColor: isChildActive ? '#000000' : '#E5E7EB',
                        paddingLeft: '24px'
                      }}
                    >
                      <span className={`text-sm leading-5 ${
                        isChildActive
                          ? "text-black font-semibold"
                          : "text-[#716f6c] font-normal"
                      }`} style={{ fontSize: '14px', lineHeight: '20px', fontWeight: isChildActive ? 600 : 400 }}>
                        {child.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      {isPendingActive && (
        <div>
          {filterOptions.filter(f => f.id !== "All").map((filter) => {
            const isFilterActive = selectedCategory === filter.id
            const hasChildren = filter.children && filter.children.length > 0
            
            return (
              <div key={filter.id}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Always allow selecting the parent
                    if (onCategoryChange) {
                      onCategoryChange(filter.id)
                    }
                  }}
                  className={`flex items-center h-[40px] w-full transition-all duration-200 hover:bg-gray-50 relative ${
                    isFilterActive
                      ? "border-l-[2px]"
                      : "border-l"
                  }`}
                  style={{
                    borderLeftColor: isFilterActive ? '#000000' : '#E5E7EB',
                    paddingLeft: '24px'
                  }}
                >
                  <span className={`text-sm leading-5 ${
                    isFilterActive
                      ? "text-black font-medium"
                      : "text-[#716f6c] font-normal"
                  }`} style={{ fontSize: '14px', lineHeight: '20px', fontWeight: isFilterActive ? 400 : 400 }}>
                    {filter.label}
                  </span>
                </button>
                {hasChildren && (
                  <div>
                    {filter.children!.map((child) => {
                      const isChildActive = selectedCategory === child.id
                      return (
                        <button
                          key={child.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onCategoryChange) {
                              onCategoryChange(child.id)
                            }
                          }}
                          className={`flex items-center h-[40px] w-full transition-all duration-200 hover:bg-gray-50 relative ${
                            isChildActive
                              ? "border-l-[2px]"
                              : "border-l"
                          }`}
                          style={{
                            borderLeftColor: isChildActive ? '#000000' : '#E5E7EB',
                            paddingLeft: '48px'
                          }}
                        >
                          <span className={`text-sm leading-5 ${
                            isChildActive
                              ? "text-black font-semibold"
                              : "text-[#716f6c] font-normal"
                          }`} style={{ fontSize: '14px', lineHeight: '20px', fontWeight: isChildActive ? 600 : 400 }}>
                            {child.label}
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
      )}
    </div>
  )
}

