"use client"

import { TopNavBar } from "./app-shell/TopNavBar"
import { Sidebar } from "./app-shell/Sidebar"
import { NavSectionData } from "./app-shell/types"
import { DollarSign, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ApprovalsList } from "./approvals-list"
import { ApprovalsGrid } from "./approvals-grid"
import { ApprovalsGridWithSplit } from "./approvals-grid-split"
import { ApprovalDetail } from "./approval-detail"
import { AppNavBar } from "./app-navbar"
import { Drawer } from "./drawer"
import { AIPanel } from "./ai-panel"
import { VerticalTabs } from "./vertical-tabs"
import { ExpansionPane } from "./expansion-pane"
import { Menu } from "lucide-react"
import { useState, useRef, useEffect, useMemo } from "react"

export function Layout({ children }: { children: React.ReactNode }) {
  const [activePage, setActivePage] = useState<"tasks" | "inbox" | "reimbursements" | "approvals">("approvals")
  const [activeTab, setActiveTab] = useState<string>("pending")
  const [approvalsTab, setApprovalsTab] = useState<"requests" | "policies">("requests")
  const [reimbursementsTab, setReimbursementsTab] = useState<"requests">("requests")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [adminMode, setAdminMode] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Update activeTab when page changes to tasks, inbox, or approvals (should default to pending)
  useEffect(() => {
    const validTabs = ["pending", "reviewed", "snoozed", "created", "all", "opt3", "opt4"]
    if ((activePage === "tasks" || activePage === "inbox" || activePage === "approvals") && !validTabs.includes(activeTab)) {
      setActiveTab("pending")
    }
  }, [activePage, activeTab])
  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [removedItems, setRemovedItems] = useState<Set<number>>(new Set())
  const [pinnedItems, setPinnedItems] = useState<Set<number>>(new Set([112]))
  const [snoozedItems, setSnoozedItems] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<{ column: "requestedOn" | "requestedBy" | "taskType" | "dueDate" | "reviewedOn" | "snoozedUntil"; direction: "asc" | "desc" } | "recency" | "dueDate">({ column: "requestedOn", direction: "asc" })
  
  // Update sortBy when activeTab changes to set defaults
  useEffect(() => {
    if (activeTab === "reviewed") {
      setSortBy({ column: "reviewedOn", direction: "desc" })
    } else if (activeTab === "snoozed") {
      setSortBy({ column: "snoozedUntil", direction: "asc" })
    } else if (activeTab === "pending" || activeTab === "created" || activeTab === "all") {
      setSortBy({ column: "requestedOn", direction: "desc" })
    }
  }, [activeTab])
  const [aiPanelOpen, setAIPanelOpen] = useState(false)
  const [aiPanelRequestContext, setAIPanelRequestContext] = useState<any>(null)
  const [isVerticalTabsCollapsed, setIsVerticalTabsCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<"full-width" | "split">("full-width")

  // Calculate pending count (base count minus removed items only)
  // Items stay in their original tabs regardless of actions taken
  const pendingCount = useMemo(() => {
    const basePendingCount = 14 // Base count of pending items
    // Subtract items that have been removed
    const removedCount = removedItems.size
    return Math.max(0, basePendingCount - removedCount)
  }, [removedItems])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerItem, setDrawerItem] = useState<number | null>(null)

  // Clear selectedItem when switching tabs to prevent showing details in wrong view
  // BUT: In split-screen mode, preserve selectedItem when switching between grid/split tabs
  const prevActiveTabRef = useRef(activeTab)
  useEffect(() => {
    // Clear selectedItem when switching away from grid/split views (pending, reviewed, snoozed, created, all, opt3, opt4) to opt1 or opt2
    // or when switching to grid/split views from opt1 or opt2
    // Also clear when switching to opt1 to ensure first item is selected
    // BUT: Don't clear if we're in split-screen mode and switching between grid/split tabs
    const gridSplitTabs = ["pending", "reviewed", "snoozed", "created", "all", "opt3", "opt4"]
    if (prevActiveTabRef.current !== activeTab) {
      // If drawer is open (viewing full-width request details), close it and clear selection
      if (drawerOpen && drawerItem !== null) {
        setDrawerOpen(false)
        setDrawerItem(null)
        setSelectedItem(null)
        prevActiveTabRef.current = activeTab
        return
      }
      
      // In split-screen mode, preserve selectedItem when switching between grid/split tabs
      if (viewMode === "split" && gridSplitTabs.includes(prevActiveTabRef.current) && gridSplitTabs.includes(activeTab)) {
        // Don't clear selectedItem - preserve it
        prevActiveTabRef.current = activeTab
        return
      }
      
      // If we're leaving grid/split views, clear selectedItem
      if (gridSplitTabs.includes(prevActiveTabRef.current)) {
        setSelectedItem(null)
      }
      // If we're entering grid/split views from opt1 or opt2, clear selectedItem
      if (gridSplitTabs.includes(activeTab) && (prevActiveTabRef.current === "opt1" || prevActiveTabRef.current === "opt2")) {
        setSelectedItem(null)
      }
      // If we're entering opt1, clear selectedItem so first item gets selected
      if (activeTab === "opt1") {
        setSelectedItem(null)
      }
    }
    prevActiveTabRef.current = activeTab
  }, [activeTab, viewMode, drawerOpen, drawerItem])

  const handleTogglePin = (id: number) => {
    setPinnedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSnooze = (id: number, snoozeUntil: Date) => {
    // Just track snoozed items, but don't move them between tabs
    setSnoozedItems(prev => new Set(prev).add(id))
    // Clear selection if the selected item is snoozed
    if (selectedItem === id) {
      setSelectedItem(null)
    }
    // Remove from selected items if it's selected
    if (selectedItems.has(id)) {
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }
  const [filteredIds, setFilteredIds] = useState<number[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>("All")
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const opt3ViewModeChangeRef = useRef<((mode: "full-width" | "split") => void) | null>(null)
  
  const handleCategoryChange = (category: string) => {
    // If drawer is open (viewing full-width request details), close it and clear selection
    if (drawerOpen && drawerItem !== null) {
      setDrawerOpen(false)
      setDrawerItem(null)
      setSelectedItem(null)
    }
    // Also clear selectedItem if viewing full-width details without drawer
    else if (viewMode === "full-width" && selectedItem !== null) {
      setSelectedItem(null)
    }
    setSelectedCategory(category)
  }

  // Custom tab change handler that implements navigation behavior
  const handleTabChange = (newTab: string) => {
    // Split-screen: when viewMode is "split"
    if (viewMode === "split") {
      if (newTab === activeTab) {
        // Clicking the currently selected tab → no-op (no navigation / no state changes)
        return
      } else {
        // Clicking a different tab → update list to show items for that tab (stay in split-screen)
        // selectedItem should remain unchanged (whether null or a number)
        setActiveTab(newTab)
      }
    }
    // Full-width (Request Details view): when viewMode is "full-width" and selectedItem is not null
    // OR when drawer is open (the useEffect will handle closing the drawer)
    else if (viewMode === "full-width" && selectedItem !== null) {
      if (newTab === activeTab) {
        // Clicking the currently selected tab → return to grid view (clear selectedItem)
        setSelectedItem(null)
      } else {
        // Clicking a different tab → navigate to that tab's grid view (clear selectedItem and change tab)
        setSelectedItem(null)
        setActiveTab(newTab)
      }
    }
    // Default behavior: just change the tab (useEffect will handle drawer closing if needed)
    else {
      setActiveTab(newTab)
    }
  }

  const handleApprove = (id: number) => {
    // Just remove the item, don't track status or move between tabs
    handleRemoveItem(id)
  }

  const handleReject = (id: number) => {
    // Just remove the item, don't track status or move between tabs
    handleRemoveItem(id)
  }

  const handleMarkAsDone = (id: number) => {
    // Just remove the item, don't track status or move between tabs
    handleRemoveItem(id)
  }

  const handleRemoveItem = (id: number) => {
    setRemovedItems(prev => new Set(prev).add(id))
    // Clear selection if the selected item is removed
    if (selectedItem === id) {
      setSelectedItem(null)
    }
    // Remove from selected items if it's selected
    if (selectedItems.has(id)) {
      setSelectedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const handleRemoveItems = (ids: number[]) => {
    setRemovedItems(prev => {
      const newSet = new Set(prev)
      ids.forEach(id => newSet.add(id))
      return newSet
    })
    // Clear selection if the selected item is removed
    if (selectedItem && ids.includes(selectedItem)) {
      setSelectedItem(null)
    }
    // Remove from selected items
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      ids.forEach(id => newSet.delete(id))
      return newSet
    })
  }

  const handleToggleItem = (id: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (filteredIds: number[]) => {
    setSelectedItems(new Set(filteredIds))
  }

  const handleClearSelection = () => {
    setSelectedItems(new Set())
  }

  const handleFilterChange = (ids: number[]) => {
    setFilteredIds(ids)
    // If current selection is not in filtered results, clear it
    if (selectedItem && !ids.includes(selectedItem)) {
      setSelectedItem(null)
    }
  }

  // Auto-select first item in opt1 when filteredIds change and no item is selected
  useEffect(() => {
    if (activeTab === "opt1" && filteredIds.length > 0 && selectedItem === null) {
      setSelectedItem(filteredIds[0])
    }
  }, [activeTab, filteredIds, selectedItem])

  // Function to select the next item in the queue
  const handleSelectNextItem = () => {
    if (selectedItem && filteredIds.length > 0) {
      const currentIndex = filteredIds.indexOf(selectedItem)
      if (currentIndex !== -1 && currentIndex < filteredIds.length - 1) {
        // Select the next item
        const nextItem = filteredIds[currentIndex + 1]
        setSelectedItem(nextItem)
      } else if (currentIndex !== -1 && currentIndex === filteredIds.length - 1 && filteredIds.length > 1) {
        // If it's the last item, select the previous one (since current will be removed)
        const prevItem = filteredIds[currentIndex - 1]
        setSelectedItem(prevItem)
      } else {
        // No more items, clear selection
        setSelectedItem(null)
      }
    }
  }

  const handleOpenDrawer = (id: number) => {
    setDrawerItem(id)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    // Only clear selectedItem if we're actually closing a drawer normally (not collapsing to split)
    // When collapsing to split, drawerItem will be set, so preserve it by not clearing selectedItem
    const gridSplitTabs = ["pending", "reviewed", "snoozed", "created", "all", "opt3", "opt4"]
    if (gridSplitTabs.includes(activeTab) && drawerOpen && drawerItem !== null) {
      // drawerItem is set, which means we're collapsing to split
      // selectedItem should already be set by onViewModeChange handler
      // Don't clear selectedItem - preserve it for split view
      // Just close the drawer
    } else if (gridSplitTabs.includes(activeTab) && drawerOpen) {
      // drawerItem is null, we're closing normally, so clear selectedItem
      setSelectedItem(null)
    } else {
      // Not in grid/split view tabs, clear normally
      setSelectedItem(null)
    }
    setDrawerOpen(false)
    setDrawerItem(null)
  }

  // Navigation structure for Pebble components
  const mainNavSections: NavSectionData[] = [
    {
      items: [
        {
          id: "approvals",
          label: "Approvals app",
          icon: <ClipboardCheck className="h-5 w-5" />,
          onClick: () => {
            setActivePage("approvals")
            setSelectedItem(null)
            setViewMode("full-width")
            setSelectedCategory("All")
            setApprovalsTab("requests")
          }
        },
        {
          id: "reimbursements",
          label: "Reimbursements",
          icon: <DollarSign className="h-5 w-5" />,
          onClick: () => {
            setActivePage("reimbursements")
            setSelectedItem(null)
            setViewMode("full-width")
            setReimbursementsTab("requests")
          }
        }
      ]
    }
  ]

  const shouldHideNav = isExpanded && activePage === "approvals"
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {!shouldHideNav && (
        <TopNavBar 
          companyName="Acme, Inc."
          userInitial="A"
          adminMode={adminMode}
          currentMode="light"
          searchPlaceholder="Search or jump to..."
          onAdminModeToggle={() => setAdminMode(!adminMode)}
          showNotificationBadge={false}
          notificationCount={0}
          onAIClick={() => setAIPanelOpen(true)}
        />
      )}
      <div className={`flex-1 flex overflow-hidden ${!shouldHideNav ? 'pt-14' : ''}`}>
        {!shouldHideNav && (
          <Sidebar 
            mainSections={mainNavSections}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            activePageId={activePage}
          />
        )}
        <div className={`flex-1 flex flex-col flex-shrink min-w-0 ${aiPanelOpen ? 'mr-[30%]' : ''} ${
          shouldHideNav ? '' : (sidebarCollapsed ? 'ml-[60px]' : 'ml-[266px]')
        }`}>
          {activePage === "inbox" || activePage === "reimbursements" || activePage === "approvals" ? null : (
            <AppNavBar activeTab={activeTab} onTabChange={setActiveTab} page={activePage} pendingCount={pendingCount} />
          )}
          {activePage === "inbox" ? (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: '#F9F7F6' }}>
              {/* Content area with expansion pane and grid - stretches to top */}
              <div className="flex-1 flex flex-row overflow-hidden">
                {/* Expansion pane container */}
                <div className="flex flex-col flex-shrink-0">
                  <ExpansionPane 
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    categoryCounts={categoryCounts}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    viewMode={viewMode}
                    selectedItem={selectedItem}
                    onSelectItem={setSelectedItem}
                    page={activePage}
                  />
                </div>
                <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
                  <ApprovalsGridWithSplit
                    onToggleVerticalTabs={() => setIsVerticalTabsCollapsed(!isVerticalTabsCollapsed)}
                    isVerticalTabsCollapsed={isVerticalTabsCollapsed}
                    selectedItem={selectedItem}
                    onSelectItem={(id) => {
                      setSelectedItem(id)
                    }}
                    selectedItems={selectedItems}
                    onToggleItem={handleToggleItem}
                    onSelectAll={handleSelectAll}
                    onClearSelection={handleClearSelection}
                    onFilterChange={handleFilterChange}
                    onOpenDrawer={handleOpenDrawer}
                    onCloseDrawer={handleCloseDrawer}
                    drawerViewModeChange={(handler) => {
                      opt3ViewModeChangeRef.current = handler
                    }}
                    drawerOpen={drawerOpen}
                    removedItems={removedItems}
                    onRemoveItem={handleRemoveItem}
                    onRemoveItems={handleRemoveItems}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onMarkAsDone={handleMarkAsDone}
                    page={activePage}
                    pinnedItems={pinnedItems}
                    onTogglePin={handleTogglePin}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    pendingCount={pendingCount}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    onCategoryCountsChange={setCategoryCounts}
                    onOpenAIPanel={(requestContext) => {
                      setAIPanelRequestContext(requestContext)
                      setAIPanelOpen(true)
                    }}
                    snoozedItems={snoozedItems}
                    onSnooze={handleSnooze}
                    aiPanelOpen={aiPanelOpen}
                    onCloseAIPanel={() => setAIPanelOpen(false)}
                    onViewModeChange={setViewMode}
                    onNavigateToPage={(page) => {
                      setActivePage(page)
                      setSelectedItem(null)
                      setViewMode("full-width")
                      if (page === "inbox") {
                        setSelectedCategory("All")
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : activePage === "reimbursements" ? (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: '#F9F7F6' }}>
              {/* Header with NavSection */}
              <div className="flex-shrink-0 border-b border-border bg-card">
                <div className="px-16" style={{ paddingTop: '0px', paddingBottom: '0px', height: '122px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h1 className="rippling-text-2xl text-foreground">Reimbursements</h1>
                    </div>
                    <Button 
                      className="rippling-btn-primary"
                      onClick={() => {
                        // Handle submit reimbursement click
                        console.log("Submit reimbursement clicked")
                      }}
                    >
                      Submit reimbursement
                    </Button>
                  </div>
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setReimbursementsTab("requests")}
                      className={`px-6 pb-3 border-b-2 transition-all duration-200 ${
                        reimbursementsTab === "requests"
                          ? "border-[#000000]"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className={`rippling-text-sm transition-colors ${
                        reimbursementsTab === "requests"
                          ? "text-[#000000] font-normal"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>
                        Requests
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              {/* Content area without expansion pane - only grid */}
              <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
                <ApprovalsGridWithSplit
                  onToggleVerticalTabs={() => setIsVerticalTabsCollapsed(!isVerticalTabsCollapsed)}
                  isVerticalTabsCollapsed={isVerticalTabsCollapsed}
                  selectedItem={selectedItem}
                  onSelectItem={(id) => {
                    setSelectedItem(id)
                  }}
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  onFilterChange={handleFilterChange}
                  onOpenDrawer={handleOpenDrawer}
                  onCloseDrawer={handleCloseDrawer}
                  drawerViewModeChange={(handler) => {
                    opt3ViewModeChangeRef.current = handler
                  }}
                  drawerOpen={drawerOpen}
                  removedItems={removedItems}
                  onRemoveItem={handleRemoveItem}
                  onRemoveItems={handleRemoveItems}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onMarkAsDone={handleMarkAsDone}
                  page={activePage}
                  pinnedItems={pinnedItems}
                  onTogglePin={handleTogglePin}
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  pendingCount={pendingCount}
                  selectedCategory="Reimbursements"
                  onCategoryChange={handleCategoryChange}
                  onCategoryCountsChange={setCategoryCounts}
                  onOpenAIPanel={(requestContext) => {
                    setAIPanelRequestContext(requestContext)
                    setAIPanelOpen(true)
                  }}
                  snoozedItems={snoozedItems}
                  onSnooze={handleSnooze}
                  aiPanelOpen={aiPanelOpen}
                  onCloseAIPanel={() => setAIPanelOpen(false)}
                  onViewModeChange={setViewMode}
                  onNavigateToPage={(page) => {
                    setActivePage(page)
                    setSelectedItem(null)
                    setViewMode("full-width")
                    if (page === "inbox") {
                      setSelectedCategory("All")
                    }
                  }}
                />
              </div>
            </div>
          ) : activePage === "approvals" ? (
            <div className="flex-1 flex flex-col" style={{ backgroundColor: '#F9F7F6' }}>
              {/* Header with NavSection */}
              {!shouldHideNav && (
              <div className="flex-shrink-0 border-b border-border bg-card">
                <div className="px-16" style={{ paddingTop: '0px', paddingBottom: '0px', height: '122px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h1 className="rippling-text-2xl text-foreground">Approvals</h1>
                    </div>
                  </div>
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setApprovalsTab("requests")}
                      className={`px-6 pb-3 border-b-2 transition-all duration-200 ${
                        approvalsTab === "requests"
                          ? "border-[#000000]"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className={`rippling-text-sm transition-colors ${
                        approvalsTab === "requests"
                          ? "text-[#000000] font-normal"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>
                        Requests
                      </span>
                    </button>
                    <button
                      onClick={() => setApprovalsTab("policies")}
                      className={`px-6 pb-3 border-b-2 transition-all duration-200 ${
                        approvalsTab === "policies"
                          ? "border-[#000000]"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                    >
                      <span className={`rippling-text-sm transition-colors ${
                        approvalsTab === "policies"
                          ? "text-[#000000] font-normal"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>
                        Policies
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              )}
              {/* Content area with expansion pane and grid */}
              <div className="flex-1 flex flex-row overflow-hidden">
                {/* Expansion pane container */}
                <div className="flex flex-col flex-shrink-0">
                  <ExpansionPane 
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    categoryCounts={categoryCounts}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    viewMode={viewMode}
                    selectedItem={selectedItem}
                    onSelectItem={setSelectedItem}
                    page={activePage}
                    isExpanded={isExpanded && activePage === "approvals"}
                  />
                </div>
                <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
                  <ApprovalsGridWithSplit
                    onToggleVerticalTabs={() => setIsVerticalTabsCollapsed(!isVerticalTabsCollapsed)}
                    isVerticalTabsCollapsed={isVerticalTabsCollapsed}
                    selectedItem={selectedItem}
                    onSelectItem={(id) => {
                      setSelectedItem(id)
                    }}
                    selectedItems={selectedItems}
                    onToggleItem={handleToggleItem}
                    onSelectAll={handleSelectAll}
                    onClearSelection={handleClearSelection}
                    onFilterChange={handleFilterChange}
                    onOpenDrawer={handleOpenDrawer}
                    onCloseDrawer={handleCloseDrawer}
                    drawerViewModeChange={(handler) => {
                      opt3ViewModeChangeRef.current = handler
                    }}
                    drawerOpen={drawerOpen}
                    removedItems={removedItems}
                    onRemoveItem={handleRemoveItem}
                    onRemoveItems={handleRemoveItems}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onMarkAsDone={handleMarkAsDone}
                    page="approvals"
                    pinnedItems={pinnedItems}
                    onTogglePin={handleTogglePin}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    pendingCount={pendingCount}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    onCategoryCountsChange={setCategoryCounts}
                    onOpenAIPanel={(requestContext) => {
                      setAIPanelRequestContext(requestContext)
                      setAIPanelOpen(true)
                    }}
                    snoozedItems={snoozedItems}
                    onSnooze={handleSnooze}
                    aiPanelOpen={aiPanelOpen}
                    onCloseAIPanel={() => setAIPanelOpen(false)}
                    onViewModeChange={setViewMode}
                    onNavigateToPage={(page) => {
                      setActivePage(page)
                      setSelectedItem(null)
                      setViewMode("full-width")
                      if (page === "inbox") {
                        setSelectedCategory("All")
                      }
                    }}
                    onExpandedChange={setIsExpanded}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden relative">
              {activeTab === "opt1" ? (
              <>
                <div className="border-r border-border pl-6 flex flex-col overflow-hidden bg-card">
                  <ApprovalsList 
                    selectedItem={selectedItem} 
                    onSelectItem={setSelectedItem}
                    selectedItems={selectedItems}
                    onToggleItem={handleToggleItem}
                    onSelectAll={handleSelectAll}
                    onClearSelection={handleClearSelection}
                    onFilterChange={handleFilterChange}
                    removedItems={removedItems}
                    onRemoveItem={handleRemoveItem}
                    onRemoveItems={handleRemoveItems}
                    page={activePage}
                    pinnedItems={pinnedItems}
                    onTogglePin={handleTogglePin}
                    sortBy={sortBy}
                    onSortChange={(newSortBy) => {
                      setSortBy(newSortBy)
                    }}
                    snoozedItems={snoozedItems}
                    onSnooze={handleSnooze}
                  />
                </div>
                <div className="flex-1 bg-background">
                  <ApprovalDetail 
                    selectedItem={selectedItem} 
                    selectedItems={selectedItems}
                    onClearSelection={handleClearSelection}
                    removedItems={removedItems}
                    onRemoveItem={handleRemoveItem}
                    onRemoveItems={handleRemoveItems}
                    page={activePage}
                    onSelectNextItem={handleSelectNextItem}
                    onOpenAIPanel={(requestContext) => {
                      setAIPanelRequestContext(requestContext)
                      setAIPanelOpen(true)
                    }}
                    onSnooze={handleSnooze}
                  />
                </div>
              </>
            ) : activeTab === "opt2" ? (
              <div className="flex-1 bg-background">
                <ApprovalsGrid
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  onOpenDrawer={handleOpenDrawer}
                  removedItems={removedItems}
                  onRemoveItem={handleRemoveItem}
                  onRemoveItems={handleRemoveItems}
                  page={activePage}
                  pinnedItems={pinnedItems}
                  onTogglePin={handleTogglePin}
                  aiPanelOpen={aiPanelOpen}
                  snoozedItems={snoozedItems}
                  onSnooze={handleSnooze}
                />
              </div>
            ) : activeTab === "opt4" || activeTab === "pending" || activeTab === "reviewed" || activeTab === "snoozed" || activeTab === "created" || activeTab === "all" ? (
              <div className="flex-1">
                <ApprovalsGridWithSplit
                  selectedItem={selectedItem}
                  onSelectItem={(id) => {
                    setSelectedItem(id)
                  }}
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  onFilterChange={handleFilterChange}
                  onOpenDrawer={handleOpenDrawer}
                  onCloseDrawer={handleCloseDrawer}
                  drawerViewModeChange={(handler) => {
                    opt3ViewModeChangeRef.current = handler
                  }}
                  drawerOpen={drawerOpen}
                  removedItems={removedItems}
                  onRemoveItem={handleRemoveItem}
                  onRemoveItems={handleRemoveItems}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onMarkAsDone={handleMarkAsDone}
                  page={activePage}
                  pinnedItems={pinnedItems}
                  onTogglePin={handleTogglePin}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  pendingCount={pendingCount}
                  selectedCategory={(activePage as "tasks" | "inbox") === "inbox" ? selectedCategory : undefined}
                  onCategoryChange={(activePage as "tasks" | "inbox") === "inbox" ? handleCategoryChange : undefined}
                  onOpenAIPanel={(requestContext) => {
                    setAIPanelRequestContext(requestContext)
                    setAIPanelOpen(true)
                  }}
                  snoozedItems={snoozedItems}
                  onSnooze={handleSnooze}
                  aiPanelOpen={aiPanelOpen}
                  onCloseAIPanel={() => {
                    setAIPanelOpen(false)
                    setAIPanelRequestContext(null)
                  }}
                />
              </div>
            ) : (
              <div className="flex-1">
                <ApprovalsGridWithSplit
                  selectedItem={selectedItem}
                  onSelectItem={(id) => {
                    setSelectedItem(id)
                  }}
                  selectedItems={selectedItems}
                  onToggleItem={handleToggleItem}
                  onSelectAll={handleSelectAll}
                  onClearSelection={handleClearSelection}
                  onFilterChange={handleFilterChange}
                  onOpenDrawer={handleOpenDrawer}
                  onCloseDrawer={handleCloseDrawer}
                  drawerViewModeChange={(handler) => {
                    opt3ViewModeChangeRef.current = handler
                  }}
                  drawerOpen={drawerOpen}
                  removedItems={removedItems}
                  onRemoveItem={handleRemoveItem}
                  onRemoveItems={handleRemoveItems}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onMarkAsDone={handleMarkAsDone}
                  page={activePage}
                  pinnedItems={pinnedItems}
                  onTogglePin={handleTogglePin}
                  activeTab={activeTab}
                  onOpenAIPanel={(requestContext) => {
                    setAIPanelRequestContext(requestContext)
                    setAIPanelOpen(true)
                  }}
                  snoozedItems={snoozedItems}
                  onSnooze={handleSnooze}
                  aiPanelOpen={aiPanelOpen}
                  onCloseAIPanel={() => {
                    setAIPanelOpen(false)
                    setAIPanelRequestContext(null)
                  }}
                />
              </div>
            )}
            </div>
          )}
        </div>
      </div>
      
      <Drawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        selectedItem={drawerItem}
        selectedItems={selectedItems}
        onClearSelection={handleClearSelection}
        removedItems={removedItems}
        onRemoveItem={handleRemoveItem}
        onRemoveItems={handleRemoveItems}
        page={activePage}
        onViewModeChange={(mode) => {
          // When collapsing from drawer, switch to split screen in grid/split view tabs
          const gridSplitTabs = ["pending", "reviewed", "snoozed", "created", "all", "opt3", "opt4"]
          if (gridSplitTabs.includes(activeTab) && mode === "split") {
            // Preserve the selected item when collapsing to split view
            // Capture drawerItem before closing the drawer
            const itemToPreserve = drawerItem
            if (opt3ViewModeChangeRef.current) {
              // Set selectedItem before calling the view mode change handler
              // This ensures the item is preserved when the drawer closes
              if (itemToPreserve !== null) {
                setSelectedItem(itemToPreserve)
              }
              // Call the handler which will close the drawer and change view mode
              opt3ViewModeChangeRef.current("split")
            }
          }
        }}
        onSelectNextItem={handleSelectNextItem}
        activeTab={activeTab}
        onOpenAIPanel={() => setAIPanelOpen(true)}
        onSelectItem={(id) => {
          setDrawerItem(id)
          setSelectedItem(id)
        }}
        onSnooze={handleSnooze}
      />
      
      {/* AI Panel */}
      {aiPanelOpen && (
        <div className="fixed right-0 top-14 bottom-0 w-[30%] bg-white z-50 flex flex-col overflow-hidden border-l border-gray-200">
          <AIPanel 
            isOpen={aiPanelOpen} 
            onClose={() => {
              setAIPanelOpen(false)
              setAIPanelRequestContext(null)
            }}
            firstName="Ryland"
            requestContext={aiPanelRequestContext}
          />
        </div>
      )}
    </div>
  )
}


