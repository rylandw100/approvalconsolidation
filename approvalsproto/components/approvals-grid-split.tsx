"use client"

import { ApprovalsList } from "./approvals-list"
import { generateApprovalData } from "@/lib/approval-data"
import { ApprovalsGrid } from "./approvals-grid"
import { ApprovalDetail } from "./approval-detail"
import { AIPanel } from "./ai-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, Filter, LayoutGrid, List, PanelLeft, Menu, ChevronLeft, ChevronRight, Maximize2, Minimize2, MoreVertical } from "lucide-react"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

interface ApprovalsGridWithSplitProps {
  selectedItem: number | null
  onSelectItem: (id: number | null) => void
  selectedItems: Set<number>
  onToggleItem: (id: number) => void
  onSelectAll: (filteredIds: number[]) => void
  onClearSelection: () => void
  onFilterChange: (filteredIds: number[]) => void
  onOpenDrawer: (id: number) => void
  onOpenAIPanel?: (requestContext?: any) => void
  onCloseDrawer?: () => void
  drawerViewModeChange?: (handler: (mode: "full-width" | "split") => void) => void
  drawerOpen?: boolean
  removedItems?: Set<number>
  onRemoveItem?: (id: number) => void
  onRemoveItems?: (ids: number[]) => void
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  onMarkAsDone?: (id: number) => void
  page?: "tasks" | "inbox" | "reimbursements" | "approvals"
  pinnedItems?: Set<number>
  onTogglePin?: (id: number, isCritical?: boolean) => void
  unpinnedCriticalItems?: Set<number>
  activeTab?: string
  onTabChange?: (tab: string) => void
  pendingCount?: number
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  snoozedItems?: Set<number> | Map<number, Date>
  onSnooze?: (id: number, snoozeUntil: Date) => void
  aiPanelOpen?: boolean
  onCloseAIPanel?: () => void
  onToggleVerticalTabs?: () => void
  isVerticalTabsCollapsed?: boolean
  onCategoryCountsChange?: (counts: Record<string, number>) => void
  onViewModeChange?: (mode: "full-width" | "split") => void
  onNavigateToPage?: (page: "tasks" | "inbox" | "reimbursements" | "approvals") => void
  onExpandedChange?: (isExpanded: boolean) => void
}

