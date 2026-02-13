"use client"

import { PebbleCheckbox } from "@/components/ui/pebble-checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, MessageCircle, Plane, AlertTriangle, ChevronRight, Info, Search, ChevronDown, Filter, Archive, Pin, PanelLeft, Menu, ChevronLeft, Clock, Maximize2, Minimize2, MoreVertical, ArrowUp, ArrowDown, LayoutGrid } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { createPortal } from "react-dom"
import { VerticalTabs } from "./vertical-tabs"
import Image from "next/image"
import { generateApprovalData } from "@/lib/approval-data"

export type Filter = {
  id: string
  field: string
  operator: "equals" | "contains" | "before" | "after" | "is" | "isNot"
  value: string | string[] | Date | null
}

interface ApprovalsGridProps {
  selectedItems: Set<number>
  onToggleItem: (id: number) => void
  onSelectAll: (filteredIds: number[]) => void
  onClearSelection: () => void
  onOpenDrawer: (id: number) => void
  removedItems?: Set<number>
  onRemoveItem?: (id: number) => void
  onRemoveItems?: (ids: number[]) => void
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  onMarkAsDone?: (id: number) => void
  page?: "tasks" | "inbox" | "reimbursements" | "approvals"
  viewMode?: "full-width" | "split"
  onViewModeChange?: (mode: "full-width" | "split") => void
  externalSearchQuery?: string
  externalSelectedCategory?: string
  onSearchChange?: (query: string) => void
  onCategoryChange?: (category: string) => void
  selectedItem?: number | null
  onSelectItem?: (id: number | null) => void
  sortBy?: { column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" } | "recency" | "dueDate"
  onSortChange?: (sortBy: { column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" } | "recency" | "dueDate") => void
  pinnedItems?: Set<number>
  onTogglePin?: (id: number, isCritical?: boolean) => void
  unpinnedCriticalItems?: Set<number>
  aiPanelOpen?: boolean
  onFilteredIdsChange?: (ids: number[]) => void
  onCategoryCountsChange?: (counts: Record<string, number>) => void
  groupBy?: "none" | "requestor" | "type"
  onGroupByChange?: (groupBy: "none" | "requestor" | "type") => void
  snoozedItems?: Set<number> | Map<number, Date>
  onSnooze?: (id: number, snoozeUntil: Date) => void
  activeTab?: string
  onTabChange?: (tab: string) => void
  pendingCount?: number
  onExpand?: () => void
  isExpanded?: boolean
  // Saved Views props (for inbox page)
  savedViews?: Array<{ id: string; name: string; lastModified: Date; config: any }>
  currentViewId?: string
  onSwitchView?: (viewId: string) => void
  onSaveView?: () => void
  onSaveAsNewView?: () => void
  onDiscardChanges?: () => void
  onRemoveView?: () => void
  hasUnsavedChanges?: () => boolean
  getCurrentViewName?: () => string
  isViewsDropdownOpen?: boolean
  onToggleViewsDropdown?: (open: boolean) => void
  isMoreActionsOpen?: boolean
  onToggleMoreActions?: (open: boolean) => void
  viewsDropdownRef?: React.RefObject<HTMLDivElement>
  moreActionsRef?: React.RefObject<HTMLDivElement>
  // Filter props for saved views integration
  externalFilters?: Filter[]
  onFiltersChange?: (filters: Filter[]) => void
  onNavigateToPage?: (page: "tasks" | "inbox" | "reimbursements" | "approvals") => void
  reimbursementOption?: "opt1" | "opt2" | "opt3"
}

export function ApprovalsGrid({
  selectedItems,
  onToggleItem,
  onSelectAll,
  onClearSelection,
  onOpenDrawer,
  removedItems = new Set(),
  onRemoveItem,
  onRemoveItems,
  onApprove,
  onReject,
  onMarkAsDone,
  page = "tasks",
  viewMode,
  onViewModeChange,
  externalSearchQuery,
  externalSelectedCategory,
  onSearchChange,
  onCategoryChange,
  selectedItem,
  onSelectItem,
  sortBy: externalSortBy,
  onSortChange,
  pinnedItems = new Set(),
  onTogglePin,
  unpinnedCriticalItems = new Set(),
  aiPanelOpen = false,
  onFilteredIdsChange,
  onCategoryCountsChange,
  groupBy = "none",
  onGroupByChange,
  snoozedItems = new Set() as Set<number> | Map<number, Date>,
  onSnooze,
  activeTab = "pending",
  onTabChange,
  pendingCount,
  onExpand,
  isExpanded = false,
  savedViews = [],
  currentViewId = "default",
  onSwitchView,
  onSaveView,
  onSaveAsNewView,
  onDiscardChanges,
  onRemoveView,
  hasUnsavedChanges,
  getCurrentViewName,
  isViewsDropdownOpen = false,
  onToggleViewsDropdown,
  isMoreActionsOpen = false,
  onToggleMoreActions,
  viewsDropdownRef,
  moreActionsRef,
  externalFilters,
  onFiltersChange,
  onNavigateToPage,
  reimbursementOption = "opt1"
}: ApprovalsGridProps) {
  // Helper function to get display category name
  const getDisplayCategory = (category: string) => {
    if (category.startsWith("Approvals - ")) {
      return category.replace("Approvals - ", "")
    }
    // Map category values to display names
    if (category === "Training") {
      return "Learning Management"
    }
    return category
  }
  
  // Helper function to check if category is an approval type
  const isApprovalCategory = (category: string) => {
    return category.startsWith("Approvals - ")
  }
  
  // Map actionType to task type display name
  const getTaskTypeDisplayName = (approval: any): string => {
    const actionType = approval.actionType
    const subject = approval.subject || ''
    
    // Special cases based on subject text
    if (subject.includes("Grant") && subject.includes("access to") && subject.includes("apps")) {
      return "App Access"
    }
    if (subject.includes("Update") && subject.includes("access to") && subject.includes("apps")) {
      return "App Access"
    }
    if (subject.includes("Transfer") && subject.includes("to")) {
      return "Transfer"
    }
    
    // Map actionType to display name
    const actionTypeMap: Record<string, string> = {
      'APP_INSTALL_REQUEST': 'App Access',
      'APPS_UPDATE_ACCESS_REQUEST': 'App Access',
      'APPS_REQUEST': 'App Access',
      'BANKING_NEW_PAYMENT_REQUEST': 'Transfer',
      'Benefits_carrier_request': 'Carrier',
      'Variable_comp_payee_payout': 'Payout',
      'VARIABLE_COMPENSATION_PAYEE_PAYOUT_V1': 'Payout',
      'Flight_approval_Request': 'Flight',
      'Leave_request_Approval': 'Leave',
      'Time_entry': 'Time entry',
      'Spend_request': 'Reimbursement',
      'CONTRACT_CREATION': 'New contract',
      'CONTRACT_NEGOTIATION': 'Contract negotiation',
      'CUSTOM_OBJECT_DATA_ROW_DELETE': 'Record deletion',
      'CUSTOM_OBJECT_DATA_ROW_DELETE_NO_DUE_DATE': 'Record deletion',
      'CUSTOM_OBJECT_DATA_ROW_CREATE': 'Record creation',
      'CUSTOM_OBJECT_DATA_ROW_UPDATE': 'Record update',
      'DEVICES_REQUEST': 'Assign and order',
      'GLOBAL_PAYROLL_PROCESS_REQUEST_APPROVAL': 'Pay run',
      'BACKFILL_HEADCOUNT': 'Backfill',
      'NEW_HEADCOUNT': 'New headcount',
      'EDIT_HEADCOUNT': 'Edit headcount',
      'CLOSE_HEADCOUNT': 'Close headcount',
      'TRANSITION': 'Transition',
      'HIRE': 'Hire',
      'HIRE_WITH_DETAILS': 'Hire',
      'TERMINATE': 'Offboard',
      'PERSONAL_INFO_CHANGES': 'Personal info change',
      'APP_ACCESS_REQUEST': 'App Access',
      'PAYROLL_RUN_REQUEST_APPROVAL': 'Pay run',
      'GRANT_DEVELOPER_PERMISSION': 'Grant permissions',
      'PROCUREMENT_REQUEST': 'Procurement',
      'ATS_OFFER_LETTER_REQUEST': 'Offer letter',
      'ATS_JOB_REQUISITION_CREATE_REQUEST': 'New job requisition',
      'ATS_JOB_REQUISITION_EDIT_REQUEST': 'Job requisition update',
      'ATS_DECISION_TO_HIRE_REQUEST': 'Decision to offer',
      'RPASS_REQUEST': 'App access',
      'SCHEDULING_CHANGE_REQUEST': 'Scheduling change',
      'SCHEDULING_EDIT_SHIFT': 'Shift update',
      'SCHEDULING_COVER_OFFER': 'Cover shift',
      'SCHEDULING_DROP_SHIFT': 'Shift drop',
      'SCHEDULING_SWAP_OFFER': 'Shift swap',
      'SCHEDULING_EMPLOYEE_SHIFT_CONFIRM': 'Shift confirmation',
      'SCHEDULING_SHIFT_PUBLISH': 'Publish shift',
      'SCHEDULING_EMPLOYEE_SHIFT_PUBLISH': 'Publish employee shift',
      'CHAT_CHANNEL_CREATION': 'Channel creation',
      'CHAT_CHANNEL_GROUPS_UPDATE': 'Channel update',
      'INVOICE_SUBMISSION': 'Invoice submission',
      'CUSTOM_OBJECT_DATA_ROW_RUN_BUSINESS_PROCESS': 'Business process',
      'FORECASTED_ATTRITION_HEADCOUNT': 'Forecasted attrition',
      'REFRESH_SCHEDULE_CHANGE': 'Refresh schedule'
    }
    
    if (actionType && actionTypeMap[actionType]) {
      return actionTypeMap[actionType]
    }
    
    // Fallback to category display name
    return getDisplayCategory(approval.category)
  }
  
  // Helper function to get job title for a requestor
  const getRequestorJobTitle = (requestor: string): string | null => {
    const nonPersonRequestors = ["HR Team", "Onboarding Team", "Legal Department", "Acme, Inc."]
    if (nonPersonRequestors.includes(requestor)) {
      return null
    }
    
    // Map of requestors to their job titles
    const jobTitleMap: { [key: string]: string } = {
      "Kristine Young": "HR Manager",
      "Thomas Bennett": "Sales Director",
      "Madeline Hernandez": "Operations Manager",
      "Sarah Johnson": "Project Manager",
      "Michael Chen": "Engineering Manager",
      "Emily Rodriguez": "Marketing Manager",
      "David Park": "Product Manager",
      "Lisa Thompson": "HR Director",
      "James Wilson": "Finance Manager",
      "Patricia Martinez": "HR Specialist",
      "Robert Brown": "Operations Director",
      "Jennifer Davis": "Account Manager",
      "William Taylor": "HR Coordinator",
      "Amanda White": "Business Development Manager"
    }
    
    return jobTitleMap[requestor] || null
  }

  // Helper component for truncated text with tooltip
  const TruncatedText = ({ text, className, style, title }: { text: string, className?: string, style?: React.CSSProperties, title?: string }) => {
    const textRef = useRef<HTMLSpanElement>(null)
    const [isTruncated, setIsTruncated] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
      const checkTruncation = () => {
        if (textRef.current) {
          const isOverflowing = textRef.current.scrollWidth > textRef.current.clientWidth
          setIsTruncated(isOverflowing)
        }
      }
      checkTruncation()
      window.addEventListener('resize', checkTruncation)
      return () => window.removeEventListener('resize', checkTruncation)
    }, [text])

    const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
      if (isTruncated) {
        const rect = e.currentTarget.getBoundingClientRect()
        setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top })
        setShowTooltip(true)
      }
    }

    const handleMouseLeave = () => {
      setShowTooltip(false)
    }

    return (
      <>
        <span
          ref={textRef}
          className={className}
          style={style}
          title={title}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {text}
        </span>
        {showTooltip && isTruncated && typeof window !== 'undefined' && createPortal(
          <div
            className="fixed z-[9999] pointer-events-none bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg max-w-xs"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 8}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {text}
          </div>,
          document.body
        )}
      </>
    )
  }

  // Helper function to get avatar path for a requestor
  const getRequestorAvatar = (requestor: string): string | null => {
    // Convert "First Last" to "first-last" format
    const normalizedName = requestor.toLowerCase().replace(/\s+/g, '-')
    
    // List of available avatar files (matching the actual files in /public/avatars - case-sensitive)
    const avatarFiles = [
      'alex-martinez.jpg',
      'amanda-white.jpg',
      'david-park.jpg',
      'Emily-rodriguez.jpg',
      'james-wilson.jpg',
      'jennifer-davis.jpg',
      'jennifer-lee.jpg',
      'john-doe.jpg',
      'kristine-young.jpg',
      'lisa-thompson.jpg',
      'Madeline-hernandez.jpg',
      'maria-garcia.jpg',
      'michael-chen.jpg',
      'patricia-martinez.jpg',
      'robert-brown.jpg',
      'robert-wilson.jpg',
      'sarah-johnson.jpg',
      'sarah-kim.jpg',
      'stephanie-perkins.jpg',
      'thomas-bennett.jpg',
      'william-taylor.jpg',
      'HR-team.png',
      'documents-team.png',
      'learning-management-team.png',
      'payroll-team.png'
    ]
    
    // Try to find exact match or partial match (case-insensitive search, but return exact filename)
    const exactMatch = avatarFiles.find(file => 
      file.toLowerCase().startsWith(normalizedName) || 
      file.toLowerCase().replace(/\.(jpg|png)$/, '') === normalizedName
    )
    
    if (exactMatch) {
      return `/avatars/${exactMatch}`
    }
    
    // Handle special cases for teams/entities
    const teamMappings: { [key: string]: string } = {
      'hr team': 'HR-team.png',
      'onboarding team': 'HR-team.png', // fallback
      'legal department': 'documents-team.png',
      'payroll team': 'payroll-team.png',
      'acme, inc.': 'entity.png',
      'acme inc': 'entity.png'
    }
    
    const teamMatch = teamMappings[requestor.toLowerCase()]
    if (teamMatch) {
      return `/avatars/${teamMatch}`
    }
    
    return null
  }
  const [hoveredItem, setHoveredItem] = useState<number | string | null>(null)
  const [tooltipData, setTooltipData] = useState<{id: number | null, type: string | null, x: number, y: number, side: 'left' | 'right'}>({id: null, type: null, x: 0, y: 0, side: 'right'})
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>(externalSearchQuery || "")
  const [selectedRequestType, setSelectedRequestType] = useState<string>(externalSelectedCategory || "All")
  const [sortBy, setSortBy] = useState<{ column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" } | "recency" | "dueDate">(
    externalSortBy || "recency"
  )
  const [internalGroupBy, setInternalGroupBy] = useState<"none" | "requestor" | "type">(groupBy)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [isGroupByDropdownOpen, setIsGroupByDropdownOpen] = useState(false)
  const groupByDropdownRef = useRef<HTMLDivElement>(null)
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const [filterStep, setFilterStep] = useState<"field" | "operator" | "value">("field")
  const [currentFilterField, setCurrentFilterField] = useState<string | null>(null)
  const [currentFilterOperator, setCurrentFilterOperator] = useState<string | null>(null)
  
  const [activeFilters, setActiveFilters] = useState<Filter[]>(externalFilters || [])
  const [openValuePickerId, setOpenValuePickerId] = useState<string | null>(null)
  const valuePickerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  
  // Track previous external filters to detect actual changes
  const prevExternalFiltersRef = useRef<Filter[] | undefined>(externalFilters)
  const lastSyncedExternalFiltersRef = useRef<Filter[] | undefined>(externalFilters)
  
  // Sync external filters - only update if they're actually different
  useEffect(() => {
    if (externalFilters) {
      const externalStr = JSON.stringify(externalFilters)
      const prevStr = JSON.stringify(prevExternalFiltersRef.current)
      if (externalStr !== prevStr) {
        setActiveFilters(externalFilters)
        prevExternalFiltersRef.current = externalFilters
        lastSyncedExternalFiltersRef.current = externalFilters
      }
    } else if (externalFilters === undefined) {
      const prevStr = JSON.stringify(prevExternalFiltersRef.current)
      if (prevStr !== 'undefined') {
        setActiveFilters([])
        prevExternalFiltersRef.current = undefined
        lastSyncedExternalFiltersRef.current = undefined
      }
    }
  }, [externalFilters])
  
  // Track previous active filters to detect actual changes
  const prevActiveFiltersRef = useRef<Filter[]>(activeFilters)
  const onFiltersChangeRef = useRef(onFiltersChange)
  
  // Update ref when callback changes
  useEffect(() => {
    onFiltersChangeRef.current = onFiltersChange
  }, [onFiltersChange])
  
  // Notify parent of filter changes - but only if the change originated internally
  useEffect(() => {
    const currentStr = JSON.stringify(activeFilters)
    const prevStr = JSON.stringify(prevActiveFiltersRef.current)
    const lastExternalStr = JSON.stringify(lastSyncedExternalFiltersRef.current)
    
    // Only notify if:
    // 1. Filters actually changed
    // 2. Current filters are different from the last synced external filters (meaning it's an internal change)
    if (currentStr !== prevStr && currentStr !== lastExternalStr && onFiltersChangeRef.current) {
      onFiltersChangeRef.current(activeFilters)
      prevActiveFiltersRef.current = activeFilters
    } else if (currentStr !== prevStr) {
      // Update ref even if we don't notify
      prevActiveFiltersRef.current = activeFilters
    }
  }, [activeFilters])
  
  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false)
        setFilterStep("field")
        setCurrentFilterField(null)
        setCurrentFilterOperator(null)
      }
      // Close value pickers when clicking outside
      let clickedInsidePicker = false
      valuePickerRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          clickedInsidePicker = true
        }
      })
      if (!clickedInsidePicker) {
        setOpenValuePickerId(null)
      }
    }
    if (isFilterDropdownOpen || openValuePickerId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFilterDropdownOpen, openValuePickerId])
  const [snoozePopoverOpen, setSnoozePopoverOpen] = useState<number | null>(null)
  const [snoozeGroupPopoverOpen, setSnoozeGroupPopoverOpen] = useState<string | null>(null)
  const [snoozeModalOpen, setSnoozeModalOpen] = useState<number | null>(null)
  const [snoozeGroupModalOpen, setSnoozeGroupModalOpen] = useState<string | null>(null)
  const [snoozeGroupModalIds, setSnoozeGroupModalIds] = useState<number[]>([])
  const [bulkSnoozePopoverOpen, setBulkSnoozePopoverOpen] = useState(false)
  const [bulkSnoozeModalOpen, setBulkSnoozeModalOpen] = useState(false)
  const [snoozeDate, setSnoozeDate] = useState<Date | null>(null)
  const [snoozeTime, setSnoozeTime] = useState<string>("08:00")
  const snoozePopoverRef = useRef<HTMLDivElement>(null)
  const snoozeGroupPopoverRef = useRef<HTMLDivElement>(null)
  const bulkSnoozePopoverRef = useRef<HTMLDivElement>(null)

  // Helper functions for snooze times
  const getLaterToday = () => {
    const now = new Date()
    const later = new Date(now)
    later.setHours(18, 0, 0, 0) // 6:00 PM
    if (later <= now) {
      later.setDate(later.getDate() + 1)
      later.setHours(18, 0, 0, 0)
    }
    return later
  }

  const getTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0) // 8:00 AM
    return tomorrow
  }

  const getNextWeek = () => {
    const nextWeek = new Date()
    const dayOfWeek = nextWeek.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    nextWeek.setDate(nextWeek.getDate() + daysUntilMonday)
    nextWeek.setHours(8, 0, 0, 0) // 8:00 AM
    return nextWeek
  }

  const formatSnoozeTime = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const day = days[date.getDay()]
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    return `${day}, ${displayHours}:${displayMinutes} ${ampm}`
  }

  const formatSnoozedUntil = (date: Date | undefined, snoozedUntilFormatted: string | undefined) => {
    if (snoozedUntilFormatted) {
      return snoozedUntilFormatted
    }
    if (date) {
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    }
    return '--'
  }

  // Helper function to get grid column classes based on tab and view mode
  const getGridCols = (activeGroupBy: string, viewMode: string | undefined, activeTab: string) => {
    const hasStatusColumnCreated = activeTab === "created" && viewMode === "full-width"
    const hasStatusColumnAll = activeTab === "all" && viewMode === "full-width"
    const hasRequestedBy = activeTab !== "created"
    
    if (activeGroupBy === "requestor") {
      if (viewMode === "full-width") {
        // Checkbox + Requested by (hidden) + (Reviewed on if reviewed) + Requested on + Task type + Details + Due date/Status + (Status before Attributes if all/created) + Attributes + Actions
        if (activeTab === "reviewed") {
          // Checkbox + Requested by (hidden) + Reviewed on + Requested on + Task type + Details + Status + Attributes + Actions
          return 'grid-cols-[40px_minmax(120px,180px)_minmax(80px,130px)_minmax(80px,130px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_140px]'
        } else if (hasStatusColumnAll) {
          return 'grid-cols-[40px_minmax(120px,180px)_minmax(80px,130px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_100px_140px]'
        } else if (hasStatusColumnCreated) {
          return 'grid-cols-[40px_minmax(120px,180px)_minmax(80px,130px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_100px_140px]'
        } else {
          return 'grid-cols-[40px_minmax(120px,180px)_minmax(80px,130px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_140px]'
        }
      } else {
        if (activeTab === "reviewed") {
          // Checkbox + Requested by (hidden) + Reviewed on + Requested on + Task type + Details + Attributes + Actions
          return 'grid-cols-[40px_minmax(120px,180px)_minmax(80px,130px)_minmax(80px,130px)_100px_minmax(300px,1fr)_100px_140px]'
        } else {
          return 'grid-cols-[40px_minmax(120px,180px)_minmax(80px,130px)_100px_minmax(300px,1fr)_100px_140px]'
        }
      }
    } else if (activeGroupBy === "type") {
      if (viewMode === "full-width") {
        if (activeTab === "reviewed") {
          // Checkbox + Task type (hidden) + Reviewed on + Requested on + Requested by + Task type + Details + Status + Attributes + Actions
          return 'grid-cols-[40px_minmax(100px,160px)_minmax(80px,130px)_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_140px]'
        } else if (hasStatusColumnAll) {
          return 'grid-cols-[40px_minmax(100px,160px)_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_100px_140px]'
        } else if (hasStatusColumnCreated) {
          return 'grid-cols-[40px_minmax(100px,160px)_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_100px_140px]'
        } else {
          return 'grid-cols-[40px_minmax(100px,160px)_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_140px]'
        }
      } else {
        if (activeTab === "reviewed") {
          // Checkbox + Task type (hidden) + Reviewed on + Requested on + Requested by + Task type + Details + Attributes + Actions
          return 'grid-cols-[40px_minmax(100px,160px)_minmax(80px,130px)_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_100px_140px]'
        } else {
          return 'grid-cols-[40px_minmax(100px,160px)_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_100px_140px]'
        }
      }
    } else {
      // No grouping
      if (viewMode === "full-width") {
        if (activeTab === "reviewed") {
          // Checkbox + Reviewed on + Requested on + Requested by + Task type + Details + Status + Attributes + Actions
          return 'grid-cols-[40px_minmax(80px,130px)_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_140px]'
        } else if (hasStatusColumnAll) {
          // Checkbox + Requested on + (Requested by if not created) + Task type + Details + Due date + Status (before Attributes) + Attributes + Actions
          if (hasRequestedBy) {
            return 'grid-cols-[40px_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_100px_140px]'
          } else {
            return 'grid-cols-[40px_minmax(80px,130px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_100px_140px]'
          }
        } else if (hasStatusColumnCreated) {
          // Checkbox + Requested on + Task type + Details + Due date + Status (before Attributes) + Attributes + Actions
          return 'grid-cols-[40px_minmax(80px,130px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_100px_140px]'
        } else {
          if (hasRequestedBy) {
            return 'grid-cols-[40px_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_140px]'
          } else {
            return 'grid-cols-[40px_minmax(80px,130px)_100px_minmax(300px,1fr)_minmax(80px,120px)_100px_140px]'
          }
        }
      } else {
        if (activeTab === "reviewed") {
          // Checkbox + Reviewed on + Requested on + Requested by + Task type + Details + Attributes + Actions
          return 'grid-cols-[40px_minmax(80px,130px)_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_100px_140px]'
        } else if (hasRequestedBy) {
          return 'grid-cols-[40px_minmax(80px,130px)_minmax(120px,180px)_100px_minmax(300px,1fr)_100px_140px]'
        } else {
          return 'grid-cols-[40px_minmax(80px,130px)_100px_minmax(300px,1fr)_100px_140px]'
        }
      }
    }
  }

  const handleSnooze = (id: number, snoozeUntil: Date) => {
    if (onSnooze) {
      onSnooze(id, snoozeUntil)
    }
    setSnoozePopoverOpen(null)
    setSnoozeModalOpen(null)
  }

  const handleBulkSnooze = (snoozeUntil: Date) => {
    if (onSnooze && selectedItems && selectedItems.size > 0) {
      Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
      setBulkSnoozePopoverOpen(false)
      setBulkSnoozeModalOpen(false)
      onClearSelection()
    }
  }

  const handleQuickSnooze = (id: number, type: 'laterToday' | 'tomorrow' | 'nextWeek') => {
    let snoozeUntil: Date
    if (type === 'laterToday') {
      snoozeUntil = getLaterToday()
    } else if (type === 'tomorrow') {
      snoozeUntil = getTomorrow()
    } else {
      snoozeUntil = getNextWeek()
    }
    handleSnooze(id, snoozeUntil)
  }

  const handleSaveSnooze = (id: number) => {
    if (snoozeDate && snoozeTime) {
      const [hours, minutes] = snoozeTime.split(':').map(Number)
      const snoozeUntil = new Date(snoozeDate)
      snoozeUntil.setHours(hours, minutes, 0, 0)
      handleSnooze(id, snoozeUntil)
      setSnoozeDate(null)
      setSnoozeTime("08:00")
    }
  }

  const handleGroupQuickSnooze = (groupKey: string, groupApprovalIds: number[], type: 'laterToday' | 'tomorrow' | 'nextWeek') => {
    let snoozeUntil: Date
    if (type === 'laterToday') {
      snoozeUntil = getLaterToday()
    } else if (type === 'tomorrow') {
      snoozeUntil = getTomorrow()
    } else {
      snoozeUntil = getNextWeek()
    }
    groupApprovalIds.forEach(id => {
      if (onSnooze) {
        onSnooze(id, snoozeUntil)
      }
    })
    setSnoozeGroupPopoverOpen(null)
  }

  const handleSaveGroupSnooze = (groupKey: string, groupApprovalIds: number[]) => {
    if (snoozeDate && snoozeTime) {
      const [hours, minutes] = snoozeTime.split(':').map(Number)
      const snoozeUntil = new Date(snoozeDate)
      snoozeUntil.setHours(hours, minutes, 0, 0)
      groupApprovalIds.forEach(id => {
        if (onSnooze) {
          onSnooze(id, snoozeUntil)
        }
      })
      setSnoozeDate(null)
      setSnoozeTime("08:00")
      setSnoozeGroupModalOpen(null)
    }
  }
  
  // Sync internal groupBy with external prop
  useEffect(() => {
    setInternalGroupBy(groupBy)
  }, [groupBy])
  
  const activeGroupBy = onGroupByChange ? groupBy : internalGroupBy
  const handleGroupByChange = (newGroupBy: "none" | "requestor" | "type") => {
    if (onGroupByChange) {
      onGroupByChange(newGroupBy)
    } else {
      setInternalGroupBy(newGroupBy)
    }
  }
  
  // Reset collapsed groups when groupBy changes
  useEffect(() => {
    setCollapsedGroups(new Set())
  }, [groupBy, internalGroupBy])
  
  // Handle click outside for group by dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupByDropdownRef.current && !groupByDropdownRef.current.contains(event.target as Node)) {
        setIsGroupByDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Sync internal sortBy with external prop if provided
  useEffect(() => {
    if (externalSortBy !== undefined) {
      setSortBy(externalSortBy)
    }
  }, [externalSortBy])
  
  const handleSortChange = (newSortBy: { column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" } | "recency" | "dueDate") => {
    setSortBy(newSortBy)
    if (onSortChange) {
      onSortChange(newSortBy)
    }
  }
  const [isRequestTypeDropdownOpen, setIsRequestTypeDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [isPendingDropdownOpen, setIsPendingDropdownOpen] = useState(false)
  const requestTypeDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const pendingDropdownRef = useRef<HTMLDivElement>(null)

  // Update internal state when external props change
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery)
    }
  }, [externalSearchQuery])
  
  useEffect(() => {
    if (externalSelectedCategory !== undefined) {
      setSelectedRequestType(externalSelectedCategory)
    }
  }, [externalSelectedCategory])

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    if (onSearchChange) {
      onSearchChange(query)
    }
  }
  
  // Handle category change
  const handleCategoryChange = (category: string) => {
    setSelectedRequestType(category)
    if (onCategoryChange) {
      onCategoryChange(category)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (requestTypeDropdownRef.current && !requestTypeDropdownRef.current.contains(event.target as Node)) {
        setIsRequestTypeDropdownOpen(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false)
      }
      if (pendingDropdownRef.current && !pendingDropdownRef.current.contains(event.target as Node)) {
        setIsPendingDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Current user for "Created by me" filter
  const currentUser = "Acme, Inc."
  
  // Memoize data arrays to prevent recreation on every render
  const approvalData = useMemo(() => generateApprovalData(), [])
  
  // Helper function to extract attributes from details copy (for tooltip generation)
  // Note: This is a simplified version for tooltips - full version is in lib/approval-data.ts
  const extractAttributes = (detailsCopy: string, example: string) => {
    const attributes: Record<string, string> = {}
    
    // Extract {impacted employee} or {impacted person}
    const employeeMatch = detailsCopy.match(/\{impacted (employee|person)\}/)
    if (employeeMatch) {
      // Try to extract from example
      const exampleParts = example.split(/(?:'s|for|to)/)
      if (exampleParts.length > 0) {
        attributes.impactedEmployee = exampleParts[0].trim()
      }
    }
    
    // Extract {number}
    if (detailsCopy.includes('{number}')) {
      const numberMatch = example.match(/(\d+)/)
      if (numberMatch) {
        attributes.number = numberMatch[1]
      }
    }
    
    // Extract {amount}
    if (detailsCopy.includes('{amount}')) {
      const amountMatch = example.match(/\$([\d,]+\.?\d*)/)
      if (amountMatch) {
        attributes.amount = `$${amountMatch[1]}`
      }
    }
    
    // Extract {recipient}
    if (detailsCopy.includes('{recipient}')) {
      const recipientMatch = example.match(/to (.+?)(?:,|$)/)
      if (recipientMatch) {
        attributes.recipient = recipientMatch[1].trim()
      }
    }
    
    // Extract {role}
    if (detailsCopy.includes('{role}')) {
      const roleMatch = example.match(/\(([^)]+)\)/)
      if (roleMatch) {
        attributes.role = roleMatch[1].trim()
      }
    }
    
    // Extract {record name} and {object}
    if (detailsCopy.includes('{record name}')) {
      const recordMatch = example.match(/record[_\s]*(\w+)/i)
      if (recordMatch) {
        attributes.recordName = recordMatch[1]
      }
    }
    if (detailsCopy.includes('{object}')) {
      const objectMatch = example.match(/object[_\s]*(\w+)/i)
      if (objectMatch) {
        attributes.object = objectMatch[1]
      }
    }
    
    // Extract {field} and {new value}
    if (detailsCopy.includes('{field}')) {
      const fieldMatch = example.match(/(\w+)\s*->/)
      if (fieldMatch) {
        attributes.field = fieldMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{new value}')) {
      const valueMatch = example.match(/->\s*(.+?)(?:,|$)/)
      if (valueMatch) {
        attributes.newValue = valueMatch[1].trim()
      }
    }
    
    // Extract {entity} and {period}
    if (detailsCopy.includes('{entity}')) {
      const entityMatch = example.match(/for (.+?)\s*\(/)
      if (entityMatch) {
        attributes.entity = entityMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{period}')) {
      const periodMatch = example.match(/\((.+?)\)/)
      if (periodMatch) {
        attributes.period = periodMatch[1].trim()
      }
    }
    
    // Extract {title}, {level}, {department}
    if (detailsCopy.includes('{title}')) {
      const titleMatch = example.match(/for (.+?)\s*\(/)
      if (titleMatch) {
        attributes.title = titleMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{level}')) {
      const levelMatch = example.match(/\(([^)]+)\)/)
      if (levelMatch) {
        const levelParts = levelMatch[1].split(',')
        if (levelParts.length > 0) {
          attributes.level = levelParts[0].trim()
        }
      }
    }
    if (detailsCopy.includes('{department}')) {
      const deptMatch = example.match(/in (.+?)(?:,|$)/)
      if (deptMatch) {
        attributes.department = deptMatch[1].trim()
      }
    }
    
    // Extract {vendor}
    if (detailsCopy.includes('{vendor}')) {
      const vendorMatch = example.match(/^(.+?)\s+license/i)
      if (vendorMatch) {
        attributes.vendor = vendorMatch[1].trim()
      }
    }
    
    // Extract {candidate name} and {position}
    if (detailsCopy.includes('{candidate name}')) {
      const candidateMatch = example.match(/for (.+?)\s*\(/)
      if (candidateMatch) {
        attributes.candidateName = candidateMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{position}')) {
      const positionMatch = example.match(/\(([^)]+)\)/)
      if (positionMatch) {
        attributes.position = positionMatch[1].trim()
      }
    }
    
    // Extract {requisition name}
    if (detailsCopy.includes('{requisition name}')) {
      const reqMatch = example.match(/""(.+?)""/)
      if (reqMatch) {
        attributes.requisitionName = reqMatch[1].trim()
      }
    }
    
    // Extract {requested time}, {shift}, {proposed time}, {dropped time}, {shift1}, {shift2}
    if (detailsCopy.includes('{requested time}') || detailsCopy.includes('{shift}') || detailsCopy.includes('{proposed time}') || detailsCopy.includes('{dropped time}')) {
      const timeMatch = example.match(/(Dec \d+, \d{2}:\d{2} [AP]M - \d{2}:\d{2} [AP]M [A-Z]+)/)
      if (timeMatch) {
        attributes.shift = timeMatch[1]
      }
    }
    
    // Extract {trip name} and {flight details}
    if (detailsCopy.includes('{trip name}')) {
      const tripMatch = example.match(/""(.+?)""/)
      if (tripMatch) {
        attributes.tripName = tripMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{flight details}')) {
      const flightMatch = example.match(/\((.+?)\)/)
      if (flightMatch) {
        attributes.flightDetails = flightMatch[1].trim()
      }
    }
    
    // Extract {payout amount}, {payee}
    if (detailsCopy.includes('{payout amount}')) {
      const payoutMatch = example.match(/\$([\d,]+\.?\d*)/)
      if (payoutMatch) {
        attributes.payoutAmount = `$${payoutMatch[1]}`
      }
    }
    if (detailsCopy.includes('{payee}')) {
      const payeeMatch = example.match(/for (.+?)\s*\(/)
      if (payeeMatch) {
        attributes.payee = payeeMatch[1].trim()
      }
    }
    
    // Extract {Carrier}, {impacted employees}, {Cost}, {Effective date}
    if (detailsCopy.includes('{Carrier}')) {
      const carrierMatch = example.match(/Add (.+?)\s*\(/)
      if (carrierMatch) {
        attributes.carrier = carrierMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{impacted employees}')) {
      const employeesMatch = example.match(/\((\d+)\s+employees/)
      if (employeesMatch) {
        attributes.impactedEmployees = employeesMatch[1]
      }
    }
    if (detailsCopy.includes('{Cost}')) {
      const costMatch = example.match(/(\d+K\/mo)/)
      if (costMatch) {
        attributes.cost = costMatch[1]
      }
    }
    if (detailsCopy.includes('{Effective date}')) {
      const dateMatch = example.match(/Effective (.+?)\)/)
      if (dateMatch) {
        attributes.effectiveDate = dateMatch[1].trim()
      }
    }
    
    // Extract {logged time} and {date}
    if (detailsCopy.includes('{logged time}')) {
      const timeMatch = example.match(/^(.+?)\s+on/)
      if (timeMatch) {
        attributes.loggedTime = timeMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{date}')) {
      const dateMatch = example.match(/on (.+?)$/)
      if (dateMatch) {
        attributes.date = dateMatch[1].trim()
      }
    }
    
    // Extract {requested quantity}, {type of request}, {start date}, {end date}
    if (detailsCopy.includes('{requested quantity}')) {
      const qtyMatch = example.match(/^(.+?)\s+/)
      if (qtyMatch) {
        attributes.requestedQuantity = qtyMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{type of request}')) {
      const typeMatch = example.match(/\d+\.\d+\s+(.+?)\s+\(/)
      if (typeMatch) {
        attributes.typeOfRequest = typeMatch[1].trim()
      }
    }
    if (detailsCopy.includes('{start date}') && detailsCopy.includes('{end date}')) {
      const dateMatch = example.match(/\((.+?)\)/)
      if (dateMatch) {
        const dates = dateMatch[1].split('-')
        if (dates.length === 2) {
          attributes.startDate = dates[0].trim()
          attributes.endDate = dates[1].trim()
        }
      }
    }
    
    return attributes
  }

  const taskData = useMemo(() => [
    // Pending tasks
    {
      id: 101,
      requestor: "HR Team",
      subject: "Take required cybersecurity course for Q4 certification",
      category: "Training",
      time: "2 hours ago",
      requestedOn: "Jan 16, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "HR Team",
      courseName: "Cybersecurity Fundamentals",
      dueDate: "Jan 31, 2025",
      estimatedDuration: "3 hours",
      summary: "You are required to complete the Cybersecurity Fundamentals course as part of Q4 certification requirements. This course covers essential security practices and must be completed before the due date."
    },
    {
      id: 102,
      requestor: "Legal Department",
      subject: "Sign updated company policy document",
      category: "Documents",
      time: "5 hours ago",
      requestedOn: "Jan 17, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Legal Department",
      documentName: "Employee Handbook 2024",
      dueDate: "Jan 21, 2025",
      summary: "The Legal Department requires you to review and sign the updated Employee Handbook 2024. This document contains important policy updates and must be signed by the due date."
    },
    {
      id: 103,
      requestor: "Onboarding Team",
      subject: "Take new hire Alex Martinez out to lunch",
      category: "Miscellaneous",
      time: "1 day ago",
      requestedOn: "Jan 18, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Onboarding Team",
      newHireName: "Alex Martinez",
      newHireRole: "Software Engineer",
      suggestedDate: "This week",
      dueDate: "Feb 1, 2025",
      summary: "Alex Martinez joined the team as a Software Engineer this week. Please take them out to lunch to help them feel welcome and integrated into the team. This is an important part of our onboarding process."
    },
    {
      id: 104,
      requestor: "HR Team",
      subject: "Complete leadership development course",
      category: "Training",
      time: "2 days ago",
      requestedOn: "Jan 4, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "HR Team",
      courseName: "Leadership Essentials",
      dueDate: "Jan 18, 2025",
      estimatedDuration: "8 hours",
      summary: "You have been selected to participate in the Leadership Essentials development program. This course is designed to enhance leadership skills and prepare you for management opportunities."
    },
    {
      id: 105,
      requestor: "Legal Department",
      subject: "Sign non-disclosure agreement for new project",
      category: "Documents",
      time: "3 days ago",
      requestedOn: "Jan 3, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Legal Department",
      documentName: "NDA - Project Phoenix",
      dueDate: "Jan 10, 2025",
      summary: "You are being assigned to work on Project Phoenix, which requires signing a non-disclosure agreement due to the confidential nature of the project. This NDA must be signed before you can access project materials."
    },
    {
      id: 106,
      requestor: "Onboarding Team",
      subject: "Take new hire Sarah Kim out to lunch",
      category: "Miscellaneous",
      time: "4 days ago",
      requestedOn: "Jan 2, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Onboarding Team",
      newHireName: "Sarah Kim",
      newHireRole: "Product Designer",
      suggestedDate: "This week",
      dueDate: "Jan 16, 2025",
      summary: "Sarah Kim recently joined the team as a Product Designer. Please take them out to lunch to help welcome them to the company and build team connections."
    },
    // Reviewed tasks
    {
      id: 107,
      requestor: "HR Team",
      subject: "Complete annual performance review",
      category: "Training",
      time: "1 week ago",
      requestedOn: "Jan 5, 2025",
      status: "reviewed",
      reviewStatus: "Completed",
      itemStatus: "Completed",
      isSnoozed: false,
      createdBy: "HR Team",
      reviewedOn: "Jan 12, 2025",
      courseName: "Performance Review Process",
      dueDate: "Jan 15, 2025",
      summary: "Annual performance review completion required for all employees."
    },
    {
      id: 108,
      requestor: "Legal Department",
      subject: "Sign updated privacy policy",
      category: "Documents",
      time: "1 week ago",
      requestedOn: "Jan 1, 2025",
      status: "reviewed",
      reviewStatus: "Completed",
      itemStatus: "Completed",
      isSnoozed: false,
      createdBy: "Legal Department",
      reviewedOn: "Jan 10, 2025",
      documentName: "Privacy Policy 2025",
      dueDate: "Jan 8, 2025",
      summary: "Updated privacy policy requires signature from all employees."
    },
    // Snoozed tasks
    {
      id: 109,
      requestor: "HR Team",
      subject: "Complete diversity and inclusion training",
      category: "Training",
      time: "3 days ago",
      requestedOn: "Jan 16, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: true,
      createdBy: "HR Team",
      snoozedUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // 3 days and 14 hours from now
      snoozedUntilFormatted: (() => {
        const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000);
        return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
      })(),
      courseName: "Diversity & Inclusion",
      dueDate: "Jan 30, 2025",
      estimatedDuration: "2 hours",
      summary: "Mandatory diversity and inclusion training for all employees."
    },
    // Created by me tasks
    {
      id: 110,
      requestor: "Acme, Inc.",
      subject: "Review Q1 strategic planning document",
      category: "Documents",
      time: "1 day ago",
      requestedOn: "Jan 18, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Acme, Inc.",
      documentName: "Q1 Strategic Plan 2025",
      dueDate: "Jan 25, 2025",
      summary: "Strategic planning document requires review and approval."
    },
    {
      id: 111,
      requestor: "Acme, Inc.",
      subject: "Complete team building activity",
      category: "Miscellaneous",
      time: "2 days ago",
      requestedOn: "Jan 17, 2025",
      status: "reviewed",
      reviewStatus: "Completed",
      itemStatus: "Completed",
      isSnoozed: false,
      createdBy: "Acme, Inc.",
      reviewedOn: "Jan 19, 2025",
      newHireName: "Team Event",
      newHireRole: "Activity",
      suggestedDate: "This month",
      dueDate: "Jan 20, 2025",
      summary: "Quarterly team building activity completion."
    },
    {
      id: 112,
      requestor: "Payroll Team",
      subject: "Submit amendment for MI state Wh filing",
      category: "Payroll",
      time: "1 hour ago",
      requestedOn: "Jan 21, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Payroll Team",
      dueDate: "Jan 25, 2025",
      isCritical: true,
      pinned: true,
      summary: "The employer account number is missing, preventing your filing from being submitted to the agency. Consequently, if you have a tax liability for this period, payments may be affected. To allow Rippling to submit a re-file and/or payment and ensure future filings are not impacted, you must enter the account number in your Rippling tax settings. Please reach out to Rippling Support if a re-file and payment need to be submitted.",
      entity: "White and Sons, US Pty Ltd",
      filing: "MI State Wh Filing",
      agency: "PASW",
      accountNumber: "Missing",
      accountNumberMissing: true
    },
    {
      id: 113,
      requestor: "Payroll Team",
      subject: "Submit amendment for CA state UI filing",
      category: "Payroll",
      time: "3 days ago",
      requestedOn: "Jan 18, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Payroll Team",
      dueDate: "Jan 22, 2025",
      isCritical: true,
      pinned: true,
      summary: "The employer account number is missing, preventing your filing from being submitted to the agency. Consequently, if you have a tax liability for this period, payments may be affected. To allow Rippling to submit a re-file and/or payment and ensure future filings are not impacted, you must enter the account number in your Rippling tax settings. Please reach out to Rippling Support if a re-file and payment need to be submitted.",
      entity: "Tech Solutions Inc",
      filing: "CA State UI Filing",
      agency: "EDD",
      accountNumber: "Missing",
      accountNumberMissing: true
    }
  ], [])

  // For tasks page, show both approvals and tasks
  const allData = useMemo(() => [...approvalData, ...taskData], [approvalData, taskData])

  // Filter by activeTab (static filtering based on initial data only)
  const approvals = useMemo(() => {
    let filtered = allData
    if (activeTab === "pending") {
      filtered = allData.filter(a => {
        // Show pending items that are not snoozed and not created by current user
        return !a.isSnoozed && a.status === "pending" && a.createdBy !== currentUser && !removedItems.has(a.id)
      })
    } else if (activeTab === "reviewed") {
      filtered = allData.filter(a => {
        // Show items that have a reviewStatus in the initial data
        return (a as any).reviewStatus && !removedItems.has(a.id)
      })
    } else if (activeTab === "snoozed") {
      filtered = allData.filter(a => {
        // Show items that are snoozed in the initial data
        return a.isSnoozed && !removedItems.has(a.id)
      })
    } else if (activeTab === "created") {
      filtered = allData.filter(a => a.createdBy === currentUser && !removedItems.has(a.id))
    } else if (activeTab === "all") {
      filtered = allData.filter(a => !removedItems.has(a.id)) // Show all items except removed
    }
    // For opt1, opt2, opt3, opt4 (legacy tabs), show pending items
    else if (activeTab === "opt1" || activeTab === "opt2" || activeTab === "opt3" || activeTab === "opt4") {
      filtered = allData.filter(a => {
        return !a.isSnoozed && a.status === "pending" && !removedItems.has(a.id)
      })
    }
    return filtered
  }, [allData, activeTab, removedItems, currentUser])

  const requestTypes = page === "tasks" || page === "inbox" || page === "approvals"
    ? ["All", "Approvals", "HR Management", "Reimbursements", "Time and Attendance", "Training", "Documents", "Miscellaneous", "Payroll"]
    : ["All", "HR Management", "Reimbursements", "Time and Attendance"]
  
  // For tasks page, handle hierarchical category filtering
  const getCategoryMatch = (approval: any, selectedCategory: string) => {
    if (selectedCategory === "All") return true
    if (selectedCategory === "Critical") {
      return (approval as any).isCritical === true
    }
    if (selectedCategory === "Approvals" || selectedCategory === "Approvals - All") {
      return approval.category.startsWith("Approvals -")
    }
    if (selectedCategory === "Tasks") {
      // Tasks includes Documents, Training, Miscellaneous, and Payroll
      return approval.category === "Documents" || approval.category === "Training" || approval.category === "Miscellaneous" || approval.category === "Payroll"
    }
    if (selectedCategory === "Trainings") {
      // Handle "Trainings" label but match "Training" category
      return approval.category === "Training"
    }
    if (selectedCategory === "HR Management" || selectedCategory === "Reimbursements" || selectedCategory === "Time and Attendance") {
      return approval.category === `Approvals - ${selectedCategory}` || approval.category === selectedCategory
    }
    // For approvals page, check if selectedCategory is a task type (use display category name)
    if (page === "approvals" && approval.category.startsWith("Approvals -")) {
      return getDisplayCategory(approval.category) === selectedCategory
    }
    return approval.category === selectedCategory
  }

  const filteredApprovals = approvals.filter(approval => {
    // Remove filter - exclude removed items
    if (removedItems.has(approval.id)) return false
    // Only exclude snoozed items if not on snoozed tab
    if (activeTab !== "snoozed" && activeTab !== "all" && (approval.isSnoozed || snoozedItems.has(approval.id))) return false
    
    // Finance page removed - no special handling needed
    
    // For approvals page, only show items that are approvals
    if (page === "approvals" && !approval.category.startsWith("Approvals -")) {
      return false
    }
    
    const searchMatch = searchQuery === "" || 
      approval.requestor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.category.toLowerCase().includes(searchQuery.toLowerCase())
    const typeMatch = (page === "tasks" || page === "inbox" || page === "approvals")
      ? (selectedRequestType === "All" ? true : getCategoryMatch(approval, selectedRequestType))
      : (selectedRequestType === "All" || approval.category === `Approvals - ${selectedRequestType}`)
    
    // Apply active filters
    const filterMatch = activeFilters.every(filter => {
      if (!filter.value || (Array.isArray(filter.value) && filter.value.length === 0)) return true // Incomplete filter
      
      let fieldValue: any
      switch (filter.field) {
        case "status":
          fieldValue = (approval as any).itemStatus || (approval as any).reviewStatus
          break
        case "requestor":
          fieldValue = approval.requestor
          break
        case "taskType":
        case "category":
          fieldValue = approval.category
          break
        case "reviewStatus":
          fieldValue = (approval as any).reviewStatus
          break
        case "requestedOn":
          fieldValue = approval.requestedOn
          break
        default:
          return true
      }
      
      if (filter.field === "requestedOn") {
        // Handle date filter - skip if value is an array
        if (Array.isArray(filter.value)) return true
        const filterDate = typeof filter.value === "string" ? new Date(filter.value) : filter.value instanceof Date ? filter.value : new Date(String(filter.value))
        const approvalDate = new Date(fieldValue)
        switch (filter.operator) {
          case "before":
            return approvalDate < filterDate
          case "after":
            return approvalDate > filterDate
          case "equals":
            return approvalDate.toDateString() === filterDate.toDateString()
          default:
            return true
        }
      } else {
        const fieldStr = String(fieldValue).toLowerCase()
        const filterStr = String(filter.value).toLowerCase()
        switch (filter.operator) {
          case "equals":
          case "is":
            return fieldStr === filterStr
          case "isNot":
            return fieldStr !== filterStr
          case "contains":
            return fieldStr.includes(filterStr)
          default:
            return true
        }
      }
    })
    
    return searchMatch && typeMatch && filterMatch
  })

  // Sort filtered approvals
  const sortedApprovals = [...filteredApprovals].sort((a, b) => {
    // Pinned items and critical tasks (that aren't explicitly unpinned) always go to the top
    const aIsCritical = (a as any).isCritical === true
    const bIsCritical = (b as any).isCritical === true
    const aIsPinned = pinnedItems.has(a.id) || (aIsCritical && !unpinnedCriticalItems.has(a.id))
    const bIsPinned = pinnedItems.has(b.id) || (bIsCritical && !unpinnedCriticalItems.has(b.id))
    if (aIsPinned && !bIsPinned) return -1
    if (!aIsPinned && bIsPinned) return 1
    if (aIsPinned && bIsPinned) return 0 // Keep pinned items in their original order
    
    // For reviewed tab, sort by reviewedOn (most recent first)
    if (activeTab === "reviewed") {
      const parseDate = (dateStr: string | undefined) => {
        if (!dateStr) return 0
        try {
          return new Date(dateStr).getTime()
        } catch {
          return 0
        }
      }
      
      const reviewedOnA = parseDate((a as any).reviewedOn)
      const reviewedOnB = parseDate((b as any).reviewedOn)
      // Most recently reviewed first
      return reviewedOnB - reviewedOnA
    }
    
    // Determine sort column and direction
    let sortColumn: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil" = "requestedOn"
    let sortDirection: "asc" | "desc" = "asc"
    
    if (typeof sortBy === "object" && sortBy !== null) {
      sortColumn = sortBy.column
      sortDirection = sortBy.direction
    } else if (sortBy === "dueDate") {
      sortColumn = "dueDate"
      sortDirection = "asc"
    } else {
      // Default based on activeTab
      if (activeTab === "reviewed") {
        sortColumn = "reviewedOn"
        sortDirection = "desc"
      } else if (activeTab === "snoozed") {
        sortColumn = "snoozedUntil"
        sortDirection = "asc"
      } else {
        sortColumn = "requestedOn"
        sortDirection = "asc"
      }
    }
    
    // Helper to parse dates
    const parseDate = (dateStr: string | undefined) => {
      if (!dateStr) return 0
      try {
        return new Date(dateStr).getTime()
      } catch {
        return 0
      }
    }
    
    // Helper to parse time strings
    const parseTime = (timeStr: string) => {
      if (!timeStr) return Infinity
      if (timeStr.includes("just now")) {
        return 0
      } else if (timeStr.includes("min ago")) {
        return parseInt(timeStr) * 60000
      } else if (timeStr.includes("hour") || timeStr.includes("hours ago")) {
        const hours = parseInt(timeStr)
        return hours * 3600000
      } else if (timeStr.includes("day") || timeStr.includes("days ago")) {
        const days = parseInt(timeStr)
        return days * 86400000
      }
      return Infinity
    }
    
    let comparison = 0
    
    if (sortColumn === "requestedOn") {
      const dateA = parseDate(a.requestedOn)
      const dateB = parseDate(b.requestedOn)
      if (dateA !== dateB) {
        comparison = dateA - dateB
      } else {
        // If dates are the same, use time as tiebreaker
        comparison = parseTime(a.time) - parseTime(b.time)
      }
    } else if (sortColumn === "requestedBy") {
      comparison = a.requestor.localeCompare(b.requestor)
    } else if (sortColumn === "taskType") {
      comparison = a.category.localeCompare(b.category)
    } else if (sortColumn === "dueDate") {
      const aHasDueDate = 'dueDate' in a && a.dueDate
      const bHasDueDate = 'dueDate' in b && b.dueDate
      if (!aHasDueDate && !bHasDueDate) {
        comparison = 0
      } else if (!aHasDueDate) {
        comparison = 1
      } else if (!bHasDueDate) {
        comparison = -1
      } else {
        const dateA = new Date(a.dueDate as string)
        const dateB = new Date(b.dueDate as string)
        comparison = dateA.getTime() - dateB.getTime()
      }
    } else if (sortColumn === "reviewedOn") {
      const reviewedOnA = parseDate((a as any).reviewedOn)
      const reviewedOnB = parseDate((b as any).reviewedOn)
      comparison = reviewedOnA - reviewedOnB
    } else if (sortColumn === "snoozedUntil") {
      // Parse snoozed until date
      const parseSnoozedUntil = (approval: any) => {
        if (snoozedItems instanceof Map && snoozedItems.has(approval.id)) {
          const snoozeDate = snoozedItems.get(approval.id)
          if (snoozeDate) {
            return snoozeDate.getTime()
          }
        }
        // Fallback to data
        if (approval.snoozedUntil) {
          return parseDate(approval.snoozedUntil)
        }
        return 0
      }
      const snoozedA = parseSnoozedUntil(a)
      const snoozedB = parseSnoozedUntil(b)
      comparison = snoozedA - snoozedB
    }
    
    // Apply direction
    return sortDirection === "asc" ? comparison : -comparison
  })

  // Group approvals if groupBy is set
  type GroupedApproval = { type: 'group', key: string, label: string, count: number, approvals: typeof sortedApprovals } | { type: 'approval', approval: typeof sortedApprovals[0] }
  const groupedApprovals: GroupedApproval[] = (() => {
    if (activeGroupBy === "none") {
      return sortedApprovals.map(approval => ({ type: 'approval' as const, approval }))
    }
    
    const groups = new Map<string, typeof sortedApprovals>()
    for (const approval of sortedApprovals) {
      let key: string
      let label: string
      if (activeGroupBy === "requestor") {
        key = approval.requestor
        label = approval.requestor
      } else { // activeGroupBy === "type"
        key = approval.category
        label = getDisplayCategory(approval.category)
      }
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(approval)
    }
    
    const result: GroupedApproval[] = []
    // Sort groups: pinned groups first, then alphabetically within each category
    const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
      const aHasPinned = a[1].some(approval => pinnedItems.has(approval.id))
      const bHasPinned = b[1].some(approval => pinnedItems.has(approval.id))
      
      // Pinned groups come first
      if (aHasPinned && !bHasPinned) return -1
      if (!aHasPinned && bHasPinned) return 1
      
      // Within same pinned status, sort alphabetically
      return a[0].localeCompare(b[0])
    })
    
    for (const [key, approvals] of sortedGroups) {
      const label = activeGroupBy === "requestor" ? key : getDisplayCategory(key)
      result.push({ type: 'group', key, label, count: approvals.length, approvals })
      if (!collapsedGroups.has(key)) {
        for (const approval of approvals) {
          result.push({ type: 'approval', approval })
        }
      }
    }
    return result
  })()

  // Notify parent of filtered IDs for navigation
  const prevFilteredIdsRef = useRef<string>('')
  useEffect(() => {
    if (onFilteredIdsChange) {
      const currentIds = sortedApprovals.map(approval => approval.id).join(',')
      if (currentIds !== prevFilteredIdsRef.current) {
        prevFilteredIdsRef.current = currentIds
        onFilteredIdsChange(sortedApprovals.map(approval => approval.id))
      }
    }
  }, [sortedApprovals, onFilteredIdsChange])

  // Calculate and notify parent of category counts
  // Use unfiltered approvals array to get accurate counts regardless of selection
  const categoryCountsRef = useRef<Record<string, number>>({})
  const onCategoryCountsChangeRef = useRef(onCategoryCountsChange)
  
  // Update ref when callback changes
  useEffect(() => {
    onCategoryCountsChangeRef.current = onCategoryCountsChange
  }, [onCategoryCountsChange])
  
  // Track previous approvals length to detect actual changes
  const prevApprovalsLengthRef = useRef(approvals.length)
  const prevApprovalsIdsRef = useRef<string>(approvals.map(a => a.id).join(','))
  
  // Memoize the approvals IDs string to prevent unnecessary recalculations
  const approvalsIdsString = useMemo(() => approvals.map(a => a.id).join(','), [approvals])
  
  // Calculate category counts from the approvals array (filtered by activeTab)
  useEffect(() => {
    if (!onCategoryCountsChangeRef.current) return
    
    // Use the approvals array which is already filtered by activeTab and removedItems
    const counts: Record<string, number> = {}
    
    // Count All (all approvals in the current tab)
    counts["All"] = approvals.length
    
    // Count Approvals (all that start with "Approvals -")
    counts["Approvals"] = approvals.filter(a => a.category.startsWith("Approvals -")).length
    
    // Count Tasks (Documents, Training, Miscellaneous, Payroll)
    counts["Tasks"] = approvals.filter(a => 
      a.category === "Documents" || a.category === "Training" || a.category === "Miscellaneous" || a.category === "Payroll"
    ).length
    
    // Count individual categories
    counts["HR Management"] = approvals.filter(a => 
      a.category === "Approvals - HR Management" || a.category === "HR Management"
    ).length
    counts["Time and Attendance"] = approvals.filter(a => 
      a.category === "Approvals - Time and Attendance" || a.category === "Time and Attendance"
    ).length
    counts["Reimbursements"] = approvals.filter(a => 
      a.category === "Approvals - Reimbursements" || a.category === "Reimbursements"
    ).length
    counts["Documents"] = approvals.filter(a => a.category === "Documents").length
    counts["Training"] = approvals.filter(a => a.category === "Training").length
    counts["Miscellaneous"] = approvals.filter(a => a.category === "Miscellaneous").length
    counts["Payroll"] = approvals.filter(a => a.category === "Payroll").length
    
    // Count Critical tasks
    counts["Critical"] = approvals.filter(a => (a as any).isCritical === true).length
    
    // Count task types (for approvals page quick filters)
    if (page === "approvals") {
      const taskTypeCounts: Record<string, number> = {}
      approvals.forEach(a => {
        // Use display category name instead of taskType to show "IT" instead of "IT automations"
        const displayCategory = getDisplayCategory(a.category)
        if (displayCategory && a.category.startsWith("Approvals -")) {
          taskTypeCounts[displayCategory] = (taskTypeCounts[displayCategory] || 0) + 1
        }
      })
      // Add task type counts to the counts object
      Object.keys(taskTypeCounts).forEach(taskType => {
        counts[taskType] = taskTypeCounts[taskType]
      })
    }
    
    // Only call the callback if counts actually changed
    const countsString = JSON.stringify(counts)
    const prevCountsString = JSON.stringify(categoryCountsRef.current)
    if (countsString !== prevCountsString) {
      categoryCountsRef.current = counts
      onCategoryCountsChangeRef.current(counts)
    }
  }, [approvals])

  const isAllSelected = sortedApprovals.length > 0 && sortedApprovals.every(approval => selectedItems.has(approval.id))
  const isSomeSelected = sortedApprovals.some(approval => selectedItems.has(approval.id))
  const hasSelectedItems = selectedItems.size > 0

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSelectAllClick = () => {
    if (isAllSelected) {
      onClearSelection()
    } else {
      onSelectAll(sortedApprovals.map(approval => approval.id))
    }
  }

  const handleIconMouseEnter = (e: React.MouseEvent<HTMLDivElement>, approvalId: number, type: string) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    const target = e.currentTarget
    if (!target) return
    
    tooltipTimeoutRef.current = setTimeout(() => {
      // Check if element still exists and is in the DOM
      if (!target || !document.body.contains(target)) {
        return
      }
      try {
        const rect = target.getBoundingClientRect()
        // Check if this is a reimbursement details tooltip
        const approval = approvals.find(a => a.id === approvalId)
        const isReimbursementDetails = type === 'details' && approval && 
          (approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements")
        const tooltipWidth = type === 'warning' || type === 'trip' ? 256 : 
          type === 'details' ? (isReimbursementDetails ? 500 : 285) : 320 // Wider for reimbursement details tooltip with receipt
        const tooltipHeight = 150 // Estimated height
        const padding = 8
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Calculate available space on right and left
        const spaceOnRight = viewportWidth - rect.right - padding
        const spaceOnLeft = rect.left - padding
        
        // Determine position (prefer right, fallback to left)
        let x: number
        let side: 'left' | 'right'
        if (spaceOnRight >= tooltipWidth) {
          // Position to the right
          x = rect.right + padding
          side = 'right'
        } else if (spaceOnLeft >= tooltipWidth) {
          // Position to the left
          x = rect.left - padding
          side = 'left'
        } else {
          // Not enough space on either side, position at screen edge
          if (spaceOnRight > spaceOnLeft) {
            x = viewportWidth - tooltipWidth - padding
            side = 'right'
          } else {
            x = padding
            side = 'left'
          }
        }
        
        // Calculate vertical position (centered on target, but ensure it fits)
        let y = rect.top + rect.height / 2
        const halfHeight = tooltipHeight / 2
        
        // Adjust if tooltip would go off top or bottom
        if (y - halfHeight < padding) {
          y = halfHeight + padding
        } else if (y + halfHeight > viewportHeight - padding) {
          y = viewportHeight - halfHeight - padding
        }
        
        setTooltipData({
          id: approvalId,
          type: type,
          x: x,
          y: y,
          side: side
        })
      } catch (error) {
        // Element was removed, silently fail
        return
      }
    }, 100) // Show tooltip after 100ms
  }

  const handleIconMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }
    setTooltipData({ id: null, type: null, x: 0, y: 0, side: 'right' })
  }


  const getDetailsTooltipContent = (approval: any) => {
    // TERMINATE requests should use attributes handler, not HR Management handler
    if ((approval.category === "HR Management" || approval.category === "Approvals - HR Management") && approval.changes && approval.actionType !== 'TERMINATE') {
      const fieldName = approval.fieldName || 'Change'
      const changeValue = approval.changes.current && approval.changes.new
        ? `${approval.changes.current} -> ${approval.changes.new}`
        : approval.changes.amount || 'N/A'
      
      return (
        <div className="flex flex-col p-3">
          <div className="flex flex-col" style={{ marginBottom: '10px' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  {approval.subject}
                </span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
            {approval.employee?.name && (
              <div style={{ marginBottom: '10px' }}>
                <div className="text-xs text-gray-500">Person</div>
                <div className="text-xs text-gray-900 font-medium">{approval.employee.name}</div>
              </div>
            )}
            <div style={{ marginBottom: (approval as any).changeEffectDate || (approval as any).reason ? '10px' : '0' }}>
              <div className="text-xs text-gray-500">{fieldName}</div>
              <div className="text-xs text-gray-900 font-medium">{changeValue}</div>
            </div>
            {(approval as any).changeEffectDate && (
              <div style={{ marginBottom: (approval as any).reason ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Change effect date</div>
                <div className="text-xs text-gray-900 font-medium">{(approval as any).changeEffectDate}</div>
              </div>
            )}
            {(approval as any).reason && (
              <div style={{ marginBottom: '0' }}>
                <div className="text-xs text-gray-500">Reason</div>
                <div className="text-xs text-gray-900 font-medium">{(approval as any).reason}</div>
              </div>
            )}
          </div>
        </div>
      )
    } else if ((approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements") && approval.changes) {
      // Get values from approval, matching request details structure
      const amount = approval.changes?.new || approval.amount || 'N/A'
      const vendor = approval.vendor?.name || 'N/A'
      const purchaser = approval.requestor || 'N/A'
      const purchaseDate = approval.purchaseDate || 'N/A'
      // Use reason from approval if present, otherwise generate based on vendor/category
      const memo = approval.reason || (() => {
        const category = approval.expenseCategory || ''
        if (vendor.toLowerCase().includes('uber') || vendor.toLowerCase().includes('lyft')) {
          return 'Client meeting travel'
        } else if (vendor.toLowerCase().includes('airlines') || vendor.toLowerCase().includes('airline')) {
          return 'Business travel'
        } else if (category.toLowerCase().includes('meals') || category.toLowerCase().includes('entertainment')) {
          return 'Client dinner'
        } else if (category.toLowerCase().includes('conference')) {
          return 'Conference attendance'
        } else if (category.toLowerCase().includes('software')) {
          return 'Software subscription'
        }
        return 'Business expense'
      })()
      
      // Get receipt image path based on vendor (same logic as request details)
      const getReceiptImage = () => {
        const vendorName = (approval.vendor?.name || '').toLowerCase()
        if (vendorName.includes('alaska')) {
          return '/receipts/alaska-airlines.png'
        } else if (vendorName.includes('lyft')) {
          return '/receipts/lyft.png'
        } else if (vendorName.includes('uber')) {
          return '/receipts/uber.png'
        }
        return null
      }
      
      const receiptImage = getReceiptImage()
      
      return (
        <div className="flex flex-row gap-4 p-3">
          {receiptImage && (
            <div className="flex-shrink-0 bg-white flex items-center justify-center" style={{ width: '200px' }}>
              <img 
                src={receiptImage} 
                alt="Receipt" 
                style={{ width: '200px', height: 'auto', objectFit: 'contain' }}
              />
            </div>
          )}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-col" style={{ marginBottom: '10px' }}>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1" style={{ maxWidth: '285px' }}>
                  <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                    {approval.subject}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
              <div style={{ marginBottom: '10px' }}>
                <div className="text-xs text-gray-500">Amount</div>
                <div className="text-xs text-gray-900 font-medium">{amount}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div className="text-xs text-gray-500">Vendor</div>
                <div className="text-xs text-gray-900 font-medium">{vendor}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div className="text-xs text-gray-500">Purchaser</div>
                <div className="text-xs text-gray-900 font-medium">{purchaser}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div className="text-xs text-gray-500">Date</div>
                <div className="text-xs text-gray-900 font-medium">{purchaseDate}</div>
              </div>
              <div style={{ marginBottom: '0' }}>
                <div className="text-xs text-gray-500">Memo</div>
                <div className="text-xs text-gray-900 font-medium">{memo}</div>
              </div>
            </div>
          </div>
        </div>
      )
    } else if ((approval.category === "Time and Attendance" || approval.category === "Approvals - Time and Attendance") && approval.changes) {
      return (
        <div className="flex flex-col p-3">
          <div className="flex flex-col" style={{ marginBottom: '10px' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  {approval.subject}
                </span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
            <div style={{ marginBottom: approval.startTime || approval.endTime || approval.officeLocation ? '10px' : '0' }}>
              <div className="text-xs text-gray-500">Duration</div>
              <div className="text-xs text-gray-900 font-medium">{approval.changes.new}</div>
            </div>
            {approval.startTime && (
              <div style={{ marginBottom: approval.endTime || approval.officeLocation ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Start</div>
                <div className="text-xs text-gray-900 font-medium">{approval.startTime}</div>
              </div>
            )}
            {approval.endTime && (
              <div style={{ marginBottom: approval.officeLocation ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">End</div>
                <div className="text-xs text-gray-900 font-medium">{approval.endTime}</div>
              </div>
            )}
            {approval.officeLocation && (
              <div style={{ marginBottom: '0' }}>
                <div className="text-xs text-gray-500">Location</div>
                <div className="text-xs text-gray-900 font-medium">{approval.officeLocation}</div>
              </div>
            )}
          </div>
        </div>
      )
    } else if (approval.category === "Training") {
      return (
        <div className="flex flex-col p-3">
          <div className="flex flex-col" style={{ marginBottom: '10px' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  {approval.subject}
                </span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
            {approval.courseName && (
              <div style={{ marginBottom: approval.dueDate || approval.estimatedDuration ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Course</div>
                <div className="text-xs text-gray-900 font-medium">{approval.courseName}</div>
              </div>
            )}
            {approval.dueDate && (
              <div style={{ marginBottom: approval.estimatedDuration ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Due Date</div>
                <div className="text-xs text-gray-900 font-medium">{approval.dueDate}</div>
              </div>
            )}
            {approval.estimatedDuration && (
              <div style={{ marginBottom: '0' }}>
                <div className="text-xs text-gray-500">Duration</div>
                <div className="text-xs text-gray-900 font-medium">{approval.estimatedDuration}</div>
              </div>
            )}
          </div>
        </div>
      )
    } else if (approval.category === "Documents") {
      return (
        <div className="flex flex-col p-3">
          <div className="flex flex-col" style={{ marginBottom: '10px' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  {approval.subject}
                </span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
            {approval.documentName && (
              <div style={{ marginBottom: approval.dueDate ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Document</div>
                <div className="text-xs text-gray-900 font-medium">{approval.documentName}</div>
              </div>
            )}
            {approval.dueDate && (
              <div style={{ marginBottom: '0' }}>
                <div className="text-xs text-gray-500">Due Date</div>
                <div className="text-xs text-gray-900 font-medium">{approval.dueDate}</div>
              </div>
            )}
          </div>
        </div>
      )
    } else if (approval.category === "Miscellaneous") {
      return (
        <div className="flex flex-col p-3">
          <div className="flex flex-col" style={{ marginBottom: '10px' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  {approval.subject}
                </span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
            {approval.newHireName && (
              <div style={{ marginBottom: approval.newHireRole || approval.suggestedDate ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">New Hire</div>
                <div className="text-xs text-gray-900 font-medium">{approval.newHireName}</div>
              </div>
            )}
            {approval.newHireRole && (
              <div style={{ marginBottom: approval.suggestedDate ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Role</div>
                <div className="text-xs text-gray-900 font-medium">{approval.newHireRole}</div>
              </div>
            )}
            {approval.suggestedDate && (
              <div style={{ marginBottom: '0' }}>
                <div className="text-xs text-gray-500">Suggested Date</div>
                <div className="text-xs text-gray-900 font-medium">{approval.suggestedDate}</div>
              </div>
            )}
          </div>
        </div>
      )
    } else if (approval.category === "Payroll") {
      return (
        <div className="flex flex-col p-3">
          <div className="flex flex-col" style={{ marginBottom: '10px' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  Filing Information
                </span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
            {approval.entity && (
              <div style={{ marginBottom: approval.filing || approval.agency || approval.accountNumber || approval.dueDate || approval.requestedOn ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Entity</div>
                <div className="text-xs text-gray-900 font-medium">{approval.entity}</div>
              </div>
            )}
            {approval.filing && (
              <div style={{ marginBottom: approval.agency || approval.accountNumber || approval.dueDate || approval.requestedOn ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Filing</div>
                <div className="text-xs text-gray-900 font-medium">{approval.filing}</div>
              </div>
            )}
            {approval.agency && (
              <div style={{ marginBottom: approval.accountNumber || approval.dueDate || approval.requestedOn ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Agency</div>
                <div className="text-xs text-gray-900 font-medium">{approval.agency}</div>
              </div>
            )}
            {approval.accountNumber && (
              <div style={{ marginBottom: approval.dueDate || approval.requestedOn ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Account number</div>
                <div className="text-xs text-gray-900 font-medium">{approval.accountNumber}</div>
              </div>
            )}
            {approval.dueDate && (
              <div style={{ marginBottom: approval.requestedOn ? '10px' : '0' }}>
                <div className="text-xs text-gray-500">Due date</div>
                <div className="text-xs text-gray-900 font-medium">{approval.dueDate}</div>
              </div>
            )}
            {approval.requestedOn && (
              <div style={{ marginBottom: '0' }}>
                <div className="text-xs text-gray-500">Requested on</div>
                <div className="text-xs text-gray-900 font-medium">{approval.requestedOn}</div>
              </div>
            )}
          </div>
        </div>
      )
    } else if (approval.attributes && Object.keys(approval.attributes).length > 0) {
      // Generic handler for approvals with extracted attributes
      const attributes = approval.attributes
      const attributeLabels: Record<string, string> = {
        impactedEmployee: 'Impacted Employee',
        impactedPerson: 'Impacted Person',
        number: 'Number',
        amount: 'Amount',
        recipient: 'Recipient',
        role: 'Role',
        position: 'Position',
        recordName: 'Record Name',
        object: 'Object',
        field: 'Field',
        newValue: 'New Value',
        entity: 'Entity',
        period: 'Period',
        title: 'Title',
        level: 'Level',
        department: 'Department',
        vendor: 'Vendor',
        candidateName: 'Candidate Name',
        requisitionName: 'Requisition Name',
        shift: 'Shift',
        requestedTime: 'Requested Time',
        proposedTime: 'Proposed Time',
        droppedTime: 'Dropped Time',
        tripName: 'Trip Name',
        flightDetails: 'Flight Details',
        details: 'Details',
        payoutAmount: 'Payout Amount',
        payee: 'Payee',
        carrier: 'Carrier',
        impactedEmployees: 'Impacted Employees',
        cost: 'Cost',
        effectiveDate: 'Effective Date',
        loggedTime: 'Logged Time',
        date: 'Date',
        requestedQuantity: 'Requested Quantity',
        typeOfRequest: 'Type of Request',
        startDate: 'Start Date',
        endDate: 'End Date',
        apps: 'Apps',
        reason: 'Reason',
        compensation: 'Compensation',
        memo: 'Memo',
        closedBy: 'Closed by',
        headcountOwner: 'Headcount owner',
        previousEmployee: 'Previous employee',
        numberOfNewHeadcount: 'Number of new headcount',
        annualizedCashImpact: 'Annualized cash impact',
        requestedResource: 'Requested resource',
        application: 'Application',
        jobReqName: 'Job req name',
        employmentType: 'Employment type',
        jobTitle: 'Job title',
        currency: 'Currency',
        transferType: 'Transfer type',
        contractor: 'Contractor',
        contractType: 'Contract type',
        totalContractAmount: 'Total contract amount',
        requestedChange: 'Requested change',
        employee: 'Employee',
        newPurchases: 'New purchases',
        itemCost: 'Item cost',
        payPeriodStartDate: 'Pay period start date',
        payPeriodEndDate: 'Pay period end date',
        takeActionDeadline: 'Take action deadline',
        payRunMemo: 'Pay run memo',
        workLocation: 'Work location',
        jobFamily: 'Job Family',
        changedBy: 'Changed by',
        change: 'Change',
        numberOfChanges: 'Number of changes',
        changeEffectDate: 'Change effect date',
        terminationType: 'Termination type',
        terminationReason: 'Termination reason',
        permissionRequested: 'Permission requested',
        paymentMethod: 'Payment method',
        applicant: 'Applicant',
        jobRequisition: 'Job requisition',
        hiringManager: 'Hiring manager',
        items: 'Items',
        person: 'Person',
        schedule: 'Schedule',
        currentShift: 'Current shift',
        proposedShift: 'Proposed shift',
        startTime: 'Start time',
        endTime: 'End time',
        duration: 'Duration',
        tripDate: 'Trip date',
        selection: 'Selection',
        'Impacted employee': 'Impacted employee',
        'Title': 'Title',
        'Termination type': 'Termination type',
        'Termination reason': 'Termination reason',
        'Start date': 'Start date',
        'End date': 'End date',
        'Channel type': 'Channel type',
        'Proposed members': 'Proposed members',
        'Request note': 'Request note',
        'Channel name': 'Channel name',
        'Groups added': 'Groups added',
        'Groups removed': 'Groups removed',
        'Apps': 'Apps',
        'Reason': 'Reason',
        'Effective date': 'Effective date',
        'Amount': 'Amount',
        'Currency': 'Currency',
        'Transfer type': 'Transfer type',
        'Carrier': 'Carrier',
        'Country': 'Country',
        'Impacted employees': 'Impacted employees',
        'Cost': 'Cost',
        'Contractor': 'Contractor',
        'Contract type': 'Contract type',
        'Department': 'Department',
        'Total contract amount': 'Total contract amount',
        'Impacted contractor': 'Impacted contractor',
        'Change': 'Change',
        'Invoice number': 'Invoice number',
        'Vendor name': 'Vendor name',
        'New purchases': 'New purchases',
        'Item cost': 'Item cost',
        'Effect date': 'Effect date',
        'Compensation': 'Compensation',
        'Level': 'Level',
        'Change effect date': 'Change effect date',
        'Permission requested': 'Permission requested',
        'Payment method': 'Payment method',
        'Memo': 'Memo',
        'Application': 'Application',
        'Job req name': 'Job req name',
        'Employment type': 'Employment type',
        'Job title': 'Job title',
        'Hiring manager': 'Hiring manager',
        'Changed by': 'Changed by',
        'Items': 'Items',
        'Person': 'Person',
        'Schedule': 'Schedule',
        'Current shift': 'Current shift',
        'Proposed shift': 'Proposed shift',
        'Shift': 'Shift',
        'Start time': 'Start time',
        'End time': 'End time',
        'Duration': 'Duration',
        'Details': 'Details',
        'Trip date': 'Trip date',
        'Selection': 'Selection',
        'Period': 'Period',
        'Number of new headcount': 'Number of new headcount',
        'Annualized cash impact': 'Annualized cash impact',
        'Headcount owner': 'Headcount owner',
        'Work location': 'Work location',
        'Job Family': 'Job Family',
        'Previous employee': 'Previous employee',
        'Closed by': 'Closed by',
        'Number of changes': 'Number of changes',
        'Requested resource': 'Requested resource',
        'Employee': 'Employee',
        'Purchaser': 'Purchaser',
        'Purchase date': 'Purchase date',
        'Vendor': 'Vendor',
        'Transformation name': 'Transformation name',
        'Frequency': 'Frequency',
        'Pay period: start date': 'Pay period: start date',
        'Pay period: end date': 'Pay period: end date',
        'Take action deadline': 'Take action deadline',
        'Pay run memo': 'Pay run memo',
        'Location': 'Location',
        'Number of employees': 'Number of employees'
      }
      
      const attributeEntries = Object.entries(attributes).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      
      return (
        <div className="flex flex-col p-3">
          <div className="flex flex-col" style={{ marginBottom: '10px' }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                  {approval.subject}
                </span>
              </div>
            </div>
          </div>
          {attributeEntries.length > 0 && (
            <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
              {attributeEntries.map(([key, value], index) => (
                <div key={key} style={{ marginBottom: index < attributeEntries.length - 1 ? '10px' : '0' }}>
                  <div className="text-xs text-gray-500">{attributeLabels[key] || key}</div>
                  <div className="text-xs text-gray-900 font-medium">{String(value)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  const getCommentsTooltipContent = (approval: any) => {
    if (!('comments' in approval) || !approval.comments || approval.comments.length === 0) return null
    
    const sortedComments = [...approval.comments].sort((a, b) => {
      const timeA = parseInt(a.timestamp || "0")
      const timeB = parseInt(b.timestamp || "0")
      return timeB - timeA
    })
    const mostRecent = sortedComments[0]
    const hasMore = approval.comments.length > 1

    return (
      <div className="flex flex-col p-3">
        <div className="flex flex-col" style={{ marginBottom: '10px' }}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                Most recent comment
              </span>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
          <div style={{ marginBottom: hasMore ? '10px' : '0' }}>
            <div className="text-xs text-gray-500">Author</div>
            <div className="text-xs text-gray-900 font-medium">{mostRecent.author}</div>
          </div>
          <div style={{ marginBottom: hasMore ? '10px' : '0' }}>
            <div className="text-xs text-gray-500">Time</div>
            <div className="text-xs text-gray-900 font-medium">{mostRecent.timestamp}</div>
          </div>
          <div style={{ marginBottom: hasMore ? '10px' : '0' }}>
            <div className="text-xs text-gray-500">Comment</div>
            <div className="text-xs text-gray-900 font-medium">{mostRecent.text}</div>
          </div>
          {hasMore && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenDrawer(approval.id)
              }}
              className="text-xs text-[#106A63] hover:underline font-normal text-left"
              style={{ marginTop: '10px' }}
            >
              See more ({approval.comments.length - 1} more)
            </button>
          )}
        </div>
      </div>
    )
  }

  // Custom List Icon Component (5 horizontal lines)
  const ListIcon = ({ className, style }: { className?: string, style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="15" x2="14" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ backgroundColor: '#F9F7F6' }}>
      <div className="flex-1 relative min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-col overflow-hidden flex-1 min-h-0" style={{ backgroundColor: '#F9F7F6' }}>
          <div className="min-w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Header with bulk selection, search, filter, sort, and view mode - Inside the table frame */}
            <div className={`flex-shrink-0 ${viewMode !== undefined ? 'pb-4' : 'pb-2'}`}>
              {/* Single row: Bulk Selection on left, Search, Filter, Sort, and View Mode on right */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {viewMode === undefined && (
                    <h2 className="text-base font-normal text-gray-900 mr-3">Needs my review</h2>
                  )}
                  {page !== "inbox" && viewMode === "full-width" && !selectedItem && externalSearchQuery === undefined && (
                    <div className={`relative ${page === "reimbursements" ? "w-[280px]" : "w-[339px]"}`}>
                      <Search className="absolute left-[10px] top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search..." 
                        className="w-full pl-[30px] pr-9 h-[40px] text-sm rounded-[8px]" 
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                          onClick={() => handleSearchChange("")}
                        >
                          <X className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                      )}
                    </div>
                  )}
                  {viewMode === "full-width" && selectedItem ? (
                    // Show back button when viewing details in full-width mode
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (onSelectItem) {
                          onSelectItem(null)
                        }
                      }}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  ) : viewMode === "full-width" ? (
                    // Show search bar when showing grid in full-width mode
                    <>
                      {page === "reimbursements" && (
                        <div className="relative" ref={pendingDropdownRef}>
                          <button
                            onClick={() => {
                              if (activeTab === "pending") {
                                setIsPendingDropdownOpen(!isPendingDropdownOpen)
                              } else {
                                onTabChange?.("pending")
                              }
                            }}
                            className={`h-[40px] px-4 border border-input bg-background rounded-[8px] flex items-center gap-2 mr-2 ${
                              activeTab === "pending"
                                ? "border-[#000000]"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <span className={`text-sm transition-colors ${
                              activeTab === "pending"
                                ? "text-[#000000] font-normal"
                                : "text-gray-600"
                            }`}>
                              Needs my review
                            </span>
                            {activeTab === "pending" && (
                              <ChevronDown className={`h-4 w-4 transition-transform ${isPendingDropdownOpen ? 'rotate-180' : ''}`} />
                            )}
                          </button>
                          {isPendingDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[200px]">
                              <button
                                onClick={() => {
                                  onTabChange?.("pending")
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
                                  onTabChange?.("snoozed")
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
                                  onTabChange?.("reviewed")
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
                                  onTabChange?.("created")
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
                                  onTabChange?.("all")
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
                      )}
                      <div className={`relative ${page === "reimbursements" ? "w-[280px]" : "w-[339px]"}`}>
                      <Search className="absolute left-[10px] top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search..." 
                        className="w-full pl-[30px] pr-9 h-[40px] text-sm rounded-[8px]" 
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-gray-100"
                          onClick={() => handleSearchChange("")}
                        >
                          <X className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                      )}
                    </div>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 justify-end">
                  {page !== "inbox" && page !== "reimbursements" && page !== "approvals" && (
                    <div className="relative" ref={requestTypeDropdownRef}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRequestTypeDropdownOpen(!isRequestTypeDropdownOpen)}
                        className="h-[40px] text-sm gap-2 px-3 rounded-[8px]"
                      >
                        <Filter className="h-4 w-4" />
                        <span className="text-sm">{getDisplayCategory(selectedRequestType)}</span>
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    {isRequestTypeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[200px]">
                      {(page === "tasks" || page === "inbox" || page === "approvals") ? (
                        <>
                          <button
                            onClick={() => {
                              handleCategoryChange("All")
                              setIsRequestTypeDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                              selectedRequestType === "All" ? 'bg-gray-50 font-normal' : ''
                            }`}
                          >
                            All
                          </button>
                          {requestTypes.filter(type => type !== "All" && type !== "HR Management" && type !== "Reimbursements" && type !== "Time and Attendance").map((type) => (
                            type === "Approvals" ? (
                              <div key={type}>
                                <button
                                  onClick={() => {
                                    handleCategoryChange(type)
                                    setIsRequestTypeDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-normal ${
                                    selectedRequestType === type ? 'bg-gray-50' : ''
                                  }`}
                                >
                                  {type}
                                </button>
                                <div className="pl-4">
                                  <button
                                    onClick={() => {
                                      handleCategoryChange("HR Management")
                                      setIsRequestTypeDropdownOpen(false)
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                      selectedRequestType === "HR Management" ? 'bg-gray-50 font-normal' : ''
                                    }`}
                                  >
                                    HR Management
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleCategoryChange("Reimbursements")
                                      setIsRequestTypeDropdownOpen(false)
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                      selectedRequestType === "Reimbursements" ? 'bg-gray-50 font-normal' : ''
                                    }`}
                                  >
                                    Reimbursements
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleCategoryChange("Time and Attendance")
                                      setIsRequestTypeDropdownOpen(false)
                                    }}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                      selectedRequestType === "Time and Attendance" ? 'bg-gray-50 font-normal' : ''
                                    }`}
                                  >
                                    Time and Attendance
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                key={type}
                                onClick={() => {
                                  handleCategoryChange(type)
                                  setIsRequestTypeDropdownOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                  selectedRequestType === type ? 'bg-gray-50 font-normal' : ''
                                }`}
                              >
                                {type}
                              </button>
                            )
                          ))}
                        </>
                      ) : (
                        requestTypes.map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setSelectedRequestType(type)
                              setIsRequestTypeDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                              selectedRequestType === type ? 'bg-gray-50 font-normal' : ''
                            }`}
                          >
                            {type}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  </div>
                  )}
                  {page !== "inbox" && page !== "reimbursements" && page !== "approvals" && (
                    <div className="relative" ref={sortDropdownRef}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                        className="h-[40px] text-sm gap-2 px-3 rounded-[8px]"
                      >
                        Sort: {sortBy === "recency" || (typeof sortBy === "object" && sortBy.column === "requestedOn" && sortBy.direction === "asc") ? "Recency" : "Due Date"}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                      {isSortDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[200px]">
                          <button
                            onClick={() => {
                              if (onSortChange) {
                                if (typeof sortBy === "object") {
                                  onSortChange({ column: "requestedOn", direction: "asc" })
                                } else {
                                  onSortChange("recency")
                                }
                              }
                              setIsSortDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                              sortBy === "recency" || (typeof sortBy === "object" && sortBy.column === "requestedOn") ? 'bg-gray-50 font-normal' : ''
                            }`}
                          >
                            Recency
                          </button>
                          <button
                            onClick={() => {
                              if (onSortChange) {
                                if (typeof sortBy === "object") {
                                  onSortChange({ column: "dueDate", direction: "asc" })
                                } else {
                                  onSortChange("dueDate")
                                }
                              }
                              setIsSortDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                              sortBy === "dueDate" || (typeof sortBy === "object" && sortBy.column === "dueDate") ? 'bg-gray-50 font-normal' : ''
                            }`}
                          >
                            Due Date
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="relative" ref={groupByDropdownRef}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsGroupByDropdownOpen(!isGroupByDropdownOpen)}
                      className="h-[40px] text-sm gap-2 px-3 rounded-[8px]"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    {isGroupByDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[200px]">
                        <div className="p-2">
                          <div className="text-xs font-medium text-gray-700 px-2 py-1.5 mb-1">Group by</div>
                          <button
                            onClick={() => {
                              handleGroupByChange("none")
                              setIsGroupByDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                          >
                            None
                          </button>
                          <button
                            onClick={() => {
                              handleGroupByChange("requestor")
                              setIsGroupByDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                          >
                            Requestor
                          </button>
                          <button
                            onClick={() => {
                              handleGroupByChange("type")
                              setIsGroupByDropdownOpen(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                          >
                            Type
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {viewMode !== "split" && (
                    <div className="relative" ref={filterDropdownRef}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                        className="h-[40px] text-sm gap-2 px-3 rounded-[8px]"
                        >
                        <Filter className="h-4 w-4" />
                        {activeFilters.length > 0 && (
                          <span 
                            className="flex flex-row justify-center items-center rounded-full"
                            style={{
                              padding: '0px 8px',
                              gap: '4px',
                              position: 'relative',
                              width: '23px',
                              height: '16px',
                              background: '#F0D0F5',
                              borderRadius: '9999px',
                              color: '#4A0039',
                              fontSize: '12px'
                            }}
                          >
                            {activeFilters.length}
                          </span>
                        )}
                      </Button>
                      {isFilterDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[280px] max-h-[400px] overflow-y-auto">
                        <div className="p-2">
                          {filterStep === "field" && (
                            <>
                              <div className="text-xs font-medium text-gray-700 px-2 py-1.5 mb-1">Filter by</div>
                              <button
                                onClick={() => {
                                  setCurrentFilterField("requestor")
                                  setFilterStep("operator")
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                              >
                                Requested by
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentFilterField("taskType")
                                  setFilterStep("operator")
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                              >
                                Task type
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentFilterField("requestedOn")
                                  setFilterStep("operator")
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                              >
                                Requested on
                              </button>
                              {activeTab === "reviewed" && (
                                <button
                                  onClick={() => {
                                    setCurrentFilterField("reviewStatus")
                                    setFilterStep("operator")
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                                >
                                  Review status
                                </button>
                              )}
                            </>
                          )}
                          {filterStep === "operator" && (
                            <>
                              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                                <button
                                  onClick={() => {
                                    setFilterStep("field")
                                    setCurrentFilterField(null)
                                  }}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  ← Back
                                </button>
                                <div className="text-xs font-medium text-gray-700">
                                  {currentFilterField === "requestor" ? "Requested by" :
                                   currentFilterField === "taskType" ? "Task type" :
                                   currentFilterField === "requestedOn" ? "Requested on" :
                                   currentFilterField === "reviewStatus" ? "Review status" : ""}
                                </div>
                              </div>
                              {(() => {
                                const isDateField = currentFilterField === "requestedOn"
                                const operators = isDateField 
                                  ? [
                                      { value: "before", label: "Before" },
                                      { value: "after", label: "After" },
                                      { value: "equals", label: "On" }
                                    ]
                                  : [
                                      { value: "equals", label: "Is" },
                                      { value: "isNot", label: "Is not" },
                                      { value: "contains", label: "Contains" }
                                    ]
                                return operators.map(op => (
                                  <button
                                    key={op.value}
                                    onClick={() => {
                                      setCurrentFilterOperator(op.value)
                                      setFilterStep("value")
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                                  >
                                    {op.label}
                                  </button>
                                ))
                              })()}
                            </>
                          )}
                          {filterStep === "value" && (
                            <>
                              <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                                <button
                                  onClick={() => {
                                    setFilterStep("operator")
                                    setCurrentFilterOperator(null)
                                  }}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  ← Back
                                </button>
                                <div className="text-xs font-medium text-gray-700">
                                  {currentFilterField === "status" ? "Status" :
                                   currentFilterField === "requestor" ? "Requested by" :
                                   currentFilterField === "taskType" ? "Task type" :
                                   currentFilterField === "category" ? "Category" :
                                   currentFilterField === "requestedOn" ? "Requested on" :
                                   currentFilterField === "reviewStatus" ? "Review status" : ""} {currentFilterOperator === "equals" ? "is" : currentFilterOperator === "isNot" ? "is not" : currentFilterOperator === "contains" ? "contains" : currentFilterOperator === "before" ? "before" : currentFilterOperator === "after" ? "after" : ""}
                                </div>
                              </div>
                              {currentFilterField === "requestedOn" ? (
                                <div className="px-3 py-2">
                                  <input
                                    type="date"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        const newFilter: Filter = {
                                          id: `filter-${Date.now()}`,
                                          field: currentFilterField!,
                                          operator: currentFilterOperator as any,
                                          value: e.target.value
                                        }
                                        setActiveFilters([...activeFilters, newFilter])
                                        setIsFilterDropdownOpen(false)
                                        setFilterStep("field")
                                        setCurrentFilterField(null)
                                        setCurrentFilterOperator(null)
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                (() => {
                                  const values = new Set<string>()
                                  approvals.forEach(approval => {
                                    switch (currentFilterField) {
                                      case "status":
                                        if ((approval as any).itemStatus) values.add((approval as any).itemStatus)
                                        if ((approval as any).reviewStatus) values.add((approval as any).reviewStatus)
                                        break
                                      case "requestor":
                                        values.add(approval.requestor)
                                        break
                                      case "taskType":
                                      case "category":
                                        values.add(approval.category)
                                        break
                                      case "reviewStatus":
                                        if ((approval as any).reviewStatus) values.add((approval as any).reviewStatus)
                                        break
                                    }
                                  })
                                  return Array.from(values).sort().map(value => (
                                    <button
                                      key={value}
                                      onClick={() => {
                                        const newFilter: Filter = {
                                          id: `filter-${Date.now()}`,
                                          field: currentFilterField!,
                                          operator: currentFilterOperator as any,
                                          value: value
                                        }
                                        setActiveFilters([...activeFilters, newFilter])
                                        setIsFilterDropdownOpen(false)
                                        setFilterStep("field")
                                        setCurrentFilterField(null)
                                        setCurrentFilterOperator(null)
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                                    >
                                      {value}
                                    </button>
                                  ))
                                })()
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {viewMode !== undefined && onViewModeChange && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentMode = viewMode as "full-width" | "split"
                          onViewModeChange(currentMode === "full-width" ? "split" : "full-width")
                        }}
                        className="h-[40px] px-4 gap-2 rounded-[8px]"
                        title={viewMode === "full-width" ? "Switch to split screen" : "Switch to full-width"}
                      >
                        {viewMode === "full-width" ? (
                          <PanelLeft className="h-4 w-4" />
                        ) : (
                          <Menu className="h-4 w-4" />
                        )}
                        <span className="text-sm">
                          {viewMode === "full-width" ? "Split" : "No split"}
                        </span>
                      </Button>
                    )}
                    {(page === "inbox" || page === "reimbursements" || page === "approvals") && (viewMode === "split" || viewMode === "full-width") && (
                      <>
                        <div className="h-8 w-px bg-gray-300 mx-3"></div>
                      </>
                    )}
                    {(page === "inbox" || page === "reimbursements" || page === "approvals") && (viewMode === "split" || viewMode === "full-width") && (
                      <>
                        {/* Saved Views Dropdown */}
                        {viewsDropdownRef && onToggleViewsDropdown && getCurrentViewName && onSwitchView && (
                          <div className="relative" ref={viewsDropdownRef}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onToggleViewsDropdown(!isViewsDropdownOpen)}
                              className="h-[40px] px-3 gap-2 rounded-[8px]"
                            >
                              <span className="text-sm">Viewing: {getCurrentViewName()}</span>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            {isViewsDropdownOpen && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[200px]">
                                <button
                                  onClick={() => onSwitchView("default")}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                    currentViewId === "default" ? 'bg-gray-50 font-normal' : ''
                                  }`}
                                >
                                  <div className="font-normal">Default</div>
                                </button>
                                {savedViews.map((view) => (
                                  <button
                                    key={view.id}
                                    onClick={() => onSwitchView(view.id)}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                      currentViewId === view.id ? 'bg-gray-50 font-normal' : ''
                                    }`}
                                  >
                                    <div className="font-normal">{view.name}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {new Date(view.lastModified).toLocaleDateString()}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {/* More Actions Button */}
                        {moreActionsRef && onToggleMoreActions && hasUnsavedChanges && onSaveView && onSaveAsNewView && onDiscardChanges && onRemoveView && (
                          <div className="relative" ref={moreActionsRef}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onToggleMoreActions(!isMoreActionsOpen)}
                              className="h-[40px] w-[40px] p-0 relative rounded-[8px]"
                              title="View actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                              {hasUnsavedChanges() && (
                                <span className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white" style={{ background: '#7A005D' }}></span>
                              )}
                            </Button>
                            {isMoreActionsOpen && (
                              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[180px]">
                                <button
                                  onClick={() => {
                                    onToggleMoreActions(false)
                                    onSaveView()
                                  }}
                                  disabled={currentViewId === "default" || !hasUnsavedChanges()}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                    (currentViewId === "default" || !hasUnsavedChanges()) ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    onToggleMoreActions(false)
                                    onSaveAsNewView()
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                >
                                  Save as new
                                </button>
                                <button
                                  onClick={() => {
                                    onToggleMoreActions(false)
                                    onDiscardChanges()
                                  }}
                                  disabled={!hasUnsavedChanges()}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                    !hasUnsavedChanges() ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  Discard changes
                                </button>
                                <button
                                  onClick={() => {
                                    onToggleMoreActions(false)
                                    if (currentViewId !== "default") {
                                      onRemoveView()
                                    }
                                  }}
                                  disabled={currentViewId === "default"}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-red-600 ${
                                    currentViewId === "default" ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                    {onExpand && page !== "inbox" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onExpand}
                        className="h-[40px] w-[40px] p-0 rounded-[8px]"
                        title={isExpanded ? "Collapse" : "Expand to full screen"}
                      >
                        {isExpanded ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Active Filters Row */}
            {activeFilters.length > 0 && (
              <div className="flex-shrink-0 pb-3">
                <div className="flex flex-wrap gap-2 pr-6">
                  {activeFilters.map((filter) => {
                    const getFilterLabel = (field: string) => {
                      switch (field) {
                        case "requestor": return "Requested by"
                        case "taskType": return "Task type"
                        case "reviewStatus": return "Review status"
                        default: return field
                      }
                    }
                    
                    const getFilterValueDisplay = (filter: Filter) => {
                      if (!filter.value || (Array.isArray(filter.value) && filter.value.length === 0)) {
                        return "Select value..."
                      }
                      if (Array.isArray(filter.value)) {
                        return filter.value.join(", ")
                      }
                      if (filter.value instanceof Date) {
                        return filter.value.toLocaleDateString()
                      }
                      return String(filter.value)
                    }
                    
                    const getOperatorLabel = (operator: string) => {
                      switch (operator) {
                        case "equals": return "is"
                        case "isNot": return "is not"
                        case "contains": return "contains"
                        case "before": return "before"
                        case "after": return "after"
                        default: return operator
                      }
                    }
                    
                    // Get unique values for this filter field (use all approvals, not filtered)
                    const getUniqueValues = (field: string) => {
                      const values = new Set<string>()
                      approvals.forEach(approval => {
                        switch (field) {
                          case "requestor":
                            values.add(approval.requestor)
                            break
                          case "taskType":
                            values.add(approval.category)
                            break
                          case "reviewStatus":
                            if ((approval as any).reviewStatus) values.add((approval as any).reviewStatus)
                            break
                        }
                      })
                      return Array.from(values).sort()
                    }
                    
                    const operatorLabel = getOperatorLabel(filter.operator)
                    const valueDisplay = getFilterValueDisplay(filter)
                    
                    return (
                      <div 
                        key={filter.id} 
                        className="relative inline-flex flex-col"
                      >
                        <div className="text-xs font-normal mb-1" style={{ color: '#6B6B6B', fontFamily: 'Basel Grotesk' }}>
                          {getFilterLabel(filter.field)}
                        </div>
                        <div className="inline-flex items-center bg-white border border-border rounded-[6px]" style={{ height: '24px' }}>
                          <div className="px-2 flex items-center">
                            <span className="text-sm font-normal text-gray-900" style={{ fontFamily: 'Basel Grotesk', fontSize: '14px', fontWeight: 400 }}>
                              {valueDisplay}
                            </span>
                          </div>
                          <div className="h-4 w-px bg-gray-300"></div>
                          <button
                            onClick={() => {
                              setActiveFilters(activeFilters.filter(f => f.id !== filter.id))
                            }}
                            className="px-2 h-full flex items-center text-gray-900 hover:text-gray-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {/* Table Header */}
            <div className={`grid ${(() => {
              // For reimbursements Opt. 1, use a comprehensive grid template that includes all possible columns
              // This ensures all columns fit, and we'll make it horizontally scrollable if needed
              if (viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt1" && activeGroupBy === "none") {
                // Use fixed max widths to prevent columns from growing: Checkbox + Requested on + Requested by + Vendor + Amount + Purchase Date + Category + Due date + Attributes + Actions
                // Increased widths for requested on, requested by, vendor, amount, purchase date, category
                return 'grid-cols-[40px_minmax(50px,120px)_minmax(80px,160px)_minmax(50px,120px)_minmax(45px,100px)_minmax(60px,130px)_minmax(80px,150px)_minmax(80px,120px)_80px_140px]'
              }
              // For reimbursements Opt. 2, use a specific grid template that includes purchase date (without task type)
              if (viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt2" && activeGroupBy === "none" && activeTab !== "reviewed" && activeTab !== "snoozed" && activeTab !== "created" && activeTab !== "all") {
                // Standard reimbursements grid with purchase date: Checkbox + Requested on + Requested by + Details (reduced) + Purchase Date (same width as Requested on) + Due date + Attributes + Actions
                return 'grid-cols-[40px_minmax(80px,130px)_minmax(120px,180px)_minmax(180px,1fr)_minmax(80px,130px)_minmax(80px,120px)_100px_140px]'
              }
              let baseCols = getGridCols(activeGroupBy !== "none" ? activeGroupBy : "none", viewMode, activeTab)
              if (viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt2") {
                // Remove task type column (100px) - it appears after Requested by and before Details
                // Pattern: ...minmax(120px,180px)_100px_minmax(300px,1fr)...
                baseCols = baseCols.replace('minmax(120px,180px)_100px_minmax(300px,1fr)', 'minmax(120px,180px)_minmax(300px,1fr)')
                baseCols = baseCols.replace('minmax(80px,130px)_100px_minmax(300px,1fr)', 'minmax(80px,130px)_minmax(300px,1fr)')
                // Add purchase date column: insert minmax(80px,130px) (same width as Requested on) between Details and Due date, and reduce Details width
                if (baseCols.includes('minmax(300px,1fr)_minmax(80px,120px)')) {
                  baseCols = baseCols.replace('minmax(300px,1fr)_minmax(80px,120px)', 'minmax(180px,1fr)_minmax(80px,130px)_minmax(80px,120px)')
                } else {
                  // Fallback: insert after Details and reduce Details width
                  const detailsIndex = baseCols.indexOf('minmax(300px,1fr)')
                  if (detailsIndex !== -1) {
                    const afterDetails = baseCols.substring(detailsIndex + 'minmax(300px,1fr)'.length)
                    const nextUnderscore = afterDetails.indexOf('_')
                    if (nextUnderscore !== -1) {
                      const nextCol = afterDetails.substring(0, nextUnderscore + 1)
                      baseCols = baseCols.replace(`minmax(300px,1fr)${nextCol}`, `minmax(180px,1fr)_minmax(80px,130px)${nextCol}`)
                    }
                  }
                }
              }
              return baseCols
            })()} gap-4 pr-6 bg-white border-b border-border flex-shrink-0 ${viewMode === undefined ? 'border-t border-l border-r border-gray-200 rounded-t-[16px]' : viewMode !== undefined ? 'border-t border-l border-r border-gray-200 rounded-t-[16px]' : ''}`} style={{ height: '40px' }}>
              {viewMode === "full-width" ? (
                <div className="flex items-center justify-center">
                  <PebbleCheckbox
                    id="select-all-grid-header"
                    checked={isAllSelected}
                    indeterminate={isSomeSelected && !isAllSelected}
                    disabled={activeTab === "reviewed" || activeTab === "created" || activeTab === "all"}
                    onChange={() => {
                      handleSelectAllClick()
                    }}
                    appearance="list"
                  />
                </div>
              ) : (
                <div></div>
              )}
              {activeGroupBy === "requestor" ? (
                <>
                  {activeTab !== "created" && (
                    <button
                      onClick={() => {
                        if (onSortChange && page === "inbox") {
                          const currentSort = typeof sortBy === "object" ? sortBy : { column: "requestedOn" as const, direction: "asc" as const }
                          onSortChange({
                            column: "requestedBy",
                            direction: currentSort.column === "requestedBy" && currentSort.direction === "asc" ? "desc" : "asc"
                          })
                        }
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                    >
                      Requested by
                      {page === "inbox" && typeof sortBy === "object" && sortBy.column === "requestedBy" && (
                        sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  {activeTab === "reviewed" && (
                    <button
                      onClick={() => {
                        if (onSortChange && page === "inbox") {
                          const currentSort = typeof sortBy === "object" ? sortBy : { column: "reviewedOn" as const, direction: "desc" as const }
                          onSortChange({
                            column: "reviewedOn",
                            direction: currentSort.column === "reviewedOn" && currentSort.direction === "desc" ? "asc" : "desc"
                          })
                        }
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                    >
                      Reviewed on
                      {page === "inbox" && typeof sortBy === "object" && sortBy.column === "reviewedOn" && (
                        sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onSortChange && page === "inbox") {
                        const currentSort = typeof sortBy === "object" ? sortBy : { column: "requestedOn" as const, direction: "asc" as const }
                        onSortChange({
                          column: "requestedOn",
                          direction: currentSort.column === "requestedOn" && currentSort.direction === "asc" ? "desc" : "asc"
                        })
                      }
                    }}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                  >
                    Requested on
                    {page === "inbox" && typeof sortBy === "object" && sortBy.column === "requestedOn" && (
                      sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </button>
                </>
              ) : groupBy === "type" ? (
                <>
                  {activeTab === "reviewed" && (
                    <button
                      onClick={() => {
                        if (onSortChange && page === "inbox") {
                          const currentSort = typeof sortBy === "object" ? sortBy : { column: "reviewedOn" as const, direction: "desc" as const }
                          onSortChange({
                            column: "reviewedOn",
                            direction: currentSort.column === "reviewedOn" && currentSort.direction === "desc" ? "asc" : "desc"
                          })
                        }
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                    >
                      Reviewed on
                      {page === "inbox" && typeof sortBy === "object" && sortBy.column === "reviewedOn" && (
                        sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onSortChange && page === "inbox") {
                        const currentSort = typeof sortBy === "object" ? sortBy : { column: "requestedOn" as const, direction: "asc" as const }
                        onSortChange({
                          column: "requestedOn",
                          direction: currentSort.column === "requestedOn" && currentSort.direction === "asc" ? "desc" : "asc"
                        })
                      }
                    }}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                  >
                    Requested on
                    {page === "inbox" && typeof sortBy === "object" && sortBy.column === "requestedOn" && (
                      sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </button>
                  {activeTab !== "created" && (
                    <button
                      onClick={() => {
                        if (onSortChange && page === "inbox") {
                          const currentSort = typeof sortBy === "object" ? sortBy : { column: "requestedOn" as const, direction: "asc" as const }
                          onSortChange({
                            column: "requestedBy",
                            direction: currentSort.column === "requestedBy" && currentSort.direction === "asc" ? "desc" : "asc"
                          })
                        }
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                    >
                      Requested by
                      {page === "inbox" && typeof sortBy === "object" && sortBy.column === "requestedBy" && (
                        sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </>
              ) : (
                <>
                  {activeTab === "reviewed" && (
                    <button
                      onClick={() => {
                        if (onSortChange && page === "inbox") {
                          const currentSort = typeof sortBy === "object" ? sortBy : { column: "reviewedOn" as const, direction: "desc" as const }
                          onSortChange({
                            column: "reviewedOn",
                            direction: currentSort.column === "reviewedOn" && currentSort.direction === "desc" ? "asc" : "desc"
                          })
                        }
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                    >
                      Reviewed on
                      {page === "inbox" && typeof sortBy === "object" && sortBy.column === "reviewedOn" && (
                        sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (onSortChange && page === "inbox") {
                        const currentSort = typeof sortBy === "object" ? sortBy : { column: "requestedOn" as const, direction: "asc" as const }
                        onSortChange({
                          column: "requestedOn",
                          direction: currentSort.column === "requestedOn" && currentSort.direction === "asc" ? "desc" : "asc"
                        })
                      }
                    }}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                  >
                    Requested on
                    {page === "inbox" && typeof sortBy === "object" && sortBy.column === "requestedOn" && (
                      sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </button>
                  {activeTab !== "created" && (
                    <button
                      onClick={() => {
                        if (onSortChange && page === "inbox") {
                          const currentSort = typeof sortBy === "object" ? sortBy : { column: "requestedOn" as const, direction: "asc" as const }
                          onSortChange({
                            column: "requestedBy",
                            direction: currentSort.column === "requestedBy" && currentSort.direction === "asc" ? "desc" : "asc"
                          })
                        }
                      }}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                      style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                    >
                      Requested by
                      {page === "inbox" && typeof sortBy === "object" && sortBy.column === "requestedBy" && (
                        sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                </>
              )}
              {viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt1" ? (
                <>
                  {/* Opt. 1 columns: Vendor, Amount, Purchase Date, Category */}
                  <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Vendor</div>
                  <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Amount</div>
                  <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Purchase Date</div>
                  <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Category</div>
                </>
              ) : (
                <>
              {!(page === "reimbursements" && reimbursementOption === "opt2") && (
                <button
                  onClick={() => {
                    if (onSortChange && page === "inbox") {
                      const currentSort = typeof sortBy === "object" ? sortBy : { column: "requestedOn" as const, direction: "asc" as const }
                      onSortChange({
                        column: "taskType",
                        direction: currentSort.column === "taskType" && currentSort.direction === "asc" ? "desc" : "asc"
                      })
                    }
                  }}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                >
                  Task type
                  {page === "inbox" && typeof sortBy === "object" && sortBy.column === "taskType" && (
                    sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </button>
              )}
              <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Details</div>
                </>
              )}
              {viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt2" && (
                <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Purchase Date</div>
              )}
              {viewMode === "full-width" && activeTab === "snoozed" && (
                <button
                  onClick={() => {
                    if (onSortChange && page === "inbox") {
                      const currentSort = typeof sortBy === "object" ? sortBy : { column: "snoozedUntil" as const, direction: "asc" as const }
                      onSortChange({
                        column: "snoozedUntil",
                        direction: currentSort.column === "snoozedUntil" && currentSort.direction === "asc" ? "desc" : "asc"
                      })
                    }
                  }}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                >
                  Snoozed until
                  {page === "inbox" && typeof sortBy === "object" && sortBy.column === "snoozedUntil" && (
                    sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </button>
              )}
              {viewMode === "full-width" && activeTab === "reviewed" && (
                <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Status</div>
              )}
              {viewMode === "full-width" && activeTab !== "reviewed" && activeTab !== "snoozed" && (
                <button
                  onClick={() => {
                    if (onSortChange && page === "inbox") {
                      const currentSort = typeof sortBy === "object" ? sortBy : { column: "requestedOn" as const, direction: "asc" as const }
                      onSortChange({
                        column: "dueDate",
                        direction: currentSort.column === "dueDate" && currentSort.direction === "asc" ? "desc" : "asc"
                      })
                    }
                  }}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}
                >
                  Due date
                  {page === "inbox" && typeof sortBy === "object" && sortBy.column === "dueDate" && (
                    sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  )}
                </button>
              )}
              {viewMode === "full-width" && (activeTab === "all" || activeTab === "created") && (
                <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Status</div>
              )}
              <div className="flex items-center" style={{ fontWeight: 400, fontSize: '14px', lineHeight: '17px', fontFamily: '"Basel Grotesk"', letterSpacing: '0px', textAlign: 'left', color: 'rgb(75 85 99 / var(--tw-text-opacity, 1))' }}>Attributes</div>
              {viewMode === "full-width" && activeTab !== "created" && activeTab !== "all" && (
                <div className="text-sm text-muted-foreground font-normal flex justify-end"></div>
              )}
              {viewMode !== "full-width" && (
                <div className="text-sm text-muted-foreground font-normal flex justify-end"></div>
              )}
            </div>

            {/* Table Rows - Scrollable container */}
            <div className={`flex-1 min-h-0 overflow-y-auto ${viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt1" ? 'overflow-x-auto' : ''} bg-white ${viewMode === undefined ? 'border-l border-r border-b border-gray-200 rounded-b-[16px]' : viewMode !== undefined ? 'border-l border-r border-b border-gray-200 rounded-b-[16px]' : ''}`}>
              <div className="divide-y divide-border">
              {sortedApprovals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎉</div>
                    <h3 className="text-lg font-normal text-gray-900 mb-2">You&apos;re all caught up!</h3>
                    <p className="text-sm text-gray-600">All tasks have been processed.</p>
                  </div>
                </div>
              ) : (
                (() => {
                  // Find the last approval item (not group) for border-bottom
                  let lastApprovalIndex = -1
                  for (let i = groupedApprovals.length - 1; i >= 0; i--) {
                    if (groupedApprovals[i].type === 'approval') {
                      lastApprovalIndex = i
                      break
                    }
                  }
                  return groupedApprovals.map((item, index) => {
                  if (item.type === 'group') {
                    const groupApprovalIds = item.approvals.map(a => a.id)
                    const allGroupSelected = groupApprovalIds.length > 0 && groupApprovalIds.every(id => selectedItems.has(id))
                    const someGroupSelected = groupApprovalIds.some(id => selectedItems.has(id))
                    const groupHasPinned = groupApprovalIds.some(id => pinnedItems.has(id))
                    const groupHoverKey = `group-${item.key}`
                    const isGroupHovered = hoveredItem === groupHoverKey
                    
                    // Determine if group has any Training/Documents/Miscellaneous items
                    const hasSpecialCategory = item.approvals.some(a => 
                      a.category === "Training" || a.category === "Documents" || a.category === "Miscellaneous" || a.category === "Payroll"
                    )
                    
                    return (
                      <div
                        key={`group-${item.key}`}
                      className={`grid ${(() => {
                          // For reimbursements Opt. 1, use a flexible grid template that fills available width
                          if (viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt1" && activeGroupBy === "none") {
                            // Use fixed max widths to prevent columns from growing - same as header to ensure column alignment
                            // Increased widths for requested on, requested by, vendor, amount, purchase date, category
                            return 'grid-cols-[40px_minmax(50px,120px)_minmax(80px,160px)_minmax(50px,120px)_minmax(45px,100px)_minmax(60px,130px)_minmax(80px,150px)_minmax(80px,120px)_80px_140px]'
                          }
                          let baseCols = getGridCols(activeGroupBy !== "none" ? activeGroupBy : "none", viewMode, activeTab)
                          if (viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt2") {
                            // Remove task type column (100px) - it appears after Requested by and before Details
                            // Pattern: ...minmax(120px,180px)_100px_minmax(300px,1fr)...
                            baseCols = baseCols.replace('minmax(120px,180px)_100px_minmax(300px,1fr)', 'minmax(120px,180px)_minmax(300px,1fr)')
                            baseCols = baseCols.replace('minmax(80px,130px)_100px_minmax(300px,1fr)', 'minmax(80px,130px)_minmax(300px,1fr)')
                            // Add purchase date column: insert minmax(80px,130px) (same width as Requested on) between Details and Due date
                            if (baseCols.includes('minmax(300px,1fr)_minmax(80px,120px)')) {
                              baseCols = baseCols.replace('minmax(300px,1fr)_minmax(80px,120px)', 'minmax(300px,1fr)_minmax(80px,130px)_minmax(80px,120px)')
                            } else {
                              // Fallback: try to insert after Details (minmax(300px,1fr)) and before next column
                              const detailsIndex = baseCols.indexOf('minmax(300px,1fr)')
                              if (detailsIndex !== -1) {
                                const afterDetails = baseCols.substring(detailsIndex + 'minmax(300px,1fr)'.length)
                                const nextUnderscore = afterDetails.indexOf('_')
                                if (nextUnderscore !== -1) {
                                  const nextCol = afterDetails.substring(0, nextUnderscore + 1)
                                  baseCols = baseCols.replace(`minmax(300px,1fr)${nextCol}`, `minmax(300px,1fr)_minmax(80px,130px)${nextCol}`)
                                }
                              }
                            }
                          }
                          return baseCols
                        })()} gap-4 pr-6 transition-colors cursor-pointer border-b border-gray-200`}
                        style={{ height: '48px', backgroundColor: (isGroupHovered && activeTab !== "reviewed") ? '#E5E5E5' : '#F9FAFB' }}
                        onClick={(e) => {
                          // Only toggle if clicking on the row itself, not on actions
                          if ((e.target as HTMLElement).closest('button, input')) {
                            return
                          }
                          toggleGroup(item.key)
                        }}
                        onMouseEnter={() => setHoveredItem(groupHoverKey)}
                        onMouseLeave={() => {
                          if (hoveredItem === groupHoverKey) {
                            setHoveredItem(null)
                          }
                        }}
                      >
                        {/* Expand/Collapse Chevron */}
                        <div className="flex items-center">
                          <ChevronRight className={`h-4 w-4 text-gray-600 transition-transform flex-shrink-0 ${collapsedGroups.has(item.key) ? '' : 'rotate-90'}`} />
                        </div>
                        {activeGroupBy === "requestor" ? (
                          <>
                            <div className="flex items-center text-sm text-gray-900 font-normal" style={{ fontWeight: 400 }}>{item.label} ({item.count})</div>
                            <div></div>
                            <div></div>
                          </>
                        ) : activeGroupBy === "type" ? (
                          <>
                            <div className="flex items-center text-sm text-gray-900 font-normal" style={{ fontWeight: 400 }}>{item.label} ({item.count})</div>
                            <div></div>
                            <div></div>
                          </>
                        ) : (
                          <>
                            <div></div>
                            <div className="flex items-center text-sm text-gray-900 font-normal" style={{ fontWeight: 400 }}>{item.label} ({item.count})</div>
                            <div></div>
                          </>
                        )}
                        {viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt1" ? (
                          <>
                            {/* For opt1: Vendor, Amount, Purchase Date, Category (4 columns) */}
                        <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                          </>
                        ) : (
                          <>
                        {viewMode === "full-width" && <div></div>}
                            {viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt2" && <div></div>}
                          </>
                        )}
                        {/* Conditional columns: Snoozed until, Status, Due date */}
                        {viewMode === "full-width" && activeTab === "snoozed" && <div></div>}
                        {viewMode === "full-width" && activeTab === "reviewed" && <div></div>}
                        {viewMode === "full-width" && activeTab !== "reviewed" && activeTab !== "snoozed" && activeTab !== "created" && activeTab !== "all" && <div></div>}
                        {viewMode === "full-width" && (activeTab === "all" || activeTab === "created") && <div></div>}
                        {viewMode === "full-width" && (activeTab === "all" || activeTab === "created") && <div></div>}
                        <div></div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 justify-end min-h-[28px]">
                          {isGroupHovered && (
                            <>
                              {hasSpecialCategory ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (onRemoveItems) {
                                      onRemoveItems(groupApprovalIds)
                                    }
                                  }}
                                  title="Mark all as done"
                                >
                                  <Archive className="h-3.5 w-3.5 text-gray-600" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-green-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (onRemoveItems) {
                                        onRemoveItems(groupApprovalIds)
                                      }
                                    }}
                                    title="Approve all"
                                  >
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 hover:bg-red-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (onRemoveItems) {
                                        onRemoveItems(groupApprovalIds)
                                      }
                                    }}
                                    title="Reject all"
                                  >
                                    <X className="h-3.5 w-3.5 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                          {onSnooze && isGroupHovered && (
                            <div className="relative" ref={snoozeGroupPopoverRef}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSnoozeGroupPopoverOpen(snoozeGroupPopoverOpen === item.key ? null : item.key)
                                }}
                                title="Snooze all"
                              >
                                <Clock className="h-3.5 w-3.5 text-gray-600" />
                              </Button>
                              {snoozeGroupPopoverOpen === item.key && (
                                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-30 min-w-[240px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleGroupQuickSnooze(item.key, groupApprovalIds, 'laterToday')
                                    }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Later today</span>
                                    <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleGroupQuickSnooze(item.key, groupApprovalIds, 'tomorrow')
                                    }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Tomorrow</span>
                                    <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleGroupQuickSnooze(item.key, groupApprovalIds, 'nextWeek')
                                    }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Next week</span>
                                    <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                                  </button>
                                  <div className="border-t border-gray-200"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSnoozeGroupPopoverOpen(null)
                                      setSnoozeGroupModalOpen(item.key)
                                      setSnoozeGroupModalIds(groupApprovalIds)
                                      setSnoozeDate(new Date())
                                    }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-black"
                          >
                            Pick a date and time
                          </button>
                                </div>
                              )}
                            </div>
                          )}
                          {onTogglePin && (isGroupHovered || groupHasPinned) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${groupHasPinned ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                // Toggle pin for all items in group
                                groupApprovalIds.forEach(id => {
                                  if (onTogglePin) {
                                    onTogglePin(id)
                                  }
                                })
                              }}
                              title={groupHasPinned ? "Unpin all" : "Pin all"}
                            >
                              <Pin className={`h-3.5 w-3.5 ${groupHasPinned ? 'text-gray-700 fill-current' : 'text-gray-600'}`} />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  }
                  
                  const approval = item.approval
                  const hasWarning = 'warning' in approval && !!approval.warning
                  const hasComments = 'comments' in approval && approval.comments && approval.comments.length > 0
                  const hasTrip = 'trip' in approval && approval.trip && approval.trip.linked
                  const detailsContent = getDetailsTooltipContent(approval)
                  const commentsContent = getCommentsTooltipContent(approval)
                  
                  const isLastItem = index === lastApprovalIndex
                  return (
                    <div
                      key={approval.id}
                      onClick={() => {
                        if (onSelectItem) {
                          onSelectItem(approval.id)
                        }
                      }}
                      onMouseEnter={() => setHoveredItem(approval.id)}
                      onMouseLeave={() => {
                        if (hoveredItem === approval.id) {
                          setHoveredItem(null)
                        }
                      }}
                      className={`grid ${(() => {
                        // For reimbursements Opt. 1, use a flexible grid template that fills available width
                        if (viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt1" && activeGroupBy === "none") {
                          // Use fixed max widths to prevent columns from growing - same as header to ensure column alignment
                          // Increased widths for requested on, requested by, vendor, amount, purchase date, category
                          return 'grid-cols-[40px_minmax(50px,120px)_minmax(80px,160px)_minmax(50px,120px)_minmax(45px,100px)_minmax(60px,130px)_minmax(80px,150px)_minmax(80px,120px)_80px_140px]'
                        }
                        // For reimbursements Opt. 2, use a specific grid template that includes purchase date (without task type)
                        if (viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt2" && activeGroupBy === "none" && activeTab !== "reviewed" && activeTab !== "snoozed" && activeTab !== "created" && activeTab !== "all") {
                          return 'grid-cols-[40px_minmax(80px,130px)_minmax(120px,180px)_minmax(180px,1fr)_minmax(80px,130px)_minmax(80px,120px)_100px_140px]'
                        }
                        let baseCols = getGridCols(activeGroupBy !== "none" ? activeGroupBy : "none", viewMode, activeTab)
                        if (viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt2") {
                          // Remove task type column (100px) - it appears after Requested by and before Details
                          // Pattern: ...minmax(120px,180px)_100px_minmax(300px,1fr)...
                          baseCols = baseCols.replace('minmax(120px,180px)_100px_minmax(300px,1fr)', 'minmax(120px,180px)_minmax(300px,1fr)')
                          baseCols = baseCols.replace('minmax(80px,130px)_100px_minmax(300px,1fr)', 'minmax(80px,130px)_minmax(300px,1fr)')
                          // Add purchase date column: insert minmax(80px,130px) (same width as Requested on) between Details and Due date, and reduce Details width
                          if (baseCols.includes('minmax(300px,1fr)_minmax(80px,120px)')) {
                            baseCols = baseCols.replace('minmax(300px,1fr)_minmax(80px,120px)', 'minmax(180px,1fr)_minmax(80px,130px)_minmax(80px,120px)')
                          } else {
                            // Fallback: insert after Details and reduce Details width
                            const detailsIndex = baseCols.indexOf('minmax(300px,1fr)')
                            if (detailsIndex !== -1) {
                              const afterDetails = baseCols.substring(detailsIndex + 'minmax(300px,1fr)'.length)
                              const nextUnderscore = afterDetails.indexOf('_')
                              if (nextUnderscore !== -1) {
                                const nextCol = afterDetails.substring(0, nextUnderscore + 1)
                                baseCols = baseCols.replace(`minmax(300px,1fr)${nextCol}`, `minmax(180px,1fr)_minmax(80px,130px)${nextCol}`)
                              }
                            }
                          }
                        }
                        return baseCols
                      })()} gap-4 pr-6 transition-colors cursor-pointer ${isLastItem ? 'border-b border-gray-200' : ''}`}
                      style={{ height: '48px', backgroundColor: hoveredItem === approval.id ? '#E5E5E5' : ((approval as any).isCritical ? '#FFF2EE' : 'white') }}
                    >
                      {/* Bulk Selection */}
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <PebbleCheckbox
                          checked={selectedItems.has(approval.id)}
                          onChange={(checked) => {
                            if (checked) {
                              onToggleItem(approval.id)
                            } else {
                              onToggleItem(approval.id)
                            }
                          }}
                          disabled={activeTab === "reviewed" || activeTab === "created" || activeTab === "all"}
                          appearance="list"
                        />
                      </div>

                      {activeGroupBy === "requestor" ? (
                        <>
                          {/* Requested by - hidden when grouping by requestor or for created tab */}
                          <div className="flex items-center min-w-0"></div>
                          {/* Reviewed on - only for reviewed tab */}
                          {activeTab === "reviewed" && (
                            <div className="flex items-center min-w-0">
                              <TruncatedText text={(approval as any).reviewedOn || '--'} className="text-sm text-gray-600 truncate" />
                            </div>
                          )}
                          {/* Requested on */}
                          <div className="flex items-center min-w-0">
                            <TruncatedText text={approval.requestedOn} className="text-gray-600 truncate" style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }} />
                          </div>
                        </>
                      ) : activeGroupBy === "type" ? (
                        <>
                          {/* Reviewed on - only for reviewed tab */}
                          {activeTab === "reviewed" && (
                            <div className="flex items-center min-w-0">
                              <TruncatedText text={(approval as any).reviewedOn || '--'} className="text-sm text-gray-600 truncate" />
                            </div>
                          )}
                          {/* Requested on */}
                          <div className="flex items-center min-w-0">
                            <TruncatedText text={approval.requestedOn} className="text-gray-600 truncate" style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }} />
                          </div>
                          {/* Requested by - hidden for created tab */}
                          {activeTab !== "created" && (
                            <div className="flex items-center gap-2 min-w-0">
                              {getRequestorAvatar(approval.requestor) ? (
                                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden relative">
                                  <Image
                                    src={getRequestorAvatar(approval.requestor)!}
                                    alt={approval.requestor}
                                    fill
                                    className="rounded-full object-cover"
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-normal text-gray-700">
                                    {approval.requestor.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <TruncatedText text={approval.requestor} className="text-sm font-normal text-gray-900 truncate" />
                                {getRequestorJobTitle(approval.requestor) && (
                                  <TruncatedText text={getRequestorJobTitle(approval.requestor)!} className="text-xs text-gray-500 truncate" style={{ fontWeight: 400 }} />
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Reviewed on - only for reviewed tab */}
                          {activeTab === "reviewed" && (
                            <div className="flex items-center min-w-0">
                              <TruncatedText text={(approval as any).reviewedOn || '--'} className="text-sm text-gray-600 truncate" />
                            </div>
                          )}
                          {/* Requested on */}
                          <div className="flex items-center min-w-0">
                            <TruncatedText text={approval.requestedOn} className="text-gray-600 truncate" style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }} />
                          </div>
                          {/* Requested by - hidden for created tab */}
                          {activeTab !== "created" && (
                            <div className="flex items-center gap-2 min-w-0">
                              {getRequestorAvatar(approval.requestor) ? (
                                <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden relative">
                                  <Image
                                    src={getRequestorAvatar(approval.requestor)!}
                                    alt={approval.requestor}
                                    fill
                                    className="rounded-full object-cover"
                                    style={{ objectFit: 'cover' }}
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-normal text-gray-700">
                                    {approval.requestor.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <TruncatedText text={approval.requestor} className="text-gray-900 truncate" style={{ fontWeight: 400, fontSize: '13px', lineHeight: '16px' }} />
                                {getRequestorJobTitle(approval.requestor) && (
                                  <TruncatedText text={getRequestorJobTitle(approval.requestor)!} className="text-gray-500 truncate" style={{ fontWeight: 400, fontSize: '11px', lineHeight: '13px' }} />
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt1" ? (
                        <>
                          {/* Opt. 1 columns: Vendor, Amount, Purchase Date, Category */}
                          <div className="flex items-center min-w-0">
                            <TruncatedText 
                              text={(approval as any).vendor?.name || '--'}
                              className="text-gray-600 truncate" 
                              style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }}
                            />
                          </div>
                          <div className="flex items-center min-w-0">
                            <TruncatedText 
                              text={(approval as any).amount || '--'}
                              className="text-gray-600 truncate" 
                              style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }}
                            />
                          </div>
                          <div className="flex items-center min-w-0">
                            <TruncatedText 
                              text={(approval as any).purchaseDate || '--'}
                              className="text-gray-600 truncate" 
                              style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }}
                            />
                          </div>
                          <div className="flex items-center min-w-0">
                            <TruncatedText 
                              text={(approval as any).expenseCategory || '--'}
                              className="text-gray-600 truncate" 
                              style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                      {/* Task type - Hidden for opt2 */}
                      {!(page === "reimbursements" && reimbursementOption === "opt2") && (
                        <>
                          {activeGroupBy !== "type" && (
                            <div className="flex items-center min-w-0">
                              <div className="flex flex-col min-w-0 flex-1">
                                <TruncatedText text={getTaskTypeDisplayName(approval)} className="text-gray-900 truncate" style={{ fontWeight: 400, fontSize: '13px', lineHeight: '16px' }} />
                                {approval.taskType && (
                                  <TruncatedText text={getDisplayCategory(approval.category)} className="text-gray-500 truncate" style={{ fontWeight: 400, fontSize: '11px', lineHeight: '13px' }} />
                                )}
                              </div>
                            </div>
                          )}
                          {activeGroupBy === "type" && (
                            <div className="flex items-center min-w-0"></div>
                          )}
                        </>
                      )}

                      {/* Details */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <TruncatedText text={approval.subject} className="text-gray-600 line-clamp-1" style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }} />
                        </div>
                        {(approval as any).isCritical && (
                          <span 
                            className="flex flex-row justify-center items-center rounded-full flex-shrink-0"
                            style={{
                              paddingLeft: '6px',
                              paddingRight: '6px',
                              paddingTop: '0px',
                              paddingBottom: '0px',
                              gap: '2px',
                              position: 'relative',
                              minWidth: '42px',
                              maxWidth: '320px',
                              height: '16px',
                              background: '#F9DAD1',
                              borderRadius: '9999px',
                              fontSize: '12px',
                              fontFamily: 'Basel Grotesk',
                              fontWeight: 500
                            }}
                          >
                            Critical
                          </span>
                        )}
                      </div>
                        </>
                      )}

                      {/* Purchase Date - Only in full-width view for reimbursements Opt. 2 */}
                      {viewMode === "full-width" && page === "reimbursements" && reimbursementOption === "opt2" && (
                        <div className="flex items-center min-w-0">
                          <TruncatedText 
                            text={(approval as any).purchaseDate || '--'}
                            className="text-gray-600 truncate" 
                            style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }}
                          />
                        </div>
                      )}

                      {/* Snoozed until - Only in full-width view for snoozed tab */}
                      {viewMode === "full-width" && activeTab === "snoozed" && (
                        <div className="flex items-center min-w-0">
                          <TruncatedText 
                            text={(() => {
                              // Check if item is in snoozedItems map
                              if (snoozedItems instanceof Map && snoozedItems.has(approval.id)) {
                                const snoozeDate = snoozedItems.get(approval.id)
                                if (snoozeDate) {
                                  return snoozeDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                                }
                              } else if (snoozedItems instanceof Set && snoozedItems.has(approval.id)) {
                                // Fallback to data if using Set
                              }
                              return formatSnoozedUntil((approval as any).snoozedUntil, (approval as any).snoozedUntilFormatted)
                            })()}
                            className="text-sm text-gray-600 truncate"
                          />
                        </div>
                      )}
                      {/* Due date - Only in full-width view for non-reviewed, non-snoozed tabs */}
                      {viewMode === "full-width" && activeTab !== "reviewed" && activeTab !== "snoozed" && activeTab !== "created" && activeTab !== "all" && (
                        <div className="flex items-center min-w-0">
                          <TruncatedText 
                            text={'dueDate' in approval && approval.dueDate ? approval.dueDate : '--'}
                            className="text-gray-600 truncate" 
                            style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }}
                          />
                        </div>
                      )}
                      {/* Status - Only in full-width view for reviewed tab */}
                      {viewMode === "full-width" && activeTab === "reviewed" && (
                        <div className="flex items-center min-w-0 gap-1">
                          <div className={`rounded-full shrink-0 ${
                            (() => {
                              return (approval as any).reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                                (approval as any).reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                                (approval as any).reviewStatus === "Completed" ? "bg-[#2780CE]" :
                                "bg-gray-400"
                            })()
                          }`} style={{ width: '8px', height: '8px' }} />
                          <TruncatedText 
                            text={(approval as any).reviewStatus || '--'}
                            className="text-sm text-gray-900 truncate"
                          />
                        </div>
                      )}
                      {/* Due date - Only in full-width view for created and all tabs (before status) */}
                      {viewMode === "full-width" && (activeTab === "created" || activeTab === "all") && (
                        <div className="flex items-center min-w-0">
                          <TruncatedText 
                            text={'dueDate' in approval && approval.dueDate ? approval.dueDate : '--'}
                            className="text-gray-600 truncate" 
                            style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"', lineHeight: '48px' }}
                          />
                        </div>
                      )}

                      {/* Status - Only in full-width view for all and created tabs (before Attributes) */}
                      {viewMode === "full-width" && (activeTab === "all" || activeTab === "created") && (
                        <div className="flex items-center min-w-0 gap-1">
                          <div className={`rounded-full shrink-0 ${
                            (() => {
                              return (approval as any).itemStatus === "Approved" ? "bg-[#2D8A70]" :
                                (approval as any).itemStatus === "Rejected" ? "bg-[#E4633C]" :
                                (approval as any).itemStatus === "Completed" ? "bg-[#2780CE]" :
                                (approval as any).itemStatus === "Pending" ? "bg-[#F59701]" :
                                (approval as any).reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                                (approval as any).reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                                (approval as any).reviewStatus === "Completed" ? "bg-[#2780CE]" :
                                "bg-gray-400"
                            })()
                          }`} style={{ width: '8px', height: '8px' }} />
                          <span className="text-sm text-gray-900 truncate">
                            {(approval as any).itemStatus || (approval as any).reviewStatus || '--'}
                          </span>
                        </div>
                      )}

                      {/* Attributes - Always show all icons */}
                      <div className="flex items-center gap-2 relative">
                        <div 
                          className="cursor-pointer relative group"
                          onMouseEnter={(e) => hasWarning && handleIconMouseEnter(e, approval.id, 'warning')}
                          onMouseLeave={handleIconMouseLeave}
                        >
                          <AlertTriangle 
                            className="h-4 w-4" 
                            style={{ color: hasWarning ? (viewMode === "full-width" ? '#F59E0B' : '#106A63') : '#F2F2F2' }}
                          />
                        </div>
                        <div 
                          className="cursor-pointer relative group"
                          onMouseEnter={(e) => detailsContent && handleIconMouseEnter(e, approval.id, 'details')}
                          onMouseLeave={handleIconMouseLeave}
                        >
                            <Info 
                              className="h-4 w-4" 
                              style={{ color: detailsContent ? '#106A63' : '#F2F2F2' }}
                            />
                        </div>
                        <div 
                          className="cursor-pointer relative group"
                          onMouseEnter={(e) => hasComments && handleIconMouseEnter(e, approval.id, 'comments')}
                          onMouseLeave={handleIconMouseLeave}
                        >
                          <MessageCircle 
                            className="h-4 w-4" 
                            style={{ color: hasComments ? '#106A63' : '#F2F2F2' }}
                          />
                        </div>
                        <div 
                          className="cursor-pointer relative group"
                          onMouseEnter={(e) => hasTrip && handleIconMouseEnter(e, approval.id, 'trip')}
                          onMouseLeave={handleIconMouseLeave}
                        >
                          <Plane 
                            className="h-4 w-4" 
                            style={{ color: hasTrip ? '#106A63' : '#F2F2F2' }}
                          />
                        </div>
                      </div>

                      {/* Actions - Show approve/reject on hover, pin always visible if pinned */}
                      <div className="flex items-center gap-1 justify-end min-h-[28px]">
                        {hoveredItem === approval.id && activeTab !== "reviewed" && activeTab !== "all" && activeTab !== "created" && (
                          <>
                            {(approval.category === "Training" || approval.category === "Documents" || approval.category === "Miscellaneous" || approval.category === "Payroll") ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onMarkAsDone) {
                                    onMarkAsDone(approval.id)
                                  }
                                }}
                                title="Mark as done"
                              >
                                <Archive className="h-3.5 w-3.5 text-gray-600" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-green-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (onApprove) {
                                      onApprove(approval.id)
                                    }
                                  }}
                                  title="Approve"
                                >
                                  <Check className="h-3.5 w-3.5 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:bg-red-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (onReject) {
                                      onReject(approval.id)
                                    }
                                  }}
                                  title="Reject"
                                >
                                  <X className="h-3.5 w-3.5 text-red-600" />
                                </Button>
                              </>
                            )}
                          </>
                        )}
                        {onSnooze && (hoveredItem === approval.id) && activeTab !== "reviewed" && activeTab !== "all" && activeTab !== "created" && (
                          <div className="relative" ref={snoozePopoverRef}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSnoozePopoverOpen(snoozePopoverOpen === approval.id ? null : approval.id)
                              }}
                              title="Snooze"
                            >
                              <Clock className="h-3.5 w-3.5 text-gray-600" />
                            </Button>
                            {snoozePopoverOpen === approval.id && (
                              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 min-w-[240px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuickSnooze(approval.id, 'laterToday')
                                  }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Later today</span>
                                  <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuickSnooze(approval.id, 'tomorrow')
                                  }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Tomorrow</span>
                                  <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleQuickSnooze(approval.id, 'nextWeek')
                                  }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Next week</span>
                                  <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                                </button>
                                <div className="border-t border-gray-200"></div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSnoozePopoverOpen(null)
                                    setSnoozeModalOpen(approval.id)
                                    setSnoozeDate(new Date())
                                  }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-black"
                          >
                            Pick a date and time
                          </button>
                              </div>
                            )}
                          </div>
                        )}
                        {onTogglePin && (() => {
                          const isCritical = (approval as any).isCritical === true
                          const isExplicitlyPinned = pinnedItems.has(approval.id)
                          const isExplicitlyUnpinned = isCritical && unpinnedCriticalItems.has(approval.id)
                          const isEffectivelyPinned = isExplicitlyPinned || (isCritical && !isExplicitlyUnpinned)
                          const shouldShowPin = hoveredItem === approval.id || isEffectivelyPinned
                          
                          return shouldShowPin && activeTab !== "reviewed" && activeTab !== "all" && activeTab !== "created" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-7 w-7 ${isEffectivelyPinned ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                onTogglePin(approval.id, isCritical)
                              }}
                              title={isEffectivelyPinned ? "Unpin" : "Pin"}
                            >
                              <Pin className={`h-3.5 w-3.5 ${isEffectivelyPinned ? 'text-gray-700 fill-current' : 'text-gray-600'}`} />
                            </Button>
                          )
                        })()}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onSelectItem) {
                              onSelectItem(approval.id)
                            }
                          }}
                          title="View details"
                        >
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                  )
                  })
                })()
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snooze Modal */}
      {snoozeModalOpen !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSnoozeModalOpen(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-normal mb-4">Pick a date and time</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={snoozeDate ? snoozeDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSnoozeDate(e.target.value ? new Date(e.target.value) : null)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={snoozeTime}
                  onChange={(e) => setSnoozeTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSnoozeModalOpen(null)
                  setSnoozeDate(null)
                  setSnoozeTime("08:00")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (snoozeModalOpen !== null) {
                    handleSaveSnooze(snoozeModalOpen)
                  }
                }}
                disabled={!snoozeDate}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Snooze Modal */}
      {snoozeModalOpen !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSnoozeModalOpen(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-normal mb-4">Pick a date and time</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={snoozeDate ? snoozeDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSnoozeDate(e.target.value ? new Date(e.target.value) : null)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={snoozeTime}
                  onChange={(e) => setSnoozeTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSnoozeModalOpen(null)
                  setSnoozeDate(null)
                  setSnoozeTime("08:00")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (snoozeModalOpen !== null) {
                    handleSaveSnooze(snoozeModalOpen)
                  }
                }}
                disabled={!snoozeDate}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Snooze Modal */}
      {bulkSnoozeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setBulkSnoozeModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-normal mb-4">Pick a date and time</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={snoozeDate ? snoozeDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSnoozeDate(e.target.value ? new Date(e.target.value) : null)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={snoozeTime}
                  onChange={(e) => setSnoozeTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setBulkSnoozeModalOpen(false)
                  setSnoozeDate(null)
                  setSnoozeTime("08:00")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (snoozeDate && snoozeTime) {
                    const [hours, minutes] = snoozeTime.split(':').map(Number)
                    const snoozeUntil = new Date(snoozeDate)
                    snoozeUntil.setHours(hours, minutes, 0, 0)
                    handleBulkSnooze(snoozeUntil)
                    setSnoozeDate(null)
                    setSnoozeTime("08:00")
                  }
                }}
                disabled={!snoozeDate}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Snooze Modal for groups */}
      {snoozeGroupModalOpen !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSnoozeGroupModalOpen(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-normal mb-4">Pick a date and time</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={snoozeDate ? snoozeDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSnoozeDate(e.target.value ? new Date(e.target.value) : null)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={snoozeTime}
                  onChange={(e) => setSnoozeTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSnoozeGroupModalOpen(null)
                  setSnoozeGroupModalIds([])
                  setSnoozeDate(null)
                  setSnoozeTime("08:00")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (snoozeGroupModalOpen !== null) {
                    handleSaveGroupSnooze(snoozeGroupModalOpen, snoozeGroupModalIds)
                  }
                }}
                disabled={!snoozeDate}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Action Bar */}
      {hasSelectedItems && (
        <div className="fixed bottom-[75px] left-1/2 transform -translate-x-1/2 text-white p-4 shadow-lg flex items-center z-50" style={{ backgroundColor: '#7A005D', borderRadius: '16px' }}>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal">{selectedItems.size}</span>
              <span className="text-sm">selected</span>
            </div>
          </div>
          <div className="flex items-center gap-2" style={{ marginLeft: '24px' }}>
                {(() => {
                  if (!selectedItems || selectedItems.size === 0) return null;
                  
                  // Get all selected items data
                  const selectedApprovals = Array.from(selectedItems).map(id => 
                    [...approvalData, ...taskData].find(item => item.id === id)
                  ).filter((item): item is NonNullable<typeof item> => Boolean(item));
                  
                  // Determine categories of selected items
                  const hasApprovals = selectedApprovals.some(item => 
                    item.category.startsWith('Approvals -')
                  );
                  const hasDocuments = selectedApprovals.some(item => item.category === 'Documents');
                  const hasTraining = selectedApprovals.some(item => item.category === 'Training');
                  const hasTeamBuilding = selectedApprovals.some(item => item.category === 'Miscellaneous');
                  const hasPayrollAmendment = selectedApprovals.some(item => item.category === 'Payroll');
                  const hasTasks = hasDocuments || hasTraining || hasTeamBuilding || hasPayrollAmendment
                  
                  // Show actions based on what's selected
                  const actions = [];
                  
                  // If Approvals + tasks are selected together, show only Snooze
                  if (hasApprovals && hasTasks) {
                    return (
                      <div key="snooze-wrapper" className="relative" ref={bulkSnoozePopoverRef}>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-white/20 h-8 px-3"
                          onClick={() => setBulkSnoozePopoverOpen(!bulkSnoozePopoverOpen)}
                        >
                          Snooze
                        </Button>
                        {bulkSnoozePopoverOpen && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[240px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getLaterToday()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Later today</span>
                              <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getTomorrow()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Tomorrow</span>
                              <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getNextWeek()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Next week</span>
                              <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                            </button>
                            <div className="border-t border-gray-200"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setBulkSnoozePopoverOpen(false)
                                setBulkSnoozeModalOpen(true)
                                setSnoozeDate(new Date())
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-black"
                          >
                            Pick a date and time
                          </button>
                          </div>
                        )}
                      </div>
                    )
                  }
                  
                  // If only approvals are selected, show Approve, Reject, Snooze
                  if (hasApprovals && !hasDocuments && !hasTraining && !hasTeamBuilding && !hasPayrollAmendment) {
                    actions.push(
                      <Button 
                        key="approve" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onApprove && selectedItems && selectedItems.size > 0) {
                            Array.from(selectedItems).forEach(id => onApprove(id))
                            onClearSelection()
                          }
                        }}
                      >
                        Approve
                      </Button>,
                      <Button 
                        key="reject" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onReject && selectedItems && selectedItems.size > 0) {
                            Array.from(selectedItems).forEach(id => onReject(id))
                            onClearSelection()
                          }
                        }}
                      >
                        Reject
                      </Button>,
                      <div key="snooze-wrapper" className="relative" ref={bulkSnoozePopoverRef}>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-white/20 h-8 px-3"
                          onClick={() => setBulkSnoozePopoverOpen(!bulkSnoozePopoverOpen)}
                        >
                          Snooze
                        </Button>
                        {bulkSnoozePopoverOpen && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[240px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getLaterToday()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Later today</span>
                              <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getTomorrow()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Tomorrow</span>
                              <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getNextWeek()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Next week</span>
                              <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                            </button>
                            <div className="border-t border-gray-200"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setBulkSnoozePopoverOpen(false)
                                setBulkSnoozeModalOpen(true)
                                setSnoozeDate(new Date())
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-black"
                          >
                            Pick a date and time
                          </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // If only documents are selected, show Sign document, Mark as done, Snooze
                  else if (hasDocuments && !hasApprovals && !hasTraining && !hasTeamBuilding && !hasPayrollAmendment) {
                    actions.push(
                      <Button 
                        key="sign" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onRemoveItems && selectedItems && selectedItems.size > 0) {
                            onRemoveItems(Array.from(selectedItems))
                            onClearSelection()
                          }
                        }}
                      >
                        Sign document
                      </Button>,
                      <Button 
                        key="mark-done" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onMarkAsDone && selectedItems && selectedItems.size > 0) {
                            Array.from(selectedItems).forEach(id => onMarkAsDone(id))
                            onClearSelection()
                          }
                        }}
                      >
                        Mark as done
                      </Button>,
                      <div key="snooze-wrapper" className="relative" ref={bulkSnoozePopoverRef}>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-white/20 h-8 px-3"
                          onClick={() => setBulkSnoozePopoverOpen(!bulkSnoozePopoverOpen)}
                        >
                          Snooze
                        </Button>
                        {bulkSnoozePopoverOpen && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[240px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getLaterToday()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Later today</span>
                              <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getTomorrow()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Tomorrow</span>
                              <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getNextWeek()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Next week</span>
                              <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                            </button>
                            <div className="border-t border-gray-200"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setBulkSnoozePopoverOpen(false)
                                setBulkSnoozeModalOpen(true)
                                setSnoozeDate(new Date())
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-black"
                          >
                            Pick a date and time
                          </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // If only training are selected, show Take course, Mark as done, Snooze
                  else if (hasTraining && !hasApprovals && !hasDocuments && !hasTeamBuilding && !hasPayrollAmendment) {
                    actions.push(
                      <Button 
                        key="take-course" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onRemoveItems && selectedItems && selectedItems.size > 0) {
                            onRemoveItems(Array.from(selectedItems))
                            onClearSelection()
                          }
                        }}
                      >
                        Take course
                      </Button>,
                      <Button 
                        key="mark-done" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onMarkAsDone && selectedItems && selectedItems.size > 0) {
                            Array.from(selectedItems).forEach(id => onMarkAsDone(id))
                            onClearSelection()
                          }
                        }}
                      >
                        Mark as done
                      </Button>,
                      <div key="snooze-wrapper" className="relative" ref={bulkSnoozePopoverRef}>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-white/20 h-8 px-3"
                          onClick={() => setBulkSnoozePopoverOpen(!bulkSnoozePopoverOpen)}
                        >
                          Snooze
                        </Button>
                        {bulkSnoozePopoverOpen && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[240px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getLaterToday()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Later today</span>
                              <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getTomorrow()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Tomorrow</span>
                              <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getNextWeek()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Next week</span>
                              <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                            </button>
                            <div className="border-t border-gray-200"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setBulkSnoozePopoverOpen(false)
                                setBulkSnoozeModalOpen(true)
                                setSnoozeDate(new Date())
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-black"
                          >
                            Pick a date and time
                          </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // If only payroll amendment are selected, show Add account number, Mark as done, Snooze
                  else if (hasPayrollAmendment && !hasApprovals && !hasDocuments && !hasTraining && !hasTeamBuilding) {
                    actions.push(
                      <Button 
                        key="add-account" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onRemoveItems && selectedItems && selectedItems.size > 0) {
                            onRemoveItems(Array.from(selectedItems))
                            onClearSelection()
                          }
                        }}
                      >
                        Add account number
                      </Button>,
                      <Button 
                        key="mark-done" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onMarkAsDone && selectedItems && selectedItems.size > 0) {
                            Array.from(selectedItems).forEach(id => onMarkAsDone(id))
                            onClearSelection()
                          }
                        }}
                      >
                        Mark as done
                      </Button>,
                      <div key="snooze-wrapper" className="relative" ref={bulkSnoozePopoverRef}>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-white/20 h-8 px-3"
                          onClick={() => setBulkSnoozePopoverOpen(!bulkSnoozePopoverOpen)}
                        >
                          Snooze
                        </Button>
                        {bulkSnoozePopoverOpen && (
                          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-[240px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getLaterToday()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Later today</span>
                              <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getTomorrow()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Tomorrow</span>
                              <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onSnooze && selectedItems && selectedItems.size > 0) {
                                  const snoozeUntil = getNextWeek()
                                  Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                                  setBulkSnoozePopoverOpen(false)
                                  onClearSelection()
                                }
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between text-black"
                          >
                            <span className="text-black">Next week</span>
                              <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                            </button>
                            <div className="border-t border-gray-200"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setBulkSnoozePopoverOpen(false)
                                setBulkSnoozeModalOpen(true)
                                setSnoozeDate(new Date())
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs text-black"
                          >
                            Pick a date and time
                          </button>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // If only team building are selected, show Mark as done, Snooze
                  else if (hasTeamBuilding && !hasApprovals && !hasDocuments && !hasTraining && !hasPayrollAmendment) {
                    actions.push(
                      <Button 
                        key="mark-done" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onMarkAsDone && selectedItems && selectedItems.size > 0) {
                            Array.from(selectedItems).forEach(id => onMarkAsDone(id))
                            onClearSelection()
                          }
                        }}
                      >
                        Mark as done
                      </Button>,
                      <Button 
                        key="snooze" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onSnooze && selectedItems && selectedItems.size > 0) {
                            const snoozeUntil = getLaterToday()
                            Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
                            onClearSelection()
                          }
                        }}
                      >
                        Snooze
                      </Button>
                    );
                  }
                  // If mixed selections, only show Mark as done
                  else {
                    actions.push(
                      <Button 
                        key="mark-done" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20 h-8 px-3"
                        onClick={() => {
                          if (onRemoveItems && selectedItems && selectedItems.size > 0) {
                            onRemoveItems(Array.from(selectedItems))
                            onClearSelection()
                          }
                        }}
                      >
                        Mark as done
                      </Button>
                    );
                  }
                  
                  return actions;
                })()}
              </div>
            </div>
          )}
      
      {/* Custom Tooltip with new styling */}
      {tooltipData.id !== null && tooltipData.type !== null && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: tooltipData.side === 'right' ? 'translateY(-50%)' : 'translate(-100%, -50%)',
            backgroundColor: '#EDEBE7',
            border: '1px solid #E5E7EB',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '12px',
            width: (() => {
              if (tooltipData.type === 'warning' || tooltipData.type === 'trip') return '256px'
              if (tooltipData.type === 'details') {
                const approval = approvals.find(a => a.id === tooltipData.id)
                const isReimbursement = approval && 
                  (approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements")
                return isReimbursement ? '500px' : '285px'
              }
              return '320px'
            })(),
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100vh - 16px)',
            padding: '0'
          }}
        >
          {tooltipData.type === 'warning' && (() => {
            const approval = approvals.find(a => a.id === tooltipData.id)
            return approval && 'warning' in approval ? (
              <div className="flex flex-col p-3">
                <div className="flex flex-col" style={{ marginBottom: '10px' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                        Warning
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
                  <div style={{ marginBottom: '0' }}>
                    <div className="text-xs text-gray-500">Message</div>
                    <div className="text-xs text-gray-900 font-medium">{approval.warning}</div>
                  </div>
                </div>
              </div>
            ) : null
          })()}
          {tooltipData.type === 'details' && (
            <div>{getDetailsTooltipContent(approvals.find(a => a.id === tooltipData.id))}</div>
          )}
          {tooltipData.type === 'comments' && (
            <div>{getCommentsTooltipContent(approvals.find(a => a.id === tooltipData.id))}</div>
          )}
          {tooltipData.type === 'trip' && (() => {
            const approval = approvals.find(a => a.id === tooltipData.id)
            return approval && 'trip' in approval ? (
              <div className="flex flex-col p-3">
                <div className="flex flex-col" style={{ marginBottom: '10px' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                        Linked Trip
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
                  <div style={{ marginBottom: '0' }}>
                    <div className="text-xs text-gray-500">Trip Name</div>
                    <div className="text-xs text-gray-900 font-medium">{approval.trip?.name}</div>
                  </div>
                </div>
              </div>
            ) : null
          })()}
        </div>,
        document.body
      )}
    </div>
  )
}
