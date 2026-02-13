import { Input } from "@/components/ui/input"
import { PebbleCheckbox } from "@/components/ui/pebble-checkbox"
import { Button } from "@/components/ui/button"
import { ChevronDown, Check, X, MessageCircle, Plane, Search, AlertTriangle, Archive, Pin, ChevronRight, ChevronLeft, ArrowUp, ArrowDown } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { generateApprovalData } from "@/lib/approval-data"

interface ApprovalsListProps {
  selectedItem: number | null
  onSelectItem: (id: number | null) => void
  selectedItems: Set<number>
  onToggleItem: (id: number) => void
  onSelectAll: (filteredIds: number[]) => void
  onClearSelection: () => void
  onFilterChange: (filteredIds: number[]) => void
  removedItems?: Set<number>
  onRemoveItem?: (id: number) => void
  onRemoveItems?: (ids: number[]) => void
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  onMarkAsDone?: (id: number) => void
  page?: "tasks" | "inbox" | "reimbursements" | "approvals"
  hideHeader?: boolean
  externalSearchQuery?: string
  externalSelectedCategory?: string
  onSearchChange?: (query: string) => void
  onCategoryChange?: (category: string) => void
  sortBy?: { column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" } | "recency" | "dueDate"
  onSortChange?: (sortBy: { column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" } | "recency" | "dueDate") => void
  pinnedItems?: Set<number>
  onTogglePin?: (id: number, isCritical?: boolean) => void
  unpinnedCriticalItems?: Set<number>
  groupBy?: "none" | "requestor" | "type"
  snoozedItems?: Set<number> | Map<number, Date>
  onSnooze?: (id: number, snoozeUntil: Date) => void
  activeTab?: string
  externalFilters?: Array<{ id: string; field: string; operator: string; value: string | string[] | Date | null }>
}

type GroupedApproval = 
  | { type: 'group', key: string, label: string, count: number, approvals: any[] }
  | { type: 'approval', approval: any }

export function ApprovalsList({ 
  selectedItem, 
  onSelectItem, 
  selectedItems, 
  onToggleItem, 
  onSelectAll, 
  onClearSelection, 
  onFilterChange,
  removedItems = new Set(),
  onRemoveItem,
  onRemoveItems,
  onApprove,
  onReject,
  onMarkAsDone,
  page = "tasks",
  hideHeader = false,
  externalSearchQuery,
  externalSelectedCategory,
  onSearchChange,
  onCategoryChange,
  sortBy = "recency",
  onSortChange,
  pinnedItems = new Set(),
  onTogglePin,
  unpinnedCriticalItems = new Set(),
  groupBy = "none",
  snoozedItems = new Set() as Set<number> | Map<number, Date>,
  onSnooze,
  activeTab = "pending",
  externalFilters = [],
}: ApprovalsListProps) {
  // Helper function to get display category name
  const getDisplayCategory = (category: string) => {
    // Map category values to display names
    if (category === "Training") {
      return "Learning Management"
    }
    return category
  }
  
  // Map actionType to task type display name (same as ApprovalsGrid)
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
      'SCHEDULING_EMPLOYEE_SHIFT_PUBLISH': 'Publish shift',
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
  const [selectedCategory, setSelectedCategory] = useState<string>(externalSelectedCategory || "All")
  // sortBy is now passed as a prop
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>(externalSearchQuery || "")
  const [isPanelExpanded, setIsPanelExpanded] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  
  // Reset collapsed groups when groupBy changes
  useEffect(() => {
    setCollapsedGroups(new Set())
  }, [groupBy])
  
  // Update internal state when external props change
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery)
    }
  }, [externalSearchQuery])

  useEffect(() => {
    if (externalSelectedCategory !== undefined) {
      setSelectedCategory(externalSelectedCategory)
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
    setSelectedCategory(category)
    if (onCategoryChange) {
      onCategoryChange(category)
    }
  }
  const dropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Current user for "Created by me" filter
  const currentUser = "Acme, Inc."
  
  // Use shared approval data generation
  const approvalData = useMemo(() => generateApprovalData(), [])

  const taskData = useMemo(() => [
    // Pending tasks
    {
      id: 101,
      requestor: "HR Team",
      subject: "Take required cybersecurity course for Q4 certification",
      category: "Training",
      time: "4 min ago",
      requestedOn: "Jan 16, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "HR Team",
      courseName: "Cybersecurity Fundamentals",
      dueDate: "Jan 31, 2025",
      estimatedDuration: "3 hours"
    },
    {
      id: 102,
      requestor: "Legal Department",
      subject: "Sign updated company policy document",
      category: "Documents",
      time: "6 min ago",
      requestedOn: "Jan 17, 2025",
      status: "pending",
      isSnoozed: false,
      createdBy: "Legal Department",
      documentName: "Employee Handbook 2024",
      dueDate: "Jan 21, 2025"
    },
    {
      id: 103,
      requestor: "Onboarding Team",
      subject: "Take new hire Alex Martinez out to lunch",
      category: "Miscellaneous",
      time: "14 min ago",
      requestedOn: "Jan 18, 2025",
      status: "pending",
      isSnoozed: false,
      createdBy: "Onboarding Team",
      newHireName: "Alex Martinez",
      newHireRole: "Software Engineer",
      suggestedDate: "This week",
      dueDate: "Feb 1, 2025"
    },
    {
      id: 104,
      requestor: "HR Team",
      subject: "Complete leadership development course",
      category: "Training",
      time: "20 min ago",
      requestedOn: "Jan 4, 2025",
      status: "pending",
      isSnoozed: false,
      createdBy: "HR Team",
      courseName: "Leadership Essentials",
      dueDate: "Jan 18, 2025",
      estimatedDuration: "8 hours"
    },
    {
      id: 105,
      requestor: "Legal Department",
      subject: "Sign non-disclosure agreement for new project",
      category: "Documents",
      time: "25 min ago",
      requestedOn: "Jan 3, 2025",
      status: "pending",
      isSnoozed: false,
      createdBy: "Legal Department",
      documentName: "NDA - Project Phoenix",
      dueDate: "Jan 10, 2025"
    },
    {
      id: 106,
      requestor: "Onboarding Team",
      subject: "Take new hire Sarah Kim out to lunch",
      category: "Miscellaneous",
      time: "30 min ago",
      requestedOn: "Jan 2, 2025",
      status: "pending",
      isSnoozed: false,
      createdBy: "Onboarding Team",
      newHireName: "Sarah Kim",
      newHireRole: "Product Designer",
      suggestedDate: "This week",
      dueDate: "Jan 16, 2025"
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
      isSnoozed: false,
      createdBy: "HR Team",
      reviewedOn: "Jan 12, 2025",
      courseName: "Performance Review Process",
      dueDate: "Jan 15, 2025"
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
      isSnoozed: false,
      createdBy: "Legal Department",
      reviewedOn: "Jan 10, 2025",
      documentName: "Privacy Policy 2025",
      dueDate: "Jan 8, 2025"
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
      isSnoozed: true,
      createdBy: "HR Team",
      snoozedUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      courseName: "Diversity & Inclusion",
      dueDate: "Jan 30, 2025",
      estimatedDuration: "2 hours"
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
      isSnoozed: false,
      createdBy: "Acme, Inc.",
      documentName: "Q1 Strategic Plan 2025",
      dueDate: "Jan 25, 2025"
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
      isSnoozed: false,
      createdBy: "Acme, Inc.",
      reviewedOn: "Jan 19, 2025",
      newHireName: "Team Event",
      newHireRole: "Activity",
      suggestedDate: "This month",
      dueDate: "Jan 20, 2025"
    },
    {
      id: 112,
      requestor: "Payroll Team",
      subject: "Submit amendment for MI state Wh filing",
      category: "Payroll",
      time: "1 hour ago",
      requestedOn: "Jan 21, 2025",
      status: "pending",
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

  // Use same data source as ApprovalsGrid - combine approvalData and taskData
  const allData = useMemo(() => [...approvalData, ...taskData], [approvalData, taskData])
  
  // Filter by activeTab (same logic as ApprovalsGrid)
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

  const categories = ["All", "Approvals", "HR Management", "Reimbursements", "Time and Attendance", "Training", "Documents", "Miscellaneous", "Payroll"]
  
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
    // For approvals page, check if selectedCategory is a task type (same as ApprovalsGrid)
    if (page === "approvals" && (approval as any).taskType) {
      return (approval as any).taskType === selectedCategory
    }
    return approval.category === selectedCategory
  }
  
  // Approvals are already filtered by activeTab and removedItems in useMemo above
  // Now apply category, search, and external filters - memoize to prevent infinite loops
  const filteredApprovals = useMemo(() => {
    return approvals.filter(approval => {
    // Only exclude snoozed items if not on snoozed tab (removedItems already excluded in useMemo)
    if (activeTab !== "snoozed" && activeTab !== "all" && (approval.isSnoozed || snoozedItems.has(approval.id))) return false
    
    // Finance page removed - no special handling needed
    
    // For approvals page, only show items that are approvals (same as ApprovalsGrid)
    if (page === "approvals" && !approval.category.startsWith("Approvals -")) {
      return false
    }
    
    // Category filter - use getCategoryMatch for approvals page too (handles taskType)
    const categoryMatch = page === "tasks" || page === "inbox" || page === "approvals"
      ? getCategoryMatch(approval, selectedCategory)
      : selectedCategory === "All" || approval.category === `Approvals - ${selectedCategory}`
    
    // Search filter
    const searchMatch = searchQuery === "" || 
      approval.requestor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Apply active filters - using same logic as ApprovalsGrid
    const filterMatch = externalFilters.every(filter => {
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
    
    return categoryMatch && searchMatch && filterMatch
    })
  }, [approvals, activeTab, snoozedItems, selectedCategory, searchQuery, externalFilters, page])

  // Sort filtered approvals - memoize to prevent infinite loops
  const sortedApprovals = useMemo(() => {
    return [...filteredApprovals].sort((a, b) => {
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
      // Default to requestedOn ascending
      sortColumn = "requestedOn"
      sortDirection = "asc"
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
  }, [filteredApprovals, pinnedItems, unpinnedCriticalItems, activeTab, sortBy, snoozedItems])

  // Group approvals if groupBy is set
  const groupedApprovals: GroupedApproval[] = (() => {
    if (groupBy === "none") {
      return sortedApprovals.map(approval => ({ type: 'approval' as const, approval }))
    }
    
    const groups = new Map<string, any[]>()
    for (const approval of sortedApprovals) {
      let key: string
      let label: string
      if (groupBy === "requestor") {
        key = approval.requestor
        label = approval.requestor
      } else { // groupBy === "type"
        key = approval.category
        label = getDisplayCategory(approval.category)
      }
      
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(approval)
    }
    
    const result: GroupedApproval[] = []
    for (const [key, approvals] of Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      const label = groupBy === "requestor" ? key : getDisplayCategory(key)
      result.push({ type: 'group', key, label, count: approvals.length, approvals })
      if (!collapsedGroups.has(key)) {
        for (const approval of approvals) {
          result.push({ type: 'approval', approval })
        }
      }
    }
    return result
  })();

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

  // Notify parent of filtered IDs for smart selection handling
  // Use ref to track previous IDs and only update when they actually change
  const prevFilteredIdsRef = useRef<number[]>([])
  useEffect(() => {
    const currentIds = sortedApprovals.map(approval => approval.id)
    const idsChanged = currentIds.length !== prevFilteredIdsRef.current.length ||
      currentIds.some((id, index) => id !== prevFilteredIdsRef.current[index])
    
    if (idsChanged) {
      prevFilteredIdsRef.current = currentIds
      onFilterChange(currentIds)
    }
  }, [sortedApprovals])

  const isAllSelected = sortedApprovals.length > 0 && sortedApprovals.every(approval => selectedItems?.has(approval.id) || false)
  const isSomeSelected = sortedApprovals.some(approval => selectedItems?.has(approval.id) || false)

  const handleSelectAllClick = () => {
    if (isAllSelected) {
      onClearSelection()
    } else {
      onSelectAll(sortedApprovals.map(approval => approval.id))
    }
  }

  // Calculate category counts
  const getCategoryCount = (category: string) => {
    if (category === "All") {
      return approvals.filter(approval => !removedItems.has(approval.id)).length
    }
    if (category === "Critical") {
      return approvals.filter(approval => 
        !removedItems.has(approval.id) && (approval as any).isCritical === true
      ).length
    }
    if (page === "tasks" || page === "inbox") {
      if (category === "Approvals") {
        return approvals.filter(approval => 
          !removedItems.has(approval.id) && approval.category.startsWith("Approvals -")
        ).length
      }
      if (category === "HR Management" || category === "Reimbursements" || category === "Time and Attendance") {
        return approvals.filter(approval => 
          !removedItems.has(approval.id) && 
          (approval.category === `Approvals - ${category}` || approval.category === category)
        ).length
      }
      return approvals.filter(approval => 
        !removedItems.has(approval.id) && approval.category === category
      ).length
    } else {
      // For approvals page, categories are like "HR Management" but approvals have "Approvals - HR Management"
      return approvals.filter(approval => 
        !removedItems.has(approval.id) && approval.category === `Approvals - ${category}`
      ).length
    }
  }

  // Get all sub-categories for the panel
  const getPanelCategories = () => {
    if (page === "tasks" || page === "inbox") {
      return [
        { name: "All", isSubCategory: false },
        { name: "Approvals", isSubCategory: false },
        { name: "HR Management", isSubCategory: true },
        { name: "Reimbursements", isSubCategory: true },
        { name: "Time and Attendance", isSubCategory: true },
        { name: "Training", isSubCategory: false },
        { name: "Documents", isSubCategory: false },
        { name: "Miscellaneous", isSubCategory: false },
        { name: "Payroll", isSubCategory: false },
      ]
    } else {
      return [
        { name: "All", isSubCategory: false },
        { name: "HR Management", isSubCategory: false },
        { name: "Reimbursements", isSubCategory: false },
        { name: "Time and Attendance", isSubCategory: false },
      ]
    }
  }

  return (
    <div className={`h-full flex bg-card transition-all duration-300 flex-shrink-0 border-l-0 ${hideHeader ? 'w-full' : (isPanelExpanded ? 'w-[584px]' : 'w-[376px]')}`} style={{ height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'row' }}>
      {/* Expansion Panel */}
      {!hideHeader && (
        <div className={`flex-shrink-0 border-r border-l-0 border-border pt-2 transition-all duration-300 ${isPanelExpanded ? 'w-[250px]' : 'w-0 overflow-hidden border-l-0'}`}>
          <div className="p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-normal text-gray-900">Categories</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPanelExpanded(false)}
                className="h-6 w-6"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {getPanelCategories().map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    handleCategoryChange(cat.name)
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    cat.isSubCategory ? 'pl-6' : ''
                  } ${
                    selectedCategory === cat.name 
                      ? 'bg-[#CCCCCC] text-black font-normal' 
                      : 'hover:bg-muted text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{cat.name}</span>
                    <span className="text-xs text-gray-500">{getCategoryCount(cat.name)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Panel toggle button */}
      {!hideHeader && !isPanelExpanded && (
        <div className="flex-shrink-0 border-r border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPanelExpanded(true)}
            className="h-8 w-8 m-1"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Right side: Header and List */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!hideHeader && (
        <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {false ? (
              <h2 className="text-base font-normal text-gray-900">Reimbursement requests</h2>
            ) : page !== "inbox" ? (
            <div className="relative" ref={dropdownRef}>
              <Button 
                variant="ghost" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="rippling-btn-ghost h-auto p-0 hover:bg-transparent"
              >
                <h2 className="text-base font-normal text-gray-900">{selectedCategory}</h2>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[200px]">
                {page === "tasks" ? (
                  <>
                    <button
                      onClick={() => {
                        handleCategoryChange("All")
                        setIsDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-muted text-sm rippling-text-sm transition-colors ${
                        selectedCategory === "All" ? 'bg-muted font-normal' : ''
                      }`}
                    >
                      All
                    </button>
                    {categories.filter(cat => cat !== "All" && cat !== "HR Management" && cat !== "Reimbursements" && cat !== "Time and Attendance").map((category) => (
                      category === "Approvals" ? (
                        <div key={category}>
                          <button
                            onClick={() => {
                              handleCategoryChange(category)
                              setIsDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-normal ${
                              selectedCategory === category ? 'bg-gray-50' : ''
                            }`}
                          >
                            {category}
                          </button>
                          <div className="pl-4">
                            <button
                              onClick={() => {
                                handleCategoryChange("HR Management")
                                setIsDropdownOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-600 ${
                                selectedCategory === "HR Management" ? 'bg-gray-50' : ''
                              }`}
                            >
                              HR Management
                            </button>
                            <button
                              onClick={() => {
                                handleCategoryChange("Reimbursements")
                                setIsDropdownOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-600 ${
                                selectedCategory === "Reimbursements" ? 'bg-gray-50' : ''
                              }`}
                            >
                              Reimbursements
                            </button>
                            <button
                              onClick={() => {
                                handleCategoryChange("Time and Attendance")
                                setIsDropdownOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-600 ${
                                selectedCategory === "Time and Attendance" ? 'bg-gray-50' : ''
                              }`}
                            >
                              Time and Attendance
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          key={category}
                          onClick={() => {
                            handleCategoryChange(category)
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                            selectedCategory === category ? 'bg-gray-50 font-normal' : ''
                          }`}
                        >
                          {category}
                        </button>
                      )
                    ))}
                  </>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        handleCategoryChange(category)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    >
                      {category}
                    </button>
                  ))
                )}
              </div>
              )}
            </div>
            ) : null}
          </div>
        </div>
        
        <div className="mb-4 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-[10px] top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="rippling-input w-[339px] pl-[30px] pr-10 rounded-[8px] text-sm" 
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="rippling-btn-ghost absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                onClick={() => handleSearchChange("")}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>
          {(page === "tasks" || page === "inbox") && (
            <div className="relative ml-4" ref={sortDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="rippling-btn-outline h-8 gap-2 rippling-text-sm"
                style={{ fontWeight: 300 }}
              >
                Sort: {sortBy === "recency" ? "Recency" : "Due Date"}
                <ChevronDown className="h-4 w-4" />
              </Button>
              {isSortDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-50 min-w-[200px]">
                  <button
                    onClick={() => {
                      if (onSortChange) {
                        onSortChange("recency")
                      }
                      setIsSortDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-muted text-sm rippling-text-sm transition-colors ${
                      sortBy === "recency" ? 'bg-muted font-normal' : ''
                    }`}
                  >
                    Recency
                  </button>
                  <button
                    onClick={() => {
                      if (onSortChange) {
                        onSortChange("dueDate")
                      }
                      setIsSortDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-muted text-sm rippling-text-sm transition-colors ${
                      sortBy === "dueDate" ? 'bg-muted font-normal' : ''
                    }`}
                  >
                    Due Date
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
        )}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Fixed bulk selection row at top of feed */}
          <div className={`flex-shrink-0 px-4 border-b border-border bg-white ${hideHeader ? 'py-3' : 'py-3'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <PebbleCheckbox
                  id="select-all-feed"
                  checked={isAllSelected}
                  indeterminate={isSomeSelected && !isAllSelected}
                  disabled={activeTab === "reviewed" || activeTab === "created" || activeTab === "all"}
                  onChange={() => {
                    handleSelectAllClick()
                  }}
                  appearance="list"
                />
                <label htmlFor="select-all-feed" className="text-sm text-gray-600">
                  {selectedItems.size > 0 ? `${selectedItems.size} selected` : `${sortedApprovals.length} items`}
                </label>
              </div>
              {/* Sort dropdown for split screen view */}
              {page === "inbox" && (
                <div className="relative" ref={sortDropdownRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="h-8 text-sm text-gray-600 gap-2 px-3"
                  >
                    {typeof sortBy === "object" ? (
                      <>
                        {sortBy.column === "requestedOn" && "Requested on"}
                        {sortBy.column === "requestedBy" && "Requested by"}
                        {sortBy.column === "taskType" && "Task type"}
                        {sortBy.column === "dueDate" && "Due date"}
                        {sortBy.column === "reviewedOn" && "Reviewed on"}
                        {sortBy.column === "snoozedUntil" && "Snoozed until"}
                        {sortBy.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      </>
                    ) : (
                      <>
                        {sortBy === "recency" ? "Recency" : "Due Date"}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                  {isSortDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 bg-white shadow-lg z-10 min-w-[180px]">
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "requestedOn", direction: "asc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "requestedOn" && sortBy.direction === "asc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Requested on</span>
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "requestedOn", direction: "desc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "requestedOn" && sortBy.direction === "desc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Requested on</span>
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "requestedBy", direction: "asc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "requestedBy" && sortBy.direction === "asc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Requested by</span>
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "requestedBy", direction: "desc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "requestedBy" && sortBy.direction === "desc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Requested by</span>
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "taskType", direction: "asc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "taskType" && sortBy.direction === "asc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Task type</span>
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "taskType", direction: "desc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "taskType" && sortBy.direction === "desc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Task type</span>
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "dueDate", direction: "asc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "dueDate" && sortBy.direction === "asc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Due date</span>
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "dueDate", direction: "desc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "dueDate" && sortBy.direction === "desc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Due date</span>
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "reviewedOn", direction: "asc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "reviewedOn" && sortBy.direction === "asc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Reviewed on</span>
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "reviewedOn", direction: "desc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "reviewedOn" && sortBy.direction === "desc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Reviewed on</span>
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "snoozedUntil", direction: "asc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "snoozedUntil" && sortBy.direction === "asc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Snoozed until</span>
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (onSortChange) {
                            onSortChange({ column: "snoozedUntil", direction: "desc" })
                          }
                          setIsSortDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 ${
                          typeof sortBy === "object" && sortBy !== null && sortBy.column === "snoozedUntil" && sortBy.direction === "desc" ? 'bg-gray-50 font-normal' : ''
                        }`}
                      >
                        <span>Snoozed until</span>
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
        {groupedApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-normal text-gray-900 mb-2">You&apos;re all caught up!</h3>
              <p className="text-sm text-gray-600">All tasks have been processed.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0 pb-4">
            {groupedApprovals.map((item) => {
              if (item.type === 'group') {
                const isCollapsed = collapsedGroups.has(item.key)
                return (
                  <div
                    key={`group-${item.key}`}
                    onClick={() => toggleGroup(item.key)}
                    className="px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-200 flex items-center gap-2 font-normal"
                  >
                    <ChevronRight className={`h-4 w-4 text-gray-600 transition-transform flex-shrink-0 ${isCollapsed ? '' : 'rotate-90'}`} />
                    <span className="text-sm text-gray-900 font-normal">{item.label}</span>
                    <span className="text-sm text-gray-600">({item.count})</span>
                  </div>
                )
              }
              
              const approval = item.approval
              return (
            <div
              key={approval.id}
              onClick={() => onSelectItem(approval.id)}
              onMouseEnter={activeTab !== "reviewed" && activeTab !== "created" && activeTab !== "all" ? () => setHoveredItem(approval.id) : undefined}
              onMouseLeave={activeTab !== "reviewed" && activeTab !== "created" && activeTab !== "all" ? () => setHoveredItem(null) : undefined}
              className={`p-4 border-b border-border cursor-pointer relative transition-colors ${
                selectedItem === approval.id ? 'bg-[#E3E3E3]' : ''
              }`}
              style={{ backgroundColor: hoveredItem === approval.id && activeTab !== "reviewed" && activeTab !== "created" && activeTab !== "all" ? '#E5E5E5' : (selectedItem === approval.id ? '#E3E3E3' : ((approval as any).isCritical ? '#FFF2EE' : 'white')) }}
            >
              <div className="flex items-start gap-3">
                <PebbleCheckbox
                  checked={selectedItems?.has(approval.id) || false}
                  onChange={(checked) => {
                    onToggleItem(approval.id)
                  }}
                  disabled={activeTab === "reviewed" || activeTab === "created" || activeTab === "all"}
                  appearance="list"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="rippling-text-sm text-foreground" style={{ fontWeight: 500 }}>{approval.requestor}</h3>
                    {(() => {
                      const isCritical = (approval as any).isCritical === true
                      const isExplicitlyPinned = pinnedItems.has(approval.id)
                      const isExplicitlyUnpinned = isCritical && unpinnedCriticalItems.has(approval.id)
                      const isEffectivelyPinned = isExplicitlyPinned || (isCritical && !isExplicitlyUnpinned)
                      return isEffectivelyPinned && (
                        <Pin className="h-3.5 w-3.5 text-gray-500 fill-current" />
                      )
                    })()}
                  </div>
                  <p className="mt-1 text-gray-600" style={{ fontSize: '14px', fontWeight: 400, fontFamily: '"Basel Grotesk"' }}>{approval.subject}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {activeTab !== "reviewed" && 'dueDate' in approval && approval.dueDate && (
                      <span 
                        className="inline-flex flex-row justify-center items-center rounded-full"
                        style={{
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          paddingTop: '0px',
                          paddingBottom: '0px',
                          gap: '4px',
                          position: 'relative',
                          maxWidth: '320px',
                          height: '20px',
                          background: '#E0DEDB',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontFamily: 'Basel Grotesk',
                          fontWeight: 500
                        }}
                      >
                        Due: {approval.dueDate}
                      </span>
                    )}
                    {activeTab === "reviewed" && (
                      <div className="inline-flex items-center gap-1">
                        <div className={`rounded-full shrink-0 ${
                          (approval as any).reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                          (approval as any).reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                          (approval as any).reviewStatus === "Completed" ? "bg-[#2780CE]" :
                          "bg-gray-400"
                        }`} style={{ width: '8px', height: '8px' }} />
                        <span className="text-sm text-gray-900">
                          {(approval as any).reviewStatus || '--'}
                        </span>
                      </div>
                    )}
                    {'warning' in approval && approval.warning && (
                      <span 
                        className="inline-flex flex-row justify-center items-center rounded-full"
                        style={{
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          paddingTop: '0px',
                          paddingBottom: '0px',
                          gap: '4px',
                          position: 'relative',
                          maxWidth: '320px',
                          height: '20px',
                          background: '#FBE0B5',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontFamily: 'Basel Grotesk',
                          fontWeight: 500
                        }}
                      >
                        {approval.warning}
                      </span>
                    )}
                    {(approval as any).isCritical && (
                      <span 
                        className="inline-flex flex-row justify-center items-center rounded-full"
                        style={{
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          paddingTop: '0px',
                          paddingBottom: '0px',
                          gap: '4px',
                          position: 'relative',
                          maxWidth: '320px',
                          height: '20px',
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
                  <div className="flex items-center justify-between mt-2">
                    <span className="rippling-text-xs text-muted-foreground truncate max-w-[200px]">{getDisplayCategory(approval.category)}</span>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="rippling-text-xs text-muted-foreground whitespace-nowrap">{'requestedOn' in approval && approval.requestedOn ? approval.requestedOn : approval.time}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {(() => {
                const isCritical = (approval as any).isCritical === true
                const isExplicitlyPinned = pinnedItems.has(approval.id)
                const isExplicitlyUnpinned = isCritical && unpinnedCriticalItems.has(approval.id)
                const isEffectivelyPinned = isExplicitlyPinned || (isCritical && !isExplicitlyUnpinned)
                const shouldShowPin = hoveredItem === approval.id || isEffectivelyPinned
                
                if (!shouldShowPin || activeTab === "reviewed" || activeTab === "created" || activeTab === "all") {
                  return null
                }
                
                return (
                  <div className="absolute top-2 right-2 flex gap-1">
                    {onTogglePin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`rippling-btn-ghost h-6 w-6 ${isEffectivelyPinned ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTogglePin(approval.id, isCritical)
                        }}
                        title={isEffectivelyPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className={`h-3 w-3 ${isEffectivelyPinned ? 'text-gray-700 fill-current' : 'text-gray-500'}`} />
                      </Button>
                    )}
                    {(approval.category === "Training" || approval.category === "Documents" || approval.category === "Miscellaneous") ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rippling-btn-ghost h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onRemoveItem) {
                            onRemoveItem(approval.id)
                          }
                        }}
                        title="Mark as done"
                      >
                        <Archive className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rippling-btn-ghost h-6 w-6 hover:bg-success/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onRemoveItem) {
                              onRemoveItem(approval.id)
                            }
                          }}
                          title="Approve"
                        >
                          <Check className="h-3 w-3 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rippling-btn-ghost h-6 w-6 hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onRemoveItem) {
                              onRemoveItem(approval.id)
                            }
                          }}
                          title="Reject"
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                )
              })()}
              
              {'comments' in approval && approval.comments && approval.comments.length > 0 && (
                <div className={`absolute top-4 right-4 ${hoveredItem === approval.id ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                         <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              
              {'trip' in approval && approval.trip && approval.trip.linked && (
                <div className={`absolute top-4 right-8 ${hoveredItem === approval.id ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                         <Plane className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          )
            })}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  )
}