export function ApprovalsGridWithSplit({
  selectedItem,
  onSelectItem,
  selectedItems,
  onToggleItem,
  onSelectAll,
  onClearSelection,
  onFilterChange,
  onOpenDrawer,
  onOpenAIPanel,
  onCloseDrawer,
  drawerViewModeChange,
  drawerOpen = false,
  removedItems = new Set(),
  onRemoveItem,
  onRemoveItems,
  onApprove,
  onReject,
  onMarkAsDone,
  page = "tasks",
  pinnedItems = new Set(),
  onTogglePin,
  unpinnedCriticalItems = new Set(),
  activeTab,
  onTabChange,
  pendingCount,
  selectedCategory: externalSelectedCategory,
  onCategoryChange: externalOnCategoryChange,
  snoozedItems = new Set() as Set<number> | Map<number, Date>,
  onSnooze,
  aiPanelOpen = false,
  onCloseAIPanel,
  onToggleVerticalTabs,
  isVerticalTabsCollapsed = false,
  onCategoryCountsChange,
  onViewModeChange: externalOnViewModeChange,
  onNavigateToPage,
  onExpandedChange
}: ApprovalsGridWithSplitProps) {
  const [viewMode, setViewMode] = useState<"full-width" | "split">("full-width")
  const [aiPanelRequestContext, setAIPanelRequestContext] = useState<any>(null)
  
  // Notify parent when viewMode changes
  useEffect(() => {
    if (externalOnViewModeChange) {
      externalOnViewModeChange(viewMode)
    }
  }, [viewMode, externalOnViewModeChange])
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Notify parent when expanded state changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isExpanded)
    }
  }, [isExpanded, onExpandedChange])
  
  const handleExpandToDrawer = () => {
    if (selectedItem) {
      setViewMode("full-width")
      onOpenDrawer(selectedItem)
    }
  }
  
  const handleViewModeChange = (mode: "full-width" | "split") => {
    const prevMode = viewMode
    setViewMode(mode)
    
    // When switching from split to full-width, clear selectedItem so inline detail doesn't show
    if (prevMode === "split" && mode === "full-width") {
      onSelectItem(null)
    }
    
    // When switching from full-width (grid) to split, select the first item if none is selected
    if (prevMode === "full-width" && mode === "split") {
      if (!selectedItem && filteredIds.length > 0) {
        onSelectItem(filteredIds[0])
      }
    }
    
    // When collapsing from full-width to split, close drawer if open
    // But preserve selectedItem so it shows in the split view
    // We need to close the drawer but NOT clear selectedItem
    if (mode === "split" && prevMode === "full-width" && drawerOpen && onCloseDrawer) {
      // When collapsing from drawer to split, we want to preserve selectedItem
      // The selectedItem should already be set by the layout's onViewModeChange handler
      // Just close the drawer - don't let it clear selectedItem
      // We'll handle closing the drawer state directly here to avoid clearing selectedItem
      // Actually, we need to call onCloseDrawer but the layout should preserve selectedItem
      onCloseDrawer()
    }
    // When collapsing from full-width inline detail to split, preserve selectedItem
    // The selectedItem should remain set so it shows in the split view
    // Don't clear selectedItem when collapsing - it should be preserved
  }
  
  // Expose view mode change handler to parent (for drawer to call)
  useEffect(() => {
    if (drawerViewModeChange) {
      const handleDrawerModeChange = (mode: "full-width" | "split") => {
        // Use the main handleViewModeChange to ensure all logic is applied correctly
        // This will preserve selectedItem when collapsing from drawer to split
        handleViewModeChange(mode)
      }
      drawerViewModeChange(handleDrawerModeChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerViewModeChange])
  
  // In full-width mode, we show details inline instead of in a drawer
  // No need to open drawer when item is selected
  const [filteredIds, setFilteredIds] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>(externalSelectedCategory || "All")
  
  // Update internal state when external prop changes
  useEffect(() => {
    if (externalSelectedCategory !== undefined) {
      setSelectedCategory(externalSelectedCategory)
    }
  }, [externalSelectedCategory])
  const [sortBy, setSortBy] = useState<{ column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" }>({ column: "requestedOn", direction: "asc" })
  
  // Update sortBy when activeTab changes to set defaults
  useEffect(() => {
    if (activeTab === "reviewed") {
      setSortBy({ column: "reviewedOn", direction: "desc" })
    } else if (activeTab === "snoozed") {
      setSortBy({ column: "snoozedUntil", direction: "asc" })
    } else if (activeTab === "pending" || activeTab === "created" || activeTab === "all") {
      setSortBy({ column: "requestedOn", direction: "asc" })
    }
  }, [activeTab])
  const [groupBy, setGroupBy] = useState<"none" | "requestor" | "type">("none")
  
  // Saved Views state management
  type Filter = {
    id: string
    field: string
    operator: "equals" | "contains" | "before" | "after" | "is" | "isNot"
    value: string | string[] | Date | null
  }
  
  interface SavedView {
    id: string
    name: string
    lastModified: Date
    config: {
      category: string
      sortBy: { column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" }
      groupBy: "none" | "requestor" | "type"
      viewMode: "full-width" | "split"
      filters?: Filter[]
    }
  }
  
  const [savedViews, setSavedViews] = useState<SavedView[]>(() => {
    if (typeof window !== 'undefined' && (page === "inbox" || page === "reimbursements" || page === "approvals")) {
      const storageKey = page === "reimbursements" ? 'reimbursements-saved-views' : page === "approvals" ? 'approvals-saved-views' : 'inbox-saved-views'
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored).map((v: any) => ({ ...v, lastModified: new Date(v.lastModified) })) : []
    }
    return []
  })
  
  const [currentViewId, setCurrentViewId] = useState<string>("default")
  const [savedConfig, setSavedConfig] = useState<SavedView['config'] | null>(null)
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [isViewsDropdownOpen, setIsViewsDropdownOpen] = useState(false)
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false)
  const [isSaveAsNewModalOpen, setIsSaveAsNewModalOpen] = useState(false)
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false)
  const [newViewName, setNewViewName] = useState("")
  const viewsDropdownRef = useRef<HTMLDivElement>(null)
  const moreActionsRef = useRef<HTMLDivElement>(null)
  
  // Reset view state and reload saved views when page changes
  useEffect(() => {
    // Reload saved views for the new page
    if (typeof window !== 'undefined' && (page === "inbox" || page === "reimbursements" || page === "approvals")) {
      const storageKey = page === "reimbursements" ? 'reimbursements-saved-views' : page === "approvals" ? 'approvals-saved-views' : 'inbox-saved-views'
      const stored = localStorage.getItem(storageKey)
      const loadedViews = stored ? JSON.parse(stored).map((v: any) => ({ ...v, lastModified: new Date(v.lastModified) })) : []
      setSavedViews(loadedViews)
    }
    // Reset view state to default
    setCurrentViewId("default")
    setSavedConfig(null)
    setActiveFilters([])
  }, [page])
  
  // Initialize filters from saved config if loading a saved view
  useEffect(() => {
    if (currentViewId !== "default" && savedConfig) {
      setActiveFilters(savedConfig.filters || [])
    } else if (currentViewId === "default") {
      setActiveFilters([])
    }
  }, [currentViewId, savedConfig])
  
  // Save views to localStorage
  useEffect(() => {
    if ((page === "inbox" || page === "reimbursements" || page === "approvals") && typeof window !== 'undefined') {
      const storageKey = page === "reimbursements" ? 'reimbursements-saved-views' : page === "approvals" ? 'approvals-saved-views' : 'inbox-saved-views'
      localStorage.setItem(storageKey, JSON.stringify(savedViews))
    }
  }, [savedViews, page])
  
  // Get current view config
  const getCurrentConfig = (): SavedView['config'] => ({
    category: selectedCategory,
    sortBy,
    groupBy,
    viewMode,
    filters: activeFilters
  })
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (currentViewId === "default") {
      // For default view, check if any non-default values exist
      // Default category depends on the page
      const defaultCategory = page === "reimbursements" ? "Reimbursements" : page === "approvals" ? "All" : "All"
      const defaultConfig: SavedView['config'] = {
        category: defaultCategory,
        sortBy: { column: "requestedOn", direction: "asc" },
        groupBy: "none",
        viewMode: "full-width",
        filters: []
      }
      const current = getCurrentConfig()
      return JSON.stringify(current) !== JSON.stringify(defaultConfig)
    } else {
      // For saved view, compare with saved config
      if (!savedConfig) return false
      const current = getCurrentConfig()
      return JSON.stringify(current) !== JSON.stringify(savedConfig)
    }
  }
  
  // Save current view
  const handleSave = () => {
    if (currentViewId === "default" || !savedConfig) return
    
    const updatedViews = savedViews.map(view => {
      if (view.id === currentViewId) {
        return {
          ...view,
          config: getCurrentConfig(),
          lastModified: new Date()
        }
      }
      return view
    })
    setSavedViews(updatedViews)
    setSavedConfig(getCurrentConfig())
  }
  
  // Save as new view
  const handleSaveAsNew = () => {
    if (!newViewName.trim()) return
    
    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name: newViewName.trim(),
      lastModified: new Date(),
      config: getCurrentConfig()
    }
    
    setSavedViews([...savedViews, newView])
    setCurrentViewId(newView.id)
    setSavedConfig(newView.config)
    setIsSaveAsNewModalOpen(false)
    setNewViewName("")
  }
  
  // Discard changes
  const handleDiscardChanges = () => {
    if (currentViewId === "default") {
      // Restore default config based on page
      const defaultCategory = page === "reimbursements" ? "Reimbursements" : "All"
      handleCategoryChange(defaultCategory)
      setSortBy({ column: "requestedOn", direction: "asc" })
      setGroupBy("none")
      handleViewModeChange("full-width")
      setActiveFilters([])
    } else {
      // Restore saved config
      if (savedConfig) {
        handleCategoryChange(savedConfig.category)
        setSortBy(savedConfig.sortBy)
        setGroupBy(savedConfig.groupBy)
        handleViewModeChange(savedConfig.viewMode)
        setActiveFilters(savedConfig.filters || [])
      }
    }
  }
  
  // Remove view
  const handleRemove = () => {
    if (currentViewId === "default") return
    
    const updatedViews = savedViews.filter(view => view.id !== currentViewId)
    setSavedViews(updatedViews)
    setCurrentViewId("default")
    setSavedConfig(null)
    handleDiscardChanges() // Restore default
    setIsRemoveModalOpen(false)
  }
  
  // Switch to a view
  const handleSwitchView = (viewId: string) => {
    if (viewId === "default") {
      setCurrentViewId("default")
      setSavedConfig(null)
      // Default category depends on the page
      const defaultCategory = page === "reimbursements" ? "Reimbursements" : "All"
      handleCategoryChange(defaultCategory)
      setSortBy({ column: "requestedOn", direction: "asc" })
      setGroupBy("none")
      handleViewModeChange("full-width")
      setActiveFilters([])
    } else {
      const view = savedViews.find(v => v.id === viewId)
      if (view) {
        setCurrentViewId(view.id)
        setSavedConfig(view.config)
        handleCategoryChange(view.config.category)
        setSortBy(view.config.sortBy)
        setGroupBy(view.config.groupBy)
        handleViewModeChange(view.config.viewMode)
        setActiveFilters(view.config.filters || [])
      }
    }
    setIsViewsDropdownOpen(false)
  }
  
  // Track changes to update savedConfig when switching views
  useEffect(() => {
    if (currentViewId !== "default") {
      const view = savedViews.find(v => v.id === currentViewId)
      if (view) {
        setSavedConfig(view.config)
      }
    } else {
      setSavedConfig(null)
    }
  }, [currentViewId, savedViews])
  
  // Get current view name
  const getCurrentViewName = () => {
    if (currentViewId === "default") return "Default"
    const view = savedViews.find(v => v.id === currentViewId)
    return view ? view.name : "Default"
  }
  
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [isGroupByDropdownOpen, setIsGroupByDropdownOpen] = useState(false)
  const [isPendingDropdownOpen, setIsPendingDropdownOpen] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)
  const sortDropdownRef = useRef<HTMLDivElement>(null)
  const groupByDropdownRef = useRef<HTMLDivElement>(null)
  const pendingDropdownRef = useRef<HTMLDivElement>(null)
  const [filterStep, setFilterStep] = useState<"field" | "operator" | "value">("field")
  const [currentFilterField, setCurrentFilterField] = useState<string | null>(null)
  const [currentFilterOperator, setCurrentFilterOperator] = useState<string | null>(null)
  const [tempFilterValue, setTempFilterValue] = useState<string>("")

  // Use shared approval data generation
  const approvalData = useMemo(() => generateApprovalData(), [])

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
      dueDate: "Jan 25, 2025",
      summary: "Please review and sign the updated Employee Handbook 2024. This document contains important policy updates regarding remote work, benefits, and code of conduct."
    },
    {
      id: 103,
      requestor: "Finance Team",
      subject: "Complete quarterly compliance training",
      category: "Training",
      time: "1 day ago",
      requestedOn: "Jan 15, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Finance Team",
      courseName: "Q4 Compliance Training",
      dueDate: "Jan 30, 2025",
      estimatedDuration: "2 hours",
      summary: "Complete the mandatory Q4 compliance training covering anti-money laundering, data privacy, and financial regulations."
    },
    {
      id: 104,
      requestor: "Operations",
      subject: "Team building event: Q1 planning session",
      category: "Miscellaneous",
      time: "2 days ago",
      requestedOn: "Jan 14, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Operations",
      eventName: "Q1 Planning Session",
      dueDate: "Jan 28, 2025",
      location: "Conference Room A",
      summary: "Join the Q1 planning session team building event. This is an opportunity to collaborate with your team and plan for the upcoming quarter."
    },
    {
      id: 112,
      requestor: "Payroll Team",
      subject: "Payroll",
      category: "Payroll",
      time: "just now",
      requestedOn: "Jan 20, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Payroll Team",
      isCritical: true,
      pinned: true,
      entity: "Acme Corp",
      filing: "Quarterly Tax Filing",
      agency: "IRS",
      accountNumber: null,
      dueDate: "Jan 25, 2025"
    },
    {
      id: 113,
      requestor: "Payroll Team",
      subject: "Payroll - Q4 adjustments",
      category: "Payroll",
      time: "1 hour ago",
      requestedOn: "Jan 10, 2025",
      status: "pending",
      itemStatus: "Pending",
      isSnoozed: false,
      createdBy: "Payroll Team",
      isCritical: true,
      entity: "Acme Corp",
      filing: "Quarterly Tax Filing",
      agency: "IRS",
      accountNumber: "123456789",
      dueDate: "Jan 22, 2025"
    },
    // Reviewed tasks
    {
      id: 105,
      requestor: "HR Team",
      subject: "Complete annual diversity and inclusion training",
      category: "Training",
      time: "3 days ago",
      requestedOn: "Jan 12, 2025",
      status: "reviewed",
      reviewStatus: "Approved",
      itemStatus: "Completed",
      isSnoozed: false,
      createdBy: "HR Team",
      courseName: "Diversity and Inclusion",
      dueDate: "Jan 20, 2025",
      estimatedDuration: "1.5 hours",
      reviewedOn: "Jan 16, 2025"
    },
    {
      id: 106,
      requestor: "Legal Department",
      subject: "Sign NDA for new client engagement",
      category: "Documents",
      time: "4 days ago",
      requestedOn: "Jan 11, 2025",
      status: "reviewed",
      reviewStatus: "Approved",
      itemStatus: "Completed",
      isSnoozed: false,
      createdBy: "Legal Department",
      documentName: "NDA - Client Engagement",
      dueDate: "Jan 18, 2025",
      reviewedOn: "Jan 15, 2025"
    }
  ], [])

  // Track filtered IDs for bulk selection calculation - memoize to prevent infinite loops
  const handleFilterChange = useCallback((ids: number[]) => {
    setFilteredIds(ids)
    onFilterChange(ids)
  }, [onFilterChange])

  // Function to select the next item in the queue
  const handleSelectNextItem = () => {
    if (selectedItem && filteredIds.length > 0) {
      const currentIndex = filteredIds.indexOf(selectedItem)
      if (currentIndex !== -1 && currentIndex < filteredIds.length - 1) {
        // Select the next item
        const nextItem = filteredIds[currentIndex + 1]
        onSelectItem(nextItem)
      } else if (currentIndex !== -1 && currentIndex === filteredIds.length - 1 && filteredIds.length > 1) {
        // If it's the last item, select the previous one (since current will be removed)
        const prevItem = filteredIds[currentIndex - 1]
        onSelectItem(prevItem)
      } else {
        // No more items, clear selection
        onSelectItem(null)
      }
    }
  }

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false)
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false)
      }
      if (groupByDropdownRef.current && !groupByDropdownRef.current.contains(event.target as Node)) {
        setIsGroupByDropdownOpen(false)
      }
      if (viewsDropdownRef.current && !viewsDropdownRef.current.contains(event.target as Node)) {
        setIsViewsDropdownOpen(false)
      }
      if (moreActionsRef.current && !moreActionsRef.current.contains(event.target as Node)) {
        setIsMoreActionsOpen(false)
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

  const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedItems.has(id))
  const isSomeSelected = filteredIds.some(id => selectedItems.has(id))

  const handleSelectAllClick = () => {
    if (isAllSelected) {
      onClearSelection()
    } else {
      onSelectAll(filteredIds)
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const categories = ["All", "Approvals", "HR Management", "Reimbursements", "Time and Attendance", "Training", "Documents", "Miscellaneous"]
  
  const getCategoryMatch = (category: string, selectedCategory: string) => {
    if (selectedCategory === "All") return true
    if (selectedCategory === "Approvals" || selectedCategory === "Approvals - All") {
      return category.startsWith("Approvals -")
    }
    if (selectedCategory === "Tasks") {
      // Tasks includes Documents, Training, and Miscellaneous
      return category === "Documents" || category === "Training" || category === "Miscellaneous"
    }
    if (selectedCategory === "Trainings") {
      // Handle "Trainings" label but match "Training" category
      return category === "Training"
    }
    if (selectedCategory === "HR Management" || selectedCategory === "Reimbursements" || selectedCategory === "Time and Attendance") {
      return category === `Approvals - ${selectedCategory}` || category === selectedCategory
    }
    return category === selectedCategory
  }

  const getCategoryDisplayName = (category: string) => {
    // Map category values to display names
    if (category === "Training") {
      return "Learning Management"
    }
    return category
  }

  // Alias variables to match ApprovalsGrid header structure
  const requestTypes = categories
  const requestTypeDropdownRef = filterDropdownRef
  const isRequestTypeDropdownOpen = isFilterDropdownOpen
  const setIsRequestTypeDropdownOpen = setIsFilterDropdownOpen
  const selectedRequestType = selectedCategory
  const getDisplayCategory = getCategoryDisplayName
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    if (externalOnCategoryChange) {
      externalOnCategoryChange(category)
    }
  }
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }
  
  const handleSortChange = (sortByParam: { column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" } | "recency" | "dueDate") => {
    if (typeof sortByParam === "object") {
      setSortBy(sortByParam)
    } else {
      // Legacy format - convert to new format
      if (sortByParam === "dueDate") {
        setSortBy({ column: "dueDate", direction: "asc" })
      } else {
        setSortBy({ column: "requestedOn", direction: "asc" })
      }
    }
  }
  
  // For item count, use filteredIds.length
  const sortedApprovalsLength = filteredIds.length

  const renderContent = () => {
    // Calculate height: 100vh - top nav (56px) - margins (48px = 24px top + 24px bottom)
    // For reimbursements and approvals pages, also subtract header height (122px: includes title and tabs)
    // For expanded approvals/reimbursements, use full viewport height with 24px margins
    const headerHeight = (page === "reimbursements" || page === "approvals") ? 122 : 0
    const isExpandedApprovals = isExpanded && page === "approvals"
    const isExpandedReimbursements = isExpanded && page === "reimbursements"
    const heightCalc = (isExpandedApprovals || isExpandedReimbursements) ? 'calc(100vh - 48px)' : `calc(100vh - 56px - 48px - ${headerHeight}px)`
    const marginLeft = isExpandedReimbursements ? '24px' : (page === "reimbursements" ? '64px' : '24px')
    const marginRight = isExpandedApprovals ? '24px' : isExpandedReimbursements ? '24px' : (page === "approvals" ? '64px' : (page === "reimbursements" ? '64px' : '24px'))
    const widthCalc = (isExpandedApprovals || isExpandedReimbursements) ? 'calc(100% - 48px)' : (page === "reimbursements" ? 'calc(100% - 128px)' : page === "approvals" ? 'calc(100% - 88px)' : 'calc(100% - 48px)')
    const backgroundColor = isExpandedReimbursements ? '#F9F7F6' : undefined
    return (
    <div className={`flex flex-col overflow-hidden ${isExpanded && aiPanelOpen ? 'w-[70%] flex-shrink-0' : 'flex-1 w-full'}`} style={{ marginTop: '24px', marginBottom: '24px', marginLeft, marginRight, height: heightCalc, maxHeight: heightCalc, width: widthCalc, maxWidth: widthCalc, backgroundColor }}>
      {/* Content */}
      {viewMode === "full-width" ? (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {selectedItem ? (
            // Show details when item is selected
            <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${isExpanded && aiPanelOpen ? 'w-[70%]' : ''}`} style={{ gap: '16px', backgroundColor: '#F9F7F6' }}>
              {/* Back button and navigation outside the frame */}
              <div className="flex-shrink-0 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onSelectItem) {
                      onSelectItem(null)
                    }
                  }}
                  className="h-8 px-2 gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                {filteredIds.length > 0 && selectedItem && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Request {filteredIds.indexOf(selectedItem) + 1} of {filteredIds.length}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const currentIndex = filteredIds.indexOf(selectedItem)
                          if (currentIndex > 0 && onSelectItem) {
                            onSelectItem(filteredIds[currentIndex - 1])
                          }
                        }}
                        disabled={filteredIds.indexOf(selectedItem) === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          const currentIndex = filteredIds.indexOf(selectedItem)
                          if (currentIndex < filteredIds.length - 1 && onSelectItem) {
                            onSelectItem(filteredIds[currentIndex + 1])
                          }
                        }}
                        disabled={filteredIds.indexOf(selectedItem) === filteredIds.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {/* Details frame matching grid dimensions - should have 24px from bottom of screen */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white rounded-[16px] border border-gray-200">
                <ApprovalDetail 
                  selectedItem={selectedItem} 
                  selectedItems={selectedItems}
                  onClearSelection={onClearSelection}
                  removedItems={removedItems}
                  onRemoveItem={onRemoveItem}
                  onRemoveItems={onRemoveItems}
                  onApprove={onApprove}
                  onReject={onReject}
                  onMarkAsDone={onMarkAsDone}
                  page={page}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  onExpandToDrawer={handleExpandToDrawer}
                  onSelectNextItem={handleSelectNextItem}
                  activeTab={activeTab}
                  onOpenAIPanel={onOpenAIPanel}
                  onSelectItem={onSelectItem}
                  backgroundColor="white"
                  onSnooze={onSnooze}
                />
              </div>
            </div>
          ) : (
            // Show grid when no item is selected
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <ApprovalsGrid
                selectedItems={selectedItems}
                onToggleItem={onToggleItem}
                onSelectAll={onSelectAll}
                onClearSelection={onClearSelection}
                onOpenDrawer={onOpenDrawer}
                removedItems={removedItems}
                onRemoveItem={onRemoveItem}
                onRemoveItems={onRemoveItems}
                onApprove={onApprove}
                onReject={onReject}
                onMarkAsDone={onMarkAsDone}
                page={page}
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
                externalSearchQuery={searchQuery}
                externalSelectedCategory={selectedCategory}
                onSearchChange={setSearchQuery}
                onCategoryChange={setSelectedCategory}
                selectedItem={selectedItem}
                onSelectItem={onSelectItem}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                pinnedItems={pinnedItems}
                unpinnedCriticalItems={unpinnedCriticalItems}
                snoozedItems={snoozedItems}
                onSnooze={onSnooze}
                onTogglePin={onTogglePin}
                onFilteredIdsChange={setFilteredIds}
                onCategoryCountsChange={onCategoryCountsChange}
                groupBy={groupBy}
                onGroupByChange={setGroupBy}
                activeTab={activeTab}
                onTabChange={onTabChange}
                pendingCount={pendingCount}
                onExpand={() => setIsExpanded(!isExpanded)}
                isExpanded={isExpanded}
                aiPanelOpen={aiPanelOpen}
                savedViews={savedViews}
                currentViewId={currentViewId}
                onSwitchView={handleSwitchView}
                onSaveView={handleSave}
                onSaveAsNewView={() => setIsSaveAsNewModalOpen(true)}
                onDiscardChanges={handleDiscardChanges}
                onRemoveView={() => {
                  if (currentViewId !== "default") {
                    setIsRemoveModalOpen(true)
                  }
                }}
                hasUnsavedChanges={hasUnsavedChanges}
                getCurrentViewName={getCurrentViewName}
                isViewsDropdownOpen={isViewsDropdownOpen}
                onToggleViewsDropdown={setIsViewsDropdownOpen}
                isMoreActionsOpen={isMoreActionsOpen}
                onToggleMoreActions={setIsMoreActionsOpen}
                viewsDropdownRef={viewsDropdownRef}
                moreActionsRef={moreActionsRef}
                externalFilters={activeFilters}
                onFiltersChange={setActiveFilters}
                onNavigateToPage={onNavigateToPage}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col bg-white overflow-hidden flex-1" style={{ height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div className="flex flex-col flex-1 min-h-0" style={{ backgroundColor: '#F9F7F6', height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 0 }}>
            <div className={`${viewMode === "split" ? 'overflow-visible' : 'overflow-hidden'} min-w-full flex flex-col ${viewMode === "split" ? '' : 'bg-white flex-1 min-h-0'}`} style={viewMode === "split" ? { display: 'flex', flexDirection: 'column', gap: 0, margin: 0, padding: 0, overflow: 'visible' } : { height: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header with bulk selection, search, filter, sort, and view mode - Inside the table frame */}
              <div className="flex-shrink-0 relative z-50" style={{ paddingBottom: '16px', isolation: 'isolate', overflow: 'visible' }}>
                {/* Single row: Bulk Selection on left, Search, Filter, Sort, and View Mode on right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {viewMode === undefined && (
                      <h2 className="text-base font-normal text-gray-900 mr-3">Needs my review</h2>
                    )}
                    {(page === "inbox" || page === "approvals") && (viewMode === "split" || viewMode === "full-width") ? (
                      // Show search bar when in split view or full-width view for inbox
                      <div className={`relative w-[339px] flex items-center border border-input bg-background rounded-[8px] h-[40px] px-3`}>
                        <Search className="h-4 w-4 text-gray-400 flex-shrink-0 mr-2" />
                        <input
                          type="text"
                          placeholder="Search..."
                          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground h-full"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-gray-100 flex-shrink-0 ml-2"
                            onClick={() => handleSearchChange("")}
                          >
                            <X className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        )}
                      </div>
                    ) : viewMode === "split" || (page === "reimbursements" && viewMode === "full-width") ? (
                      // Show search bar when in split view for other pages, or for reimbursements in split/full-width
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
                        <div className={`relative ${page === "reimbursements" ? "w-[280px]" : "w-[339px]"} flex items-center border border-input bg-background rounded-[8px] h-[40px] px-3`}>
                        <Search className="h-4 w-4 text-gray-400 flex-shrink-0 mr-2" />
                        <input
                          type="text"
                          placeholder="Search..."
                          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground h-full"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                        />
                        {searchQuery && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-gray-100 flex-shrink-0 ml-2"
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
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-[1000] min-w-[200px]" style={{ position: 'absolute', zIndex: 1000 }}>
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
                                      className={`w-full text-left px-4 py-2 hover:bg-muted text-sm rippling-text-sm transition-colors ${
                                        selectedRequestType === "HR Management" ? 'bg-gray-50' : ''
                                      }`}
                                    >
                                      HR Management
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleCategoryChange("Reimbursements")
                                        setIsRequestTypeDropdownOpen(false)
                                      }}
                                      className={`w-full text-left px-4 py-2 hover:bg-muted text-sm rippling-text-sm transition-colors ${
                                        selectedRequestType === "Reimbursements" ? 'bg-gray-50' : ''
                                      }`}
                                    >
                                      Reimbursements
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleCategoryChange("Time and Attendance")
                                        setIsRequestTypeDropdownOpen(false)
                                      }}
                                      className={`w-full text-left px-4 py-2 hover:bg-muted text-sm rippling-text-sm transition-colors ${
                                        selectedRequestType === "Time and Attendance" ? 'bg-gray-50' : ''
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
                              handleCategoryChange(type)
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
                    <div className="relative z-50" ref={groupByDropdownRef}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsGroupByDropdownOpen(!isGroupByDropdownOpen)}
                        className="h-[40px] text-sm gap-2 px-3 rounded-[8px]"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      {isGroupByDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-[1000] min-w-[200px]" style={{ position: 'absolute', zIndex: 1000 }}>
                          <div className="p-2">
                            <div className="text-xs font-medium text-gray-700 px-2 py-1.5 mb-1">Group by</div>
                          <button
                            onClick={() => {
                              setGroupBy("none")
                              setIsGroupByDropdownOpen(false)
                            }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                          >
                            None
                          </button>
                          <button
                            onClick={() => {
                              setGroupBy("requestor")
                              setIsGroupByDropdownOpen(false)
                            }}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded"
                          >
                            Requestor
                          </button>
                          <button
                            onClick={() => {
                              setGroupBy("type")
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
                    <div className="relative z-50" ref={filterDropdownRef}>
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
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-[1000] min-w-[280px] max-h-[400px] overflow-y-auto" style={{ position: 'absolute', zIndex: 1000 }}>
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
                                    // Get unique values for the current filter field from all approvals
                                    const values = new Set<string>()
                                    // We need to get approvals from the ApprovalsList component's data
                                    // For now, we'll use a combination of approvalData and taskData
                                    const allDataForValues = [...approvalData, ...taskData]
                                    allDataForValues.forEach(approval => {
                                      switch (currentFilterField) {
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
                                    return (
                                      <div className="max-h-60 overflow-y-auto">
                                        {Array.from(values).sort().map(value => (
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
                                        ))}
                                      </div>
                                    )
                                  })()
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {viewMode !== undefined && handleViewModeChange && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentMode = viewMode as "full-width" | "split"
                            handleViewModeChange(currentMode === "full-width" ? "split" : "full-width")
                          }}
                          className="h-[40px] px-4 gap-2 rounded-[8px]"
                          title={(viewMode as "full-width" | "split") === "full-width" ? "Switch to split screen" : "Switch to full-width"}
                        >
                          {(viewMode as "full-width" | "split") === "full-width" ? (
                            <PanelLeft className="h-4 w-4" />
                          ) : (
                            <Menu className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {(viewMode as "full-width" | "split") === "full-width" ? "Split" : "No split"}
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
                          <div className="relative z-50" ref={viewsDropdownRef}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsViewsDropdownOpen(!isViewsDropdownOpen)}
                              className="h-[40px] px-3 gap-2 rounded-[8px]"
                            >
                              <span className="text-sm">Viewing: {getCurrentViewName()}</span>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                            {isViewsDropdownOpen && (
                              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-[1000] min-w-[200px]" style={{ position: 'absolute', zIndex: 1000 }}>
                                <button
                                  onClick={() => handleSwitchView("default")}
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 text-sm ${
                                    currentViewId === "default" ? 'bg-gray-50 font-normal' : ''
                                  }`}
                                >
                                  <div className="font-normal">Default</div>
                                </button>
                                {savedViews.map((view) => (
                                  <button
                                    key={view.id}
                                    onClick={() => handleSwitchView(view.id)}
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
                          {/* More Actions Button */}
                          <div className="relative" ref={moreActionsRef}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
                              className="h-[40px] w-[40px] p-0 relative rounded-[8px]"
                              title="View actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                              {hasUnsavedChanges() && (
                                <span className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-white" style={{ background: '#7A005D' }}></span>
                              )}
                            </Button>
                            {isMoreActionsOpen && (
                              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg z-[1000] min-w-[180px]" style={{ position: 'absolute', zIndex: 1000 }}>
                                <button
                                  onClick={() => {
                                    setIsMoreActionsOpen(false)
                                    handleSave()
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
                                    setIsMoreActionsOpen(false)
                                    setIsSaveAsNewModalOpen(true)
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                >
                                  Save as new
                                </button>
                                <button
                                  onClick={() => {
                                    setIsMoreActionsOpen(false)
                                    handleDiscardChanges()
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
                                    setIsMoreActionsOpen(false)
                                    if (currentViewId !== "default") {
                                      setIsRemoveModalOpen(true)
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
                          {/* View all tasks button - on reimbursements and approvals pages */}
                          {(page === "reimbursements" || page === "approvals") && (
                            <>
                              <div className="h-8 w-px bg-gray-300 mx-3"></div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (onNavigateToPage) {
                                    onNavigateToPage("inbox")
                                  }
                                }}
                                className="h-[40px] px-3 gap-2 rounded-[8px]"
                              >
                                <span className="text-sm">View all tasks</span>
                              </Button>
                            </>
                          )}
                        </>
                      )}
                      {page !== "inbox" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsExpanded(!isExpanded)}
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
            </div>
            {/* Active Filters Row */}
            {activeFilters.length > 0 && (
              <div className="flex-shrink-0" style={{ paddingBottom: '16px' }}>
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
                              {getFilterValueDisplay(filter)}
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
            <div className="bg-white overflow-hidden min-w-full flex flex-col flex-1 min-h-0 relative z-0" style={{ marginTop: 0, paddingTop: 0 }}>
                {/* List and Detail View */}
                <div className="flex flex-1 min-h-0 overflow-hidden border border-gray-200 rounded-[16px] bg-white">
                  <div className="w-[340px] flex-shrink-0 border-r border-gray-200 flex flex-col min-h-0 overflow-hidden" style={{ maxHeight: '100%' }}>
                          <ApprovalsList
                            selectedItem={selectedItem}
                            onSelectItem={onSelectItem}
                            selectedItems={selectedItems}
                            onToggleItem={onToggleItem}
                            onSelectAll={onSelectAll}
                            onClearSelection={onClearSelection}
                            onFilterChange={handleFilterChange}
                            removedItems={removedItems}
                            onRemoveItem={onRemoveItem}
                            onRemoveItems={onRemoveItems}
                            onApprove={onApprove}
                            onReject={onReject}
                            onMarkAsDone={onMarkAsDone}
                            page={page}
                            hideHeader={true}
                            externalSearchQuery={searchQuery}
                            externalSelectedCategory={selectedCategory}
                            onSearchChange={setSearchQuery}
                            activeTab={activeTab}
                            onCategoryChange={setSelectedCategory}
                            sortBy={sortBy}
                            onSortChange={(newSortBy) => {
                              if (typeof newSortBy === "object") {
                                setSortBy(newSortBy)
                              } else {
                                // Legacy format - convert to new format
                                if (newSortBy === "dueDate") {
                                  setSortBy({ column: "dueDate", direction: "asc" })
                                } else {
                                  setSortBy({ column: "requestedOn", direction: "asc" })
                                }
                              }
                            }}
                            pinnedItems={pinnedItems}
                            unpinnedCriticalItems={unpinnedCriticalItems}
                            onTogglePin={onTogglePin}
                            groupBy={groupBy}
                            snoozedItems={snoozedItems}
                            onSnooze={onSnooze}
                            externalFilters={activeFilters}
                          />
                  </div>
                  <div className="flex-1 flex-shrink-0 flex flex-col min-h-0 overflow-hidden">
                            <ApprovalDetail 
                              selectedItem={selectedItem} 
                              selectedItems={selectedItems}
                              onClearSelection={onClearSelection}
                              removedItems={removedItems}
                              onRemoveItem={onRemoveItem}
                              onRemoveItems={onRemoveItems}
                              onApprove={onApprove}
                              onReject={onReject}
                              onMarkAsDone={onMarkAsDone}
                              page={page}
                              backgroundColor="white"
                              viewMode={viewMode}
                              onViewModeChange={handleViewModeChange}
                              onExpandToDrawer={handleExpandToDrawer}
                              onSelectNextItem={handleSelectNextItem}
                              activeTab={activeTab}
                              onOpenAIPanel={(requestContext) => {
                                setAIPanelRequestContext(requestContext)
                                if (onOpenAIPanel) {
                                  onOpenAIPanel(requestContext)
                                }
                              }}
                              onSnooze={onSnooze}
                            />
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
    )
  }

  if (isExpanded && page !== "approvals") {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col">
        {/* Content */}
        <div className={`overflow-hidden relative flex h-full ${aiPanelOpen ? '' : 'flex-1'}`} style={page === "reimbursements" ? { backgroundColor: '#F9F7F6' } : undefined}>
          {renderContent()}
          {/* AI Panel - only in expanded view */}
          {aiPanelOpen && (
            <div className="fixed right-0 top-0 bottom-0 w-[30%] bg-white z-[60] flex flex-col overflow-hidden border-l border-gray-200">
              <AIPanel 
                isOpen={aiPanelOpen} 
                onClose={() => {
                  setAIPanelRequestContext(null)
                  if (onCloseAIPanel) {
                    onCloseAIPanel()
                  }
                }}
                firstName="Ryland"
                requestContext={aiPanelRequestContext}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {renderContent()}
      {/* Save as new modal */}
      {isSaveAsNewModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
            <h2 className="text-lg font-normal mb-4">Enter a name for the view</h2>
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name"
              className="mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newViewName.trim()) {
                  handleSaveAsNew()
                } else if (e.key === 'Escape') {
                  setIsSaveAsNewModalOpen(false)
                  setNewViewName("")
                }
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSaveAsNewModalOpen(false)
                  setNewViewName("")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAsNew}
                disabled={!newViewName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Remove confirmation modal */}
      {isRemoveModalOpen && currentViewId !== "default" && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[400px]">
            <h2 className="text-lg font-normal mb-2">
              Are you sure you want to remove "{savedViews.find(v => v.id === currentViewId)?.name}"?
            </h2>
            <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRemoveModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemove}
              >
                Remove view
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

