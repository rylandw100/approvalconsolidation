import { Button } from "@/components/ui/button"
import { PebbleButton, ButtonSizes, ButtonAppearances } from "@/components/ui/pebble-button"
import { Badge } from "@/components/ui/badge"
import { X, ArrowUpRight, AlertTriangle, ChevronLeft, ChevronRight, Settings, Sparkles } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { createPortal } from "react-dom"
import Image from "next/image"
import { generateApprovalData } from "@/lib/approval-data"

interface ApprovalDetailProps {
  selectedItem: number | null
  selectedItems: Set<number>
  onClearSelection: () => void
  removedItems?: Set<number>
  onRemoveItem?: (id: number) => void
  onRemoveItems?: (ids: number[]) => void
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  onMarkAsDone?: (id: number) => void
  page?: "tasks" | "inbox" | "reimbursements" | "approvals"
  backgroundColor?: "white" | "default"
  viewMode?: "full-width" | "split"
  onViewModeChange?: (mode: "full-width" | "split") => void
  onExpandToDrawer?: () => void
  onSelectNextItem?: () => void
  activeTab?: string
  onOpenAIPanel?: (requestContext?: any) => void
  onSelectItem?: (id: number | null) => void
  onSnooze?: (id: number, snoozeUntil: Date) => void
}

export function ApprovalDetail({ selectedItem, selectedItems, onClearSelection, removedItems = new Set(), onRemoveItem, onRemoveItems, onApprove, onReject, onMarkAsDone, page = "tasks", backgroundColor = "default", viewMode, onViewModeChange, onExpandToDrawer, onSelectNextItem, activeTab: parentActiveTab, onOpenAIPanel, onSelectItem, onSnooze }: ApprovalDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview")
  const [metadataModalOpen, setMetadataModalOpen] = useState(false)
  const [metadataLoading, setMetadataLoading] = useState(false)
  const [snoozePopoverOpen, setSnoozePopoverOpen] = useState(false)
  const [bulkSnoozePopoverOpen, setBulkSnoozePopoverOpen] = useState(false)
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false)
  const [snoozeDate, setSnoozeDate] = useState<Date | null>(null)
  const [snoozeTime, setSnoozeTime] = useState<string>("08:00")
  const [tooltipData, setTooltipData] = useState<{id: string | null, x: number, y: number, content: React.ReactNode, side: 'left' | 'right'}>({id: null, x: 0, y: 0, content: null, side: 'right'})
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const snoozePopoverRef = useRef<HTMLDivElement>(null)
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

  const handleSnooze = (snoozeUntil: Date) => {
    if (selectedItem && onSnooze) {
      onSnooze(selectedItem, snoozeUntil)
    }
    setSnoozePopoverOpen(false)
    setSnoozeModalOpen(false)
  }

  const handleQuickSnooze = (type: 'laterToday' | 'tomorrow' | 'nextWeek') => {
    let snoozeUntil: Date
    if (type === 'laterToday') {
      snoozeUntil = getLaterToday()
    } else if (type === 'tomorrow') {
      snoozeUntil = getTomorrow()
    } else {
      snoozeUntil = getNextWeek()
    }
    handleSnooze(snoozeUntil)
  }

  const handleSaveSnooze = () => {
    if (snoozeDate && snoozeTime) {
      const [hours, minutes] = snoozeTime.split(':').map(Number)
      const snoozeUntil = new Date(snoozeDate)
      snoozeUntil.setHours(hours, minutes, 0, 0)
      
      // If bulk selection is active, snooze all selected items
      if (hasSelectedItems && selectedItems && selectedItems.size > 0 && onSnooze) {
        Array.from(selectedItems).forEach(id => onSnooze(id, snoozeUntil))
        setBulkSnoozePopoverOpen(false)
        onClearSelection()
      } else if (selectedItem && onSnooze) {
        // Single item snooze
        handleSnooze(snoozeUntil)
      }
      
      setSnoozeDate(null)
      setSnoozeTime("08:00")
      setSnoozeModalOpen(false)
    }
  }

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (snoozePopoverRef.current && !snoozePopoverRef.current.contains(event.target as Node)) {
        setSnoozePopoverOpen(false)
      }
    }
    if (snoozePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [snoozePopoverOpen])
  
  // Define all possible metadata fields for each category
  const getAllMetadataFields = (category: string) => {
    if (category === "HR Management" || category === "Approvals - HR Management") {
      return [
        { id: "numberOfChanges", label: "Number of changes" },
        { id: "changeEffectDate", label: "Change effect date" },
        { id: "reason", label: "Reason" },
        { id: "department", label: "Department" },
        { id: "manager", label: "Manager" },
        { id: "employmentType", label: "Employment type" },
        { id: "startDate", label: "Start date" },
        { id: "location", label: "Location" }
      ]
    } else if (category === "Reimbursements" || category === "Approvals - Reimbursements") {
      return [
        { id: "purchaser", label: "Purchaser" },
        { id: "purchaseDate", label: "Purchase date" },
        { id: "checkDate", label: "Check date" },
        { id: "vendor", label: "Vendor" },
        { id: "entity", label: "Entity" },
        { id: "amount", label: "Amount" },
        { id: "category", label: "Category" },
        { id: "paymentMethod", label: "Payment method" },
        { id: "reason", label: "Reason" }
      ]
    } else if (category === "Time and Attendance" || category === "Approvals - Time and Attendance") {
      return [
        { id: "duration", label: "Duration" },
        { id: "startTime", label: "Start time" },
        { id: "endTime", label: "End time" },
        { id: "unpaidBreak", label: "Unpaid break" },
        { id: "officeLocation", label: "Office location" },
        { id: "numberOfBreaks", label: "Number of breaks" },
        { id: "totalHours", label: "Total hours" },
        { id: "overtime", label: "Overtime" }
      ]
    } else if (category === "Miscellaneous") {
      return [
        { id: "startDate", label: "Start date" },
        { id: "type", label: "Type" },
        { id: "manager", label: "Manager" },
        { id: "officeLocation", label: "Office location" }
      ]
    } else if (category === "Payroll") {
      return [
        { id: "entity", label: "Entity" },
        { id: "filing", label: "Filing" },
        { id: "agency", label: "Agency" },
        { id: "accountNumber", label: "Account number" },
        { id: "dueDate", label: "Due date" },
        { id: "requestedOn", label: "Requested on" }
      ]
    }
    return []
  }
  
  // Get currently visible fields based on category
  const getDefaultVisibleFields = (category: string) => {
    if (category === "HR Management" || category === "Approvals - HR Management") {
      return ["numberOfChanges", "changeEffectDate", "reason"]
    } else if (category === "Reimbursements" || category === "Approvals - Reimbursements") {
      return ["purchaser", "purchaseDate", "checkDate", "category"]
    } else if (category === "Time and Attendance" || category === "Approvals - Time and Attendance") {
      return ["duration", "startTime", "endTime", "unpaidBreak"]
    } else if (category === "Miscellaneous") {
      return ["startDate", "type", "manager"]
    } else if (category === "Payroll") {
      return ["entity", "filing", "agency", "accountNumber"]
    }
    return []
  }
  
  // State for selected metadata fields (persisted per category)
  const [selectedMetadataFields, setSelectedMetadataFields] = useState<Record<string, Set<string>>>({})
  const [tempSelectedFields, setTempSelectedFields] = useState<Set<string>>(new Set())
  const [currentCategory, setCurrentCategory] = useState<string>("")
  
  // Initialize selected fields when approval changes
  useEffect(() => {
    if (selectedItem) {
      const approval = approvalData[selectedItem]
      if (approval) {
        const category = approval.category
        const categoryKey = category.replace("Approvals - ", "")
        if (!selectedMetadataFields[categoryKey]) {
          setSelectedMetadataFields(prev => ({
            ...prev,
            [categoryKey]: new Set(getDefaultVisibleFields(category))
          }))
        }
      }
    }
  }, [selectedItem])
  
  // Reset to Overview tab when selectedItem changes in split screen view
  useEffect(() => {
    if (viewMode === "split" || backgroundColor === "white") {
      setActiveTab("Overview")
    }
  }, [selectedItem, viewMode, backgroundColor])
  
  // Helper function to get display category name
  const getDisplayCategory = (category: string) => {
    // Map category values to display names
    if (category === "Training") {
      return "Learning Management"
    }
    return category
  }
  
  // Generate approval data and merge with task data
  const generatedApprovalData = useMemo(() => generateApprovalData(), [])
  const taskData = useMemo(() => [
    // Pending tasks
    {
      id: 101,
      requestor: "HR Team",
      subject: "Take required cybersecurity course for Q4 certification",
      category: "Training",
      itemStatus: "Pending",
      summary: "You are required to complete the Cybersecurity Fundamentals course as part of Q4 certification requirements. This course covers essential security practices and must be completed before November 15, 2024.",
      courseName: "Cybersecurity Fundamentals",
      dueDate: "Jan 31, 2025",
      estimatedDuration: "3 hours",
      requestedOn: "Jan 16, 2025",
      note: "This is a mandatory training course for all employees. The course can be accessed through the learning portal and must be completed during business hours.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    {
      id: 102,
      requestor: "Legal Department",
      subject: "Sign updated company policy document",
      category: "Documents",
      summary: "The Legal Department requires you to review and sign the updated Employee Handbook 2024. This document contains important policy updates and must be signed by October 30, 2024.",
      documentName: "Employee Handbook 2024",
      dueDate: "Jan 21, 2025",
      requestedOn: "Jan 17, 2025",
      note: "Please review all sections carefully, particularly the updates to the code of conduct and remote work policies. Electronic signature is acceptable.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    {
      id: 103,
      requestor: "Onboarding Team",
      subject: "Take new hire Alex Martinez out to lunch",
      category: "Miscellaneous",
      summary: "Alex Martinez joined the team as a Software Engineer this week. Please take them out to lunch to help them feel welcome and integrated into the team. This is an important part of our onboarding process.",
      newHireName: "Alex Martinez",
      newHireRole: "Software Engineer",
      suggestedDate: "This week",
      requestedOn: "Jan 18, 2025",
      note: "Expenses up to $50 per person will be reimbursed. Please submit receipt for reimbursement. Suggested locations include nearby restaurants within walking distance of the office.",
      employee: {
        name: "Alex Martinez",
        role: "Software Engineer",
        status: "Full Time",
        location: "Office Location",
        startDate: "January 15, 2025",
        type: "Full-time",
        manager: "Michael Chen",
        officeLocation: "San Francisco Office"
      },
      startDate: "January 15, 2025",
      officeLocation: "San Francisco Office"
    },
    {
      id: 104,
      requestor: "HR Team",
      subject: "Complete leadership development course",
      category: "Training",
      summary: "You have been selected to participate in the Leadership Essentials development program. This course is designed to enhance leadership skills and prepare you for management opportunities.",
      courseName: "Leadership Essentials",
      dueDate: "Jan 18, 2025",
      estimatedDuration: "8 hours",
      requestedOn: "Jan 4, 2025",
      note: "This course includes both online modules and an in-person workshop. The course is self-paced but must be completed by the due date. Materials will be provided through the learning portal.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    {
      id: 105,
      requestor: "Legal Department",
      subject: "Sign non-disclosure agreement for new project",
      category: "Documents",
      summary: "You are being assigned to work on Project Phoenix, which requires signing a non-disclosure agreement due to the confidential nature of the project. This NDA must be signed before you can access project materials.",
      documentName: "NDA - Project Phoenix",
      dueDate: "Jan 10, 2025",
      requestedOn: "Jan 3, 2025",
      note: "This is a standard NDA covering confidential project information. Review the document carefully and direct any questions to the Legal Department. Signature is required to proceed with project access.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    {
      id: 106,
      requestor: "Onboarding Team",
      subject: "Take new hire Sarah Kim out to lunch",
      category: "Miscellaneous",
      summary: "Sarah Kim recently joined the team as a Product Designer. Please take them out to lunch to help welcome them to the company and build team connections.",
      newHireName: "Sarah Kim",
      newHireRole: "Product Designer",
      suggestedDate: "This week",
      requestedOn: "Jan 2, 2025",
      dueDate: "Jan 16, 2025",
      note: "This is a great opportunity to share company culture and answer any questions they may have. Expenses up to $50 per person will be reimbursed. Submit receipt for reimbursement.",
      employee: {
        name: "Sarah Kim",
        role: "Product Designer",
        status: "Salaried, Full Time",
        location: "Office Location",
        startDate: "January 2, 2025",
        type: "Salaried",
        manager: "Jennifer Davis",
        officeLocation: "Seattle Office"
      },
      startDate: "January 2, 2025",
      officeLocation: "Seattle Office"
    }
  ], [])
  
  // Convert arrays to Record format for lookup by ID
  // Prioritize generated data over legacy data
  const approvalData: Record<number, any> = useMemo(() => {
    const data: Record<number, any> = {}
    // First add generated approval data (this takes priority)
    generatedApprovalData.forEach(approval => {
      data[approval.id] = approval
    })
    // Then add task data
    taskData.forEach(task => {
      data[task.id] = task
    })
    return data
  }, [generatedApprovalData, taskData])
  
  // Legacy hardcoded data (for backward compatibility - only used if not in generated data)
  const legacyApprovalData: Record<number, any> = {
    1: {
      requestor: "Kristine Young",
      subject: "Increase Stephanie Perkins' target annual bonus to $22,500",
      category: "Approvals - HR Management",
      summary: "Kristine Young is requesting to increase Stephanie Perkins' target annual bonus to $22,500. No reason was provided. If approved this change will be made immediately.",
      employee: {
        name: "Stephanie Perkins",
        role: "Account Executive",
        status: "Full Time",
        location: "United States",
        employmentType: "Salaried, full-time (Exempt)",
        department: "Sales",
        manager: "Kristine Young",
        startDate: "March 15, 2020"
      },
      numberOfChanges: "1",
      changeEffectDate: "16 January 2025",
      reason: "Performance-based increase",
      requestedOn: "Jan 20, 2025",
      fieldName: "Target annual bonus",
      changes: {
        current: "$15,000",
        new: "$22,500",
        amount: "+$7,500"
      },
      note: "Position: Account Executive · Full time employee in the United States. The requested annual bonus falls within the range for Sales, United States, Management-7.",
      warning: "Exceeds the approved band",
      comments: [
        { id: 1, author: "John Smith", text: "This seems reasonable given the performance metrics.", timestamp: "2 hours ago" },
        { id: 2, author: "Sarah Wilson", text: "Need to verify the budget allocation first.", timestamp: "1 hour ago" }
      ]
    },
    2: {
      requestor: "Thomas Bennett",
      subject: "Reimburse $14.98 (Uber)",
      category: "Approvals - Reimbursements",
      summary: "Thomas Bennett submitted an expense request for $14.98 for Uber transportation. This expense appears to be related to business travel.",
      employee: {
        name: "Thomas Bennett",
        role: "Sales Manager",
        status: "Full Time",
        location: "New York, USA"
      },
      vendor: {
        name: "Uber"
      },
      entity: "Acme Corp",
      purchaseDate: "Jan 12, 2025",
      checkDate: "Jan 14, 2025",
      amount: "$14.98",
      expenseCategory: "Transportation",
      paymentMethod: "Credit Card",
      requestedOn: "Jan 19, 2025",
      changes: {
        current: "$0",
        new: "$14.98",
        amount: "$72.41"
      },
      note: "Receipt has been attached. Expense is within policy limits.",
      warning: "Potential duplicate detected",
      comments: [
        { id: 1, author: "Mike Johnson", text: "I've seen similar Uber charges this month.", timestamp: "30 min ago" }
      ],
      trip: {
        name: "Conference in Phoenix",
        linked: true
      }
    },
    3: {
      requestor: "Madeline Hernandez",
      subject: "Reimburse $41.96 (Lyft)",
      category: "Approvals - Reimbursements",
      summary: "Madeline Hernandez submitted a transportation reimbursement request for $41.96 for Lyft ride during a conference.",
      employee: {
        name: "Madeline Hernandez",
        role: "Marketing Director",
        status: "Full Time",
        location: "Los Angeles, USA"
      },
      vendor: {
        name: "Lyft"
      },
      entity: "Acme Corp",
      purchaseDate: "Jan 10, 2025",
      checkDate: "Jan 13, 2025",
      amount: "$41.96",
      expenseCategory: "Transportation",
      paymentMethod: "Corporate Card",
      requestedOn: "Jan 20, 2025",
      changes: {
        current: "$0",
        new: "$41.96",
        amount: "$41.96"
      },
      note: "Hotel receipt attached. Conference dates confirmed."
    },
    4: {
      requestor: "Sarah Johnson",
      subject: "13h 57m time entry on Oct 26 - 27",
      category: "Approvals - Time and Attendance",
      summary: "Sarah Johnson is requesting to log 13 hours and 57 minutes of work time from October 26-27. This exceeds the standard 12-hour limit.",
      employee: {
        name: "Sarah Johnson",
        role: "Software Engineer",
        status: "Full Time",
        location: "Seattle, USA"
      },
      startTime: "9:00 AM",
      endTime: "10:57 PM",
      officeLocation: "Seattle Office",
      numberOfBreaks: "2",
      totalHours: "13h 57m",
      overtime: "1h 57m",
      requestedOn: "Jan 20, 2025",
      changes: {
        current: "0h 0m",
        new: "13h 57m",
        amount: "13h 57m"
      },
      note: "Time tracking shows overtime work on project deadline. Manager approval required for hours exceeding 12.",
      warning: "Exceeds 12 hours",
      comments: []
    },
    5: {
      requestor: "Michael Chen",
      subject: "Increase Jennifer Lee's salary to $95,000 (promotion to Senior Engineer)",
      category: "Approvals - HR Management",
      summary: "Michael Chen is requesting to increase Jennifer Lee's salary to $95,000 (promotion to Senior Engineer).",
      employee: {
        name: "Jennifer Lee",
        role: "Senior Engineer",
        status: "Full Time",
        location: "San Francisco, USA",
        department: "Product",
        manager: "Michael Chen",
        startDate: "June 1, 2021"
      },
      fieldName: "Salary",
      requestedOn: "Jan 20, 2025",
      reason: "promotion to Senior engineer",
      changes: {
        current: "$85,000",
        new: "$95,000",
        amount: "+$10,000"
      },
      note: "Performance review completed. Salary increase within approved range for Product Manager role.",
      comments: []
    },
    6: {
      requestor: "Emily Rodriguez",
      subject: "Reimburse $30.00 (Alaska Airlines)",
      category: "Approvals - Reimbursements",
      summary: "Emily Rodriguez submitted an expense request for $30.00 for Alaska Airlines.",
      employee: {
        name: "Emily Rodriguez",
        role: "Account Manager",
        status: "Full Time",
        location: "Chicago, USA"
      },
      vendor: {
        name: "Alaska Airlines"
      },
      entity: "Acme Corp",
      purchaseDate: "Jan 10, 2025",
      checkDate: "Jan 12, 2025",
      amount: "$30.00",
      expenseCategory: "Transportation",
      paymentMethod: "Credit Card",
      requestedOn: "Jan 20, 2025",
      changes: {
        current: "$0",
        new: "$30.00",
        amount: "$30.00"
      },
      note: "Receipt has been attached. Expense is within policy limits.",
      comments: [
        { id: 1, author: "Lisa Chen", text: "Client meeting was productive, expense justified.", timestamp: "15 min ago" }
      ]
    },
    7: {
      requestor: "David Park",
      subject: "8h 30m time entry on Oct 25",
      category: "Approvals - Time and Attendance",
      summary: "David Park is requesting to log 8 hours and 30 minutes of work time from October 25.",
      employee: {
        name: "David Park",
        role: "Designer",
        status: "Full Time",
        location: "Austin, USA"
      },
      startTime: "9:00 AM",
      endTime: "5:30 PM",
      officeLocation: "Austin Office",
      numberOfBreaks: "1",
      totalHours: "8h 30m",
      overtime: "0h 0m",
      requestedOn: "Jan 20, 2025",
      changes: {
        current: "0h 0m",
        new: "8h 30m",
        amount: "8h 30m"
      },
      note: "Standard work hours logged. No overtime required.",
      comments: []
    },
    8: {
      requestor: "Lisa Thompson",
      subject: "Increase Robert Wilson's PTO balance to 20 days",
      category: "Approvals - HR Management",
      summary: "Lisa Thompson is requesting to increase Robert Wilson's PTO balance to 20 days. If approved this change will be made immediately.",
      employee: {
        name: "Robert Wilson",
        role: "Senior Developer",
        status: "Full Time",
        location: "Denver, USA",
        department: "Engineering",
        manager: "Lisa Thompson",
        startDate: "January 10, 2019"
      },
      fieldName: "PTO balance",
      requestedOn: "Jan 20, 2025",
      changes: {
        current: "15 days",
        new: "20 days",
        amount: "+5 days"
      },
      note: "PTO balance increase requested. If approved this change will be made immediately.",
      warning: "Exceeds the approved band",
      comments: []
    },
    // Task data (for Inbox/Tasks page)
    101: {
      requestor: "HR Team",
      subject: "Take required cybersecurity course for Q4 certification",
      category: "Training",
      itemStatus: "Pending",
      summary: "You are required to complete the Cybersecurity Fundamentals course as part of Q4 certification requirements. This course covers essential security practices and must be completed before November 15, 2024.",
      courseName: "Cybersecurity Fundamentals",
      dueDate: "Jan 31, 2025",
      estimatedDuration: "3 hours",
      requestedOn: "Jan 16, 2025",
      note: "This is a mandatory training course for all employees. The course can be accessed through the learning portal and must be completed during business hours.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    102: {
      requestor: "Legal Department",
      subject: "Sign updated company policy document",
      category: "Documents",
      summary: "The Legal Department requires you to review and sign the updated Employee Handbook 2024. This document contains important policy updates and must be signed by October 30, 2024.",
      documentName: "Employee Handbook 2024",
      dueDate: "Jan 21, 2025",
      requestedOn: "Jan 17, 2025",
      note: "Please review all sections carefully, particularly the updates to the code of conduct and remote work policies. Electronic signature is acceptable.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    103: {
      requestor: "Onboarding Team",
      subject: "Take new hire Alex Martinez out to lunch",
      category: "Miscellaneous",
      summary: "Alex Martinez joined the team as a Software Engineer this week. Please take them out to lunch to help them feel welcome and integrated into the team. This is an important part of our onboarding process.",
      newHireName: "Alex Martinez",
      newHireRole: "Software Engineer",
      suggestedDate: "This week",
      requestedOn: "Jan 18, 2025",
      note: "Expenses up to $50 per person will be reimbursed. Please submit receipt for reimbursement. Suggested locations include nearby restaurants within walking distance of the office.",
      employee: {
        name: "Alex Martinez",
        role: "Software Engineer",
        status: "Full Time",
        location: "Office Location",
        startDate: "January 15, 2025",
        type: "Full-time",
        manager: "Michael Chen",
        officeLocation: "San Francisco Office"
      },
      startDate: "January 15, 2025",
      officeLocation: "San Francisco Office"
    },
    104: {
      requestor: "HR Team",
      subject: "Complete leadership development course",
      category: "Training",
      summary: "You have been selected to participate in the Leadership Essentials development program. This course is designed to enhance leadership skills and prepare you for management opportunities.",
      courseName: "Leadership Essentials",
      dueDate: "Jan 18, 2025",
      estimatedDuration: "8 hours",
      requestedOn: "Jan 4, 2025",
      note: "This course includes both online modules and an in-person workshop. The course is self-paced but must be completed by the due date. Materials will be provided through the learning portal.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    105: {
      requestor: "Legal Department",
      subject: "Sign non-disclosure agreement for new project",
      category: "Documents",
      summary: "You are being assigned to work on Project Phoenix, which requires signing a non-disclosure agreement due to the confidential nature of the project. This NDA must be signed before you can access project materials.",
      documentName: "NDA - Project Phoenix",
      dueDate: "Jan 10, 2025",
      requestedOn: "Jan 3, 2025",
      note: "This is a standard NDA covering confidential project information. Review the document carefully and direct any questions to the Legal Department. Signature is required to proceed with project access.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    106: {
      requestor: "Onboarding Team",
      subject: "Take new hire Sarah Kim out to lunch",
      category: "Miscellaneous",
      summary: "Sarah Kim recently joined the team as a Product Designer. Please take them out to lunch to help welcome them to the company and build team connections.",
      newHireName: "Sarah Kim",
      newHireRole: "Product Designer",
      suggestedDate: "This week",
      requestedOn: "Jan 2, 2025",
      dueDate: "Jan 16, 2025",
      note: "This is a great opportunity to share company culture and answer any questions they may have. Expenses up to $50 per person will be reimbursed. Submit receipt for reimbursement.",
      employee: {
        name: "Sarah Kim",
        role: "Product Designer",
        status: "Salaried, Full Time",
        location: "Office Location",
        startDate: "January 2, 2025",
        type: "Salaried",
        manager: "Jennifer Davis",
        officeLocation: "Seattle Office"
      },
      startDate: "January 2, 2025",
      officeLocation: "Seattle Office"
    },
    // Reviewed items
    9: {
      requestor: "James Wilson",
      subject: "Reimburse $125.00 (The Steakhouse)",
      category: "Approvals - Reimbursements",
      summary: "James Wilson submitted an expense request for $125.00 for a client dinner at The Steakhouse. This expense was approved and processed.",
      employee: {
        name: "James Wilson",
        role: "Sales Director",
        status: "Full Time",
        location: "Boston, USA"
      },
      vendor: {
        name: "The Steakhouse"
      },
      entity: "Acme Corp",
      purchaseDate: "Jan 14, 2025",
      checkDate: "Jan 19, 2025",
      amount: "$125.00",
      expenseCategory: "Meals & Entertainment",
      paymentMethod: "Credit Card",
      requestedOn: "Jan 15, 2025",
      reviewedOn: "Jan 19, 2025",
      reviewStatus: "Approved",
      changes: {
        current: "$0",
        new: "$125.00",
        amount: "$125.00"
      },
      note: "Client dinner receipt attached. Expense approved for business development purposes.",
      comments: []
    },
    10: {
      requestor: "Patricia Martinez",
      subject: "Request to update John Doe's vacation days from 10 to 15",
      category: "Approvals - HR Management",
      summary: "Patricia Martinez requested to update John Doe's vacation days from 10 to 15. This change was approved.",
      employee: {
        name: "John Doe",
        role: "Marketing Manager",
        status: "Full Time",
        location: "New York, USA",
        department: "Marketing",
        manager: "Patricia Martinez",
        startDate: "March 1, 2022"
      },
      fieldName: "Vacation days",
      requestedOn: "Jan 14, 2025",
      reviewedOn: "Jan 18, 2025",
      reviewStatus: "Approved",
      changes: {
        current: "10",
        new: "15",
        amount: "+5"
      },
      note: "Vacation day increase approved based on tenure and performance review.",
      comments: []
    },
    11: {
      requestor: "Robert Brown",
      subject: "Request to log 7h 45m from Jan 10",
      category: "Approvals - Time and Attendance",
      summary: "Robert Brown requested to log 7 hours and 45 minutes of work time from January 10. This request was rejected.",
      employee: {
        name: "Robert Brown",
        role: "Operations Manager",
        status: "Full Time",
        location: "Chicago, USA"
      },
      startTime: "8:00 AM",
      endTime: "3:45 PM",
      officeLocation: "Chicago Office",
      numberOfBreaks: "1",
      totalHours: "7h 45m",
      overtime: "0h 0m",
      requestedOn: "Jan 10, 2025",
      reviewedOn: "Jan 17, 2025",
      reviewStatus: "Rejected",
      changes: {
        current: "0h 0m",
        new: "7h 45m",
        amount: "7h 45m"
      },
      note: "Time log rejected due to insufficient documentation. Please resubmit with proper time tracking evidence.",
      comments: []
    },
    12: {
      requestor: "Jennifer Davis",
      subject: "Reimburse $89.50 (Tech Conference 2025)",
      category: "Approvals - Reimbursements",
      reviewStatus: "Rejected",
      itemStatus: "Rejected",
      summary: "Jennifer Davis submitted an expense request for $89.50 for conference registration. This request was rejected.",
      employee: {
        name: "Jennifer Davis",
        role: "Product Manager",
        status: "Full Time",
        location: "San Francisco, USA"
      },
      vendor: {
        name: "Tech Conference 2025"
      },
      entity: "Acme Corp",
      purchaseDate: "Jan 7, 2025",
      checkDate: "Jan 16, 2025",
      amount: "$89.50",
      expenseCategory: "Conference Registration",
      paymentMethod: "Credit Card",
      requestedOn: "Jan 8, 2025",
      reviewedOn: "Jan 16, 2025",
      changes: {
        current: "$0",
        new: "$89.50",
        amount: "$89.50"
      },
      note: "Conference registration rejected - conference attendance was not pre-approved. Please submit for approval before registering for future conferences.",
      comments: []
    },
    // Snoozed items
    13: {
      requestor: "William Taylor",
      subject: "Request to update Maria Garcia's department assignment",
      category: "Approvals - HR Management",
      summary: "William Taylor is requesting to update Maria Garcia's department assignment from Engineering to Data Science. This request has been snoozed.",
      employee: {
        name: "Maria Garcia",
        role: "Data Analyst",
        status: "Full Time",
        location: "Miami, USA",
        department: "Engineering",
        manager: "William Taylor",
        startDate: "August 15, 2023"
      },
      fieldName: "Department",
      requestedOn: "Jan 19, 2025",
      changes: {
        current: "Engineering",
        new: "Data Science",
        amount: "Transfer"
      },
      note: "Department transfer request. Currently snoozed until further review of organizational structure.",
      comments: []
    },
    14: {
      requestor: "Amanda White",
      subject: "Reimburse $234.00 (Corporate Catering)",
      category: "Approvals - Reimbursements",
      itemStatus: "Pending",
      summary: "Amanda White submitted an expense request for $234.00 for a team lunch. This request has been snoozed.",
      employee: {
        name: "Amanda White",
        role: "Team Lead",
        status: "Full Time",
        location: "Portland, USA"
      },
      vendor: {
        name: "Corporate Catering"
      },
      entity: "Acme Corp",
      purchaseDate: "Jan 17, 2025",
      amount: "$234.00",
      expenseCategory: "Meals & Entertainment",
      paymentMethod: "Credit Card",
      requestedOn: "Jan 18, 2025",
      changes: {
        current: "$0",
        new: "$234.00",
        amount: "$234.00"
      },
      note: "Team lunch expense. Currently snoozed pending budget approval for Q1 team events.",
      comments: []
    },
    // Created by me items
    15: {
      requestor: "Acme, Inc.",
      subject: "Request to update budget allocation for Q1 marketing campaign",
      category: "Approvals - HR Management",
      summary: "Request to update budget allocation for Q1 marketing campaign from $50,000 to $75,000.",
      employee: {
        name: "Marketing Team",
        role: "Department",
        status: "Active",
        location: "Corporate"
      },
      fieldName: "Budget",
      requestedOn: "Jan 19, 2025",
      changes: {
        current: "$50,000",
        new: "$75,000",
        amount: "+$25,000"
      },
      note: "Budget increase requested to support expanded Q1 marketing initiatives including digital advertising and event sponsorships.",
      comments: []
    },
    16: {
      requestor: "Acme, Inc.",
      subject: "Reimburse $156.78 (Software Inc.)",
      category: "Approvals - Reimbursements",
      summary: "Request to reimburse $156.78 for software subscription for project management tools.",
      employee: {
        name: "Acme, Inc.",
        role: "Organization",
        status: "Active",
        location: "Corporate"
      },
      vendor: {
        name: "Software Inc."
      },
      entity: "Acme Corp",
      purchaseDate: "Jan 17, 2025",
      amount: "$156.78",
      expenseCategory: "Software Subscription",
      paymentMethod: "Corporate Card",
      requestedOn: "Jan 18, 2025",
      changes: {
        current: "$0",
        new: "$156.78",
        amount: "$156.78"
      },
      note: "Monthly software subscription for project management platform. Subscription is required for team collaboration.",
      comments: []
    },
    17: {
      requestor: "Acme, Inc.",
      subject: "Request to log 9h 15m from Jan 15",
      category: "Approvals - Time and Attendance",
      summary: "Request to log 9 hours and 15 minutes of work time from January 15. This has been reviewed and approved.",
      employee: {
        name: "Acme, Inc.",
        role: "Organization",
        status: "Active",
        location: "Headquarters"
      },
      startTime: "8:00 AM",
      endTime: "5:15 PM",
      officeLocation: "Headquarters",
      numberOfBreaks: "2",
      totalHours: "9h 15m",
      overtime: "0h 0m",
      requestedOn: "Jan 15, 2025",
      reviewedOn: "Jan 19, 2025",
      reviewStatus: "Approved",
      changes: {
        current: "0h 0m",
        new: "9h 15m",
        amount: "9h 15m"
      },
      note: "Standard work hours logged. Time approved and processed.",
      comments: []
    },
    // Reviewed tasks
    107: {
      requestor: "HR Team",
      subject: "Complete annual performance review",
      category: "Training",
      summary: "Annual performance review completion required for all employees. This task has been completed.",
      courseName: "Performance Review Process",
      dueDate: "Jan 15, 2025",
      estimatedDuration: "2 hours",
      requestedOn: "Jan 5, 2025",
      reviewedOn: "Jan 12, 2025",
      reviewStatus: "Completed",
      note: "Performance review has been completed and submitted. All required sections have been filled out.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    108: {
      requestor: "Legal Department",
      subject: "Sign updated privacy policy",
      category: "Documents",
      summary: "Updated privacy policy requires signature from all employees. This document has been signed and completed.",
      documentName: "Privacy Policy 2025",
      dueDate: "Jan 8, 2025",
      requestedOn: "Jan 1, 2025",
      reviewedOn: "Jan 10, 2025",
      reviewStatus: "Completed",
      note: "Privacy policy document has been reviewed and signed. Electronic signature recorded on January 10, 2025.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    // Snoozed tasks
    109: {
      requestor: "HR Team",
      subject: "Complete diversity and inclusion training",
      category: "Training",
      summary: "Mandatory diversity and inclusion training for all employees. This task has been snoozed.",
      courseName: "Diversity & Inclusion",
      dueDate: "Jan 30, 2025",
      estimatedDuration: "2 hours",
      requestedOn: "Jan 16, 2025",
      note: "Training has been snoozed until next week. Will be completed before the due date.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    // Created by me tasks
    110: {
      requestor: "Acme, Inc.",
      subject: "Review Q1 strategic planning document",
      category: "Documents",
      summary: "Strategic planning document requires review and approval for Q1 initiatives.",
      documentName: "Q1 Strategic Plan 2025",
      dueDate: "Jan 25, 2025",
      requestedOn: "Jan 18, 2025",
      note: "Strategic planning document outlines key initiatives and goals for Q1 2025. Review required before final approval.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    111: {
      requestor: "Acme, Inc.",
      subject: "Complete team building activity",
      category: "Miscellaneous",
      summary: "Quarterly team building activity completion. This activity has been completed.",
      newHireName: "Team Event",
      newHireRole: "Activity",
      suggestedDate: "This month",
      dueDate: "Jan 20, 2025",
      requestedOn: "Jan 17, 2025",
      reviewedOn: "Jan 19, 2025",
      reviewStatus: "Completed",
      note: "Team building activity completed successfully. Event included team lunch and collaborative exercises.",
      employee: {
        name: "Team",
        role: "Group",
        status: "Active",
        location: "Office Location"
      }
    },
    112: {
      requestor: "Payroll Team",
      subject: "Submit amendment for MI state Wh filing",
      category: "Payroll",
      itemStatus: "Pending",
      summary: "The employer account number is missing, preventing your filing from being submitted to the agency. Consequently, if you have a tax liability for this period, payments may be affected. To allow Rippling to submit a re-file and/or payment and ensure future filings are not impacted, you must enter the account number in your Rippling tax settings. Please reach out to Rippling Support if a re-file and payment need to be submitted.",
      dueDate: "Jan 25, 2025",
      requestedOn: "Jan 21, 2025",
      isCritical: true,
      entity: "White and Sons, US Pty Ltd",
      filing: "MI State Wh Filing",
      agency: "PASW",
      accountNumber: "Missing",
      accountNumberMissing: true,
      note: "This is a critical filing that requires immediate attention. The missing account number prevents submission and may affect tax payments.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    },
    113: {
      requestor: "Payroll Team",
      subject: "Submit amendment for CA state UI filing",
      category: "Payroll",
      itemStatus: "Pending",
      summary: "The employer account number is missing, preventing your filing from being submitted to the agency. Consequently, if you have a tax liability for this period, payments may be affected. To allow Rippling to submit a re-file and/or payment and ensure future filings are not impacted, you must enter the account number in your Rippling tax settings. Please reach out to Rippling Support if a re-file and payment need to be submitted.",
      dueDate: "Jan 22, 2025",
      requestedOn: "Jan 18, 2025",
      isCritical: true,
      entity: "Tech Solutions Inc",
      filing: "CA State UI Filing",
      agency: "EDD",
      accountNumber: "Missing",
      accountNumberMissing: true,
      note: "This is a critical filing that requires immediate attention. The missing account number prevents submission and may affect tax payments. California Employment Development Department (EDD) requires the employer account number for all UI filings.",
      employee: {
        name: "You",
        role: "Employee",
        status: "Full Time",
        location: "Current Location"
      }
    }
  }

  const approval = selectedItem ? approvalData[selectedItem] : null

  const hasSelectedItems = selectedItems?.size > 0 || false
  
  // Handler functions for metadata modal
  const handleOpenMetadataModal = (category: string) => {
    const categoryKey = category.replace("Approvals - ", "")
    const currentFields = selectedMetadataFields[categoryKey] || new Set(getDefaultVisibleFields(category))
    setTempSelectedFields(new Set(currentFields))
    setCurrentCategory(category)
    setMetadataModalOpen(true)
  }
  
  const handleCloseMetadataModal = () => {
    setMetadataModalOpen(false)
    setTempSelectedFields(new Set())
    setCurrentCategory("")
  }
  
  const handleToggleField = (fieldId: string) => {
    setTempSelectedFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId)
      } else {
        newSet.add(fieldId)
      }
      return newSet
    })
  }
  
  const handleSaveMetadataFields = async () => {
    if (!currentCategory) return
    
    setMetadataLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const categoryKey = currentCategory.replace("Approvals - ", "")
    setSelectedMetadataFields(prev => ({
      ...prev,
      [categoryKey]: new Set(tempSelectedFields)
    }))
    
    setMetadataLoading(false)
    handleCloseMetadataModal()
  }
  
  // Get visible fields for current approval
  const getVisibleFields = (category: string) => {
    const categoryKey = category.replace("Approvals - ", "")
    return selectedMetadataFields[categoryKey] || new Set(getDefaultVisibleFields(category))
  }
  
  // Get all available approval IDs (excluding removed items, filtered by page)
  const getAllApprovalIds = () => {
    const allIds = Object.keys(approvalData).map(id => Number(id))
    const filteredIds = allIds.filter(id => {
      if (removedItems.has(id)) return false
      const approval = approvalData[id]
      if (!approval) return false
      
      // Filter by page type
      // Filter by page type (only tasks page now)
      // Tasks page shows both approvals and tasks
      return true
    })
    return filteredIds
  }
  
  // Calculate current position and total count
  const allApprovalIds = getAllApprovalIds()
  const currentPosition = selectedItem ? allApprovalIds.indexOf(selectedItem) + 1 : 0
  const totalCount = allApprovalIds.length
  const isFirstItem = currentPosition === 1
  const isLastItem = currentPosition === totalCount
  
  // Navigation handlers
  const handlePreviousItem = () => {
    if (currentPosition > 1 && onSelectItem) {
      const previousIndex = currentPosition - 2
      const previousId = allApprovalIds[previousIndex]
      onSelectItem(previousId)
    }
  }
  
  const handleNextItem = () => {
    if (currentPosition < totalCount && onSelectItem) {
      const nextIndex = currentPosition
      const nextId = allApprovalIds[nextIndex]
      onSelectItem(nextId)
    }
  }
  
  const isSplitView = backgroundColor === "white"

  if (!selectedItem || !approval) {
    return (
      <div className={`${backgroundColor === "white" ? "flex-1 flex flex-col min-h-0" : "h-full flex flex-col"} ${backgroundColor === "white" ? "" : "bg-[#FAF9F7]"}`}
        style={backgroundColor === "white" ? { backgroundColor: 'white' } : {}}
      >
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a task to view details</p>
        </div>
      </div>
    )
  }
  const initials = approval.employee?.name ? approval.employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : ""

  // Helper function to get avatar path for employee
  const getEmployeeAvatar = (employeeName: string): string | null => {
    if (!employeeName || employeeName === "You") return null
    const normalizedName = employeeName.toLowerCase().replace(/\s+/g, '-')
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
      'william-taylor.jpg'
    ]
    const exactMatch = avatarFiles.find(file => 
      file.toLowerCase().startsWith(normalizedName) || 
      file.toLowerCase().replace(/\.(jpg|png)$/, '') === normalizedName
    )
    return exactMatch ? `/avatars/${exactMatch}` : null
  }

  // Helper function to get vendor avatar
  const getVendorAvatar = (vendorName: string): string | null => {
    if (!vendorName) return null
    const normalizedName = vendorName.toLowerCase()
    
    // Check for exact matches first
    if (normalizedName.includes('alaska')) {
      // Try to find alaska airlines file - it might be "alaska airlines.png" or just "alaska"
      return "/avatars/alaska airlines.png"
    }
    if (normalizedName.includes('lyft')) {
      return "/avatars/lyft.jpg"
    }
    if (normalizedName.includes('uber')) {
      return "/avatars/uber.png"
    }
    
    return null
  }

  // Helper function to get the appropriate avatar based on category
  const getDetailAvatar = (): string | null => {
    if (approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements") {
      return getVendorAvatar(approval.vendor?.name || "")
    } else if (approval.category === "Training") {
      return "/avatars/training.png"
    } else if (approval.category === "Documents") {
      return "/avatars/document.png"
    } else if (approval.category === "Payroll") {
      return "/avatars/entity.png"
    } else if (approval.category === "Miscellaneous") {
      return getEmployeeAvatar(approval.newHireName || "")
    } else if (approval.category === "HR Management" || approval.category === "Approvals - HR Management" || 
               approval.category === "Time and Attendance" || approval.category === "Approvals - Time and Attendance") {
      return getEmployeeAvatar(approval.employee?.name || "")
    }
    return null
  }

  const detailAvatar = getDetailAvatar()

  // Helper function to get receipt image path
  const getReceiptImage = (): string | null => {
    if (approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements") {
      const vendorName = approval.vendor?.name?.toLowerCase() || ""
      if (vendorName.includes("alaska")) {
        return "/receipts/alaska-airlines.png"
      } else if (vendorName.includes("lyft")) {
        return "/receipts/lyft.png"
      } else if (vendorName.includes("uber")) {
        return "/receipts/uber.png"
      }
    }
    return null
  }

  const receiptImage = getReceiptImage()

  const handleTooltipMouseEnter = (e: React.MouseEvent<HTMLElement>, tooltipId: string, content: React.ReactNode) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }
    const target = e.currentTarget
    if (!target) return
    
    tooltipTimeoutRef.current = setTimeout(() => {
      if (!target || !document.body.contains(target)) {
        return
      }
      try {
        const rect = target.getBoundingClientRect()
        const tooltipWidth = 320
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
          id: tooltipId,
          x: x,
          y: y,
          content: content,
          side: side
        })
      } catch (error) {
        return
      }
    }, 100)
  }

  const handleTooltipMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
      tooltipTimeoutRef.current = null
    }
    setTooltipData({ id: null, x: 0, y: 0, content: null, side: 'right' })
  }

  const getFieldTooltipContent = (label: string, value: string) => (
    <div className="flex flex-col p-3">
      <div className="flex flex-col" style={{ marginBottom: '10px' }}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
              {label}
            </span>
          </div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
        <div style={{ marginBottom: '0' }}>
          <div className="text-xs text-gray-500">Value</div>
          <div className="text-xs text-gray-900 font-medium">{value}</div>
        </div>
      </div>
    </div>
  )

  return (
    <>
    <div className={`${backgroundColor === "white" ? "flex-1 flex flex-col min-h-0" : "h-full flex flex-col"} ${backgroundColor === "white" ? "" : "bg-[#FAF9F7]"}`}
      style={backgroundColor === "white" ? { backgroundColor: 'white' } : {}}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={`${isSplitView ? "p-4" : "p-6"} border-b border-gray-200 flex-shrink-0`}>
          {/* Back button and navigation for full-width mode */}
          {viewMode === "full-width" && !isSplitView && selectedItem && (
            <div className="flex items-center justify-between mb-4">
              <PebbleButton
                size={ButtonSizes.S}
                appearance={ButtonAppearances.GHOST}
                onClick={() => {
                  if (onSelectItem) {
                    onSelectItem(null)
                  }
                }}
                className="h-8 px-2 gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </PebbleButton>
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Request {currentPosition} of {totalCount}</span>
                  <div className="flex items-center gap-1">
                    <PebbleButton
                      size={ButtonSizes.S}
                      appearance={ButtonAppearances.GHOST}
                      className="h-8 w-8"
                      onClick={handlePreviousItem}
                      disabled={isFirstItem}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </PebbleButton>
                    <PebbleButton
                      size={ButtonSizes.S}
                      appearance={ButtonAppearances.GHOST}
                      className="h-8 w-8"
                      onClick={handleNextItem}
                      disabled={isLastItem}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </PebbleButton>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={`flex items-center justify-between ${isSplitView ? "mb-3" : "mb-4"}`}>
            <div className={`flex items-center flex-1 min-w-0 ${isSplitView ? "gap-2" : "gap-4"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-gray-900 break-words" style={{ fontSize: '18px', lineHeight: '22px', fontWeight: 500 }}>{approval.subject}</h1>
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
                  {approval.dueDate && (
                    <span 
                      className="flex flex-row justify-center items-center rounded-full flex-shrink-0"
                      style={{
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        paddingTop: '0px',
                        paddingBottom: '0px',
                        gap: '2px',
                        position: 'relative',
                        minWidth: 'fit-content',
                        maxWidth: '320px',
                        height: '16px',
                        background: '#EDEBE7',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontFamily: 'Basel Grotesk',
                        fontWeight: 500,
                        color: '#1F2937'
                      }}
                    >
                      Due {approval.dueDate}
                    </span>
                  )}
                </div>
                <div className={`flex items-center ${isSplitView ? "gap-2 mt-0" : "gap-4 mt-0.5"}`}>
                  <p className="text-gray-600" style={{ fontSize: '14px', lineHeight: '20px' }}>
                    By {approval.requestor} - {approval.requestedOn || new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-12">
              {parentActiveTab === "reviewed" ? (
                <div className="inline-flex items-center gap-1">
                  <div className={`rounded-full shrink-0 ${
                    (() => {
                      return approval?.reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                        approval?.reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                        approval?.reviewStatus === "Completed" ? "bg-[#2780CE]" :
                        "bg-gray-400"
                    })()
                  }`} style={{ width: '8px', height: '8px' }} />
                  <span className="text-sm text-gray-900">
                    {approval?.reviewStatus || '--'}
                  </span>
                </div>
              ) : (parentActiveTab === "all" || parentActiveTab === "created") ? (
                <div className="inline-flex items-center gap-1">
                  <div className={`rounded-full shrink-0 ${
                    (() => {
                      return approval?.itemStatus === "Approved" ? "bg-[#2D8A70]" :
                        approval?.itemStatus === "Rejected" ? "bg-[#E4633C]" :
                        approval?.itemStatus === "Completed" ? "bg-[#2780CE]" :
                        approval?.itemStatus === "Pending" ? "bg-[#F59701]" :
                        approval?.reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                        approval?.reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                        approval?.reviewStatus === "Completed" ? "bg-[#2780CE]" :
                        "bg-gray-400"
                    })()
                  }`} style={{ width: '8px', height: '8px' }} />
                  <span className="text-sm text-gray-900">
                    {approval?.itemStatus || approval?.reviewStatus || '--'}
                  </span>
                </div>
              ) : (parentActiveTab === "pending" || parentActiveTab === "snoozed") ? (
                <div className="inline-flex items-center gap-1">
                  <div className="rounded-full shrink-0 bg-[#F59701]" style={{ width: '8px', height: '8px' }} />
                  <span className="text-sm text-gray-900">
                    Pending
                  </span>
                </div>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              )}
              <PebbleButton size={ButtonSizes.M} appearance={ButtonAppearances.GHOST} className="h-10 w-10 p-0">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </PebbleButton>
            </div>
          </div>

          <div className={`flex ${isSplitView ? "gap-1.5" : "gap-2"}`}>
            <Button 
              variant={activeTab === "Overview" ? "default" : "ghost"} 
              size="sm"
              className={`${isSplitView ? "h-9 text-sm px-3" : "h-10 text-base px-4"} ${activeTab === "Overview" ? "bg-[rgb(231,225,222)] text-black hover:bg-[rgb(231,225,222)]" : ""}`}
              onClick={() => setActiveTab("Overview")}
            >
              Overview
            </Button>
            {/* Always show all tabs for approval requests */}
            {(page === "approvals" || !(approval.category === "Training" || approval.category === "Documents" || approval.category === "Miscellaneous" || approval.category === "Payroll")) && (
              <>
                <Button 
                  variant={activeTab === "Approval Process" ? "default" : "ghost"} 
                  size="sm"
                  className={`${isSplitView ? "h-9 text-sm px-3" : "h-10 text-base px-4"} ${activeTab === "Approval Process" ? "bg-[rgb(231,225,222)] text-black hover:bg-[rgb(231,225,222)]" : ""}`}
                  onClick={() => setActiveTab("Approval Process")}
                >
                  Approval Process
                </Button>
                <Button 
                  variant={activeTab === "Policy" ? "default" : "ghost"} 
                  size="sm"
                  className={`${isSplitView ? "h-9 text-sm px-3" : "h-10 text-base px-4"} ${activeTab === "Policy" ? "bg-[rgb(231,225,222)] text-black hover:bg-[rgb(231,225,222)]" : ""}`}
                  onClick={() => setActiveTab("Policy")}
                >
                  Policy
                </Button>
              </>
            )}
            <Button 
              variant={activeTab === "Activity log" ? "default" : "ghost"} 
              size="sm"
              className={`${isSplitView ? "h-9 text-sm px-3" : "h-10 text-base px-4"} ${activeTab === "Activity log" ? "bg-[rgb(231,225,222)] text-black hover:bg-[rgb(231,225,222)]" : ""}`}
              onClick={() => setActiveTab("Activity log")}
            >
              Activity log
            </Button>
            {/* Always show Comments tab for approval requests */}
            {(page === "approvals" || !(approval.category === "Training" || approval.category === "Documents" || approval.category === "Miscellaneous" || approval.category === "Payroll")) && (
              <Button 
                variant={activeTab === "Comments" ? "default" : "ghost"} 
                size="sm"
                className={`${isSplitView ? "h-9 text-sm px-3" : "h-10 text-base px-4"} ${activeTab === "Comments" ? "bg-[rgb(231,225,222)] text-black hover:bg-[rgb(231,225,222)]" : ""}`}
                onClick={() => setActiveTab("Comments")}
              >
                Comments
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#FAFAFA' }}>
          {page === "approvals" ? (
            // For approval requests, show white iframe for all tabs
            <div className="flex-1 flex items-center justify-center bg-white min-h-0">
              <iframe
                srcDoc="<html><head><style>body { margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui, -apple-system, sans-serif; color: #666; font-size: 16px; }</style></head><body>Request details go here</body></html>"
                className="w-full h-full border-0"
                style={{ backgroundColor: 'white', display: 'block' }}
              />
            </div>
          ) : page !== "approvals" && activeTab === "Overview" && (
            <div className="flex-1 overflow-y-auto min-h-0" style={{ backgroundColor: '#F9F7F6' }}>
              <div className="p-6 pb-20">
                <div className={`${isSplitView ? "space-y-3" : "space-y-6"}`}>
                  {/* Request Summary - Show only when parentActiveTab is "opt4" and not for Training, Documents, or Miscellaneous */}
                  {parentActiveTab === "opt4" && approval.summary && 
                   !(approval.category === "Training" || approval.category === "Documents" || approval.category === "Miscellaneous" || approval.category === "Payroll") && (
                    <div>
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden">
                        <div className="p-4">
                          <h2 className="mb-2" style={{ fontSize: '16px', lineHeight: '24px', color: '#05142E', fontWeight: 500 }}>Request Summary</h2>
                          <p className="text-sm leading-relaxed" style={{ color: '#05142E' }}>{approval.summary}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {approval.category === "Payroll" && (approval.entity || approval.filing || approval.agency || approval.accountNumber || approval.dueDate || approval.requestedOn) ? (
                        <h2 
                          className="text-lg text-gray-900 cursor-help" 
                          style={{ fontWeight: 500 }}
                          onMouseEnter={(e) => handleTooltipMouseEnter(e, 'filing-info', (
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
                                  <div style={{ marginBottom: '10px' }}>
                                    <div className="text-xs text-gray-500">Entity</div>
                                    <div className="text-xs text-gray-900 font-medium">{approval.entity}</div>
                                  </div>
                                )}
                                {approval.filing && (
                                  <div style={{ marginBottom: '10px' }}>
                                    <div className="text-xs text-gray-500">Filing</div>
                                    <div className="text-xs text-gray-900 font-medium">{approval.filing}</div>
                                  </div>
                                )}
                                {approval.agency && (
                                  <div style={{ marginBottom: '10px' }}>
                                    <div className="text-xs text-gray-500">Agency</div>
                                    <div className="text-xs text-gray-900 font-medium">{approval.agency}</div>
                                  </div>
                                )}
                                {approval.accountNumber && (
                                  <div style={{ marginBottom: '10px' }}>
                                    <div className="text-xs text-gray-500">Account number</div>
                                    <div className="text-xs text-gray-900 font-medium">{approval.accountNumber}</div>
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
                          ))}
                          onMouseLeave={handleTooltipMouseLeave}
                        >
                          Filing Information
                        </h2>
                      ) : (
                        <h2 className="text-lg text-gray-900" style={{ fontWeight: 500 }}>
                          {(approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements") ? "Expense Details" : 
                           approval.category === "Training" ? "Course Information" :
                           approval.category === "Documents" ? "Document Information" :
                           approval.category === "Miscellaneous" ? "New Hire Information" :
                           "Impacted Employee"}
                        </h2>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          {detailAvatar ? (
                            <div className="h-12 w-12 rounded-full flex-shrink-0 overflow-hidden relative">
                              <Image
                                src={detailAvatar}
                                alt={
                                  (approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements")
                                    ? approval.vendor?.name || "Vendor"
                                    : approval.category === "Training"
                                    ? approval.courseName || "Course"
                                    : approval.category === "Documents"
                                    ? approval.documentName || "Document"
                                    : approval.category === "Miscellaneous"
                                    ? approval.newHireName || "New Hire"
                                    : approval.category === "Payroll"
                                    ? approval.filing || "Filing"
                                    : approval.employee?.name || "Employee"
                                }
                                fill
                                className="rounded-full object-cover"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-normal text-lg">
                              {(approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements")
                                ? approval.vendor?.name?.charAt(0) || "V"
                                : approval.category === "Training"
                                ? approval.courseName?.charAt(0) || "C"
                                : approval.category === "Documents"
                                ? approval.documentName?.charAt(0) || "D"
                                : approval.category === "Miscellaneous"
                                ? approval.newHireName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || "N"
                                : approval.category === "Payroll"
                                ? approval.filing?.charAt(0) || "F"
                                : initials
                              }
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-normal text-gray-900">
                              {(approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements")
                                ? approval.changes?.new || "Expense"
                                : approval.category === "Training"
                                ? approval.courseName || "Course"
                                : approval.category === "Documents"
                                ? approval.documentName || "Document"
                                : approval.category === "Miscellaneous"
                                ? approval.newHireName || "New Hire"
                                : approval.category === "Payroll"
                                ? approval.filing || "Filing"
                                : approval.employee?.name || "Employee"
                              }
                            </h4>
                            <p className="text-sm text-gray-600">
                              {(approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements")
                                ? approval.vendor?.name || "Vendor"
                                : approval.category === "Training"
                                ? `Estimated duration: ${approval.estimatedDuration || "N/A"}`
                                : approval.category === "Documents"
                                ? approval.documentName || "Document"
                                : approval.category === "Miscellaneous"
                                ? `${approval.newHireRole || "Employee"} - ${approval.suggestedDate || "TBD"}`
                                : approval.category === "Payroll"
                                ? `${approval.entity || "Entity"} - ${approval.agency || "Agency"}`
                                : `${approval.employee?.role || "Employee"} - ${approval.employee?.status || "N/A"}`
                              }
                            </p>
                            {(approval.category !== "Reimbursements" && approval.category !== "Approvals - Reimbursements" && approval.category !== "Training" && approval.category !== "Documents" && approval.category !== "Payroll") && (
                              <p className="text-sm text-gray-600">{approval.employee?.location}</p>
                            )}
                          </div>
                           {(approval.category === "HR Management" || approval.category === "Approvals - HR Management") && (
                             <PebbleButton
                               size={ButtonSizes.M}
                               appearance={ButtonAppearances.OUTLINE}
                               onClick={() => {
                                 // Handle view employee profile action
                               }}
                             >
                               View employee profile
                               <ArrowUpRight className="h-4 w-4 ml-2" />
                             </PebbleButton>
                           )}
                           {(approval.category === "Miscellaneous") && (
                             <PebbleButton
                               size={ButtonSizes.M}
                               appearance={ButtonAppearances.OUTLINE}
                               onClick={() => {
                                 // Handle view employee profile action
                               }}
                             >
                               View employee profile
                               <ArrowUpRight className="h-4 w-4 ml-2" />
                             </PebbleButton>
                           )}
                           {(approval.category === "Time and Attendance" || approval.category === "Approvals - Time and Attendance") && (
                             <div className="flex items-center gap-2">
                               <PebbleButton
                                 size={ButtonSizes.M}
                                 appearance={ButtonAppearances.OUTLINE}
                                 onClick={() => {
                                   // Handle view in time sheets action
                                 }}
                               >
                                 View in time sheets
                                 <ArrowUpRight className="h-4 w-4 ml-2" />
                               </PebbleButton>
                               <PebbleButton
                                 size={ButtonSizes.M}
                                 appearance={ButtonAppearances.OUTLINE}
                                 onClick={() => {
                                   // Handle view employee profile action
                                 }}
                               >
                                 View Employee profile
                                 <ArrowUpRight className="h-4 w-4 ml-2" />
                               </PebbleButton>
                             </div>
                           )}
                         </div>
                       {(approval.category === "HR Management" || approval.category === "Approvals - HR Management") && (
                           <>
                             <div className="border-t border-gray-200 my-4"></div>
                             {metadataLoading ? (
                               <div className="inline-grid grid-cols-3 gap-6">
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex flex-wrap items-start gap-6">
                                 {getVisibleFields(approval.category).has("numberOfChanges") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Number of changes</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.numberOfChanges || "1"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("changeEffectDate") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Change effect date</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.changeEffectDate || approval.requestedOn || "16 January 2025"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("reason") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Reason</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.reason || "None"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("department") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Department</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.department || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("manager") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Manager</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.manager || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("employmentType") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Employment type</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.employmentType || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("startDate") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Start date</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.startDate || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("location") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Location</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.location || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {approval.warning && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Warnings</span>
                                     <div className="mt-1">
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'warning', (
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
                                                 <div className="text-xs text-gray-900 font-medium">
                                                   {approval.warning === "Exceeds the approved band" 
                                                     ? `This new value exceeds the approved band for ${approval.employee?.role || "this role"}. The approved range for ${approval.employee?.role || "this role"} is typically lower than the requested amount.`
                                                     : approval.warning === "Exceeds 12 hours"
                                                     ? "This time entry exceeds 12 hours. Please verify the start and end times are correct."
                                                     : approval.warning}
                                                 </div>
                                               </div>
                                             </div>
                                           </div>
                                         ))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help inline-block"
                                       >
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
                                       </div>
                                     </div>
                                   </div>
                                 )}
                                 <div className="ml-auto">
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 border border-gray-200"
                                     onClick={() => handleOpenMetadataModal(approval.category)}
                                     disabled={metadataLoading}
                                   >
                                     <Settings className="h-4 w-4" />
                                   </Button>
                                 </div>
                               </div>
                             )}
                           </>
                         )}
                       {(approval.category === "Miscellaneous") && (
                           <>
                             <div className="border-t border-gray-200 my-4"></div>
                             {metadataLoading ? (
                               <div className="inline-grid grid-cols-3 gap-6">
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex flex-wrap items-start gap-6">
                                 {getVisibleFields(approval.category).has("startDate") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Start date</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.startDate || approval.startDate || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("type") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Type</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.type || (approval.employee?.status?.includes("Salaried") ? "Salaried" : approval.employee?.status?.includes("Full Time") ? "Full-time" : "N/A")}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("manager") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Manager</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.manager || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("officeLocation") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Office location</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.employee?.officeLocation || approval.officeLocation || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 <div className="ml-auto">
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 border border-gray-200"
                                     onClick={() => handleOpenMetadataModal(approval.category)}
                                     disabled={metadataLoading}
                                   >
                                     <Settings className="h-4 w-4" />
                                   </Button>
                                 </div>
                               </div>
                             )}
                           </>
                         )}
                       {(approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements") && (
                           <>
                             <div className="border-t border-gray-200 my-4"></div>
                             {metadataLoading ? (
                               <div className="inline-grid grid-cols-3 gap-6">
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex flex-wrap items-start gap-6">
                                 {getVisibleFields(approval.category).has("purchaser") && (
                                   <div className="min-w-[120px]">
                                      {approval.requestor ? (
                                        <div
                                          onMouseEnter={(e) => handleTooltipMouseEnter(e, 'purchaser', (
                                            <div className="flex flex-col p-3">
                                              <div className="flex flex-col" style={{ marginBottom: '10px' }}>
                                                <div className="flex items-center gap-2">
                                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                                                      Purchaser
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
                                                <div style={{ marginBottom: '0' }}>
                                                  <div className="text-xs text-gray-500">Value</div>
                                                  <div className="text-xs text-gray-900 font-medium">{approval.requestor}</div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          onMouseLeave={handleTooltipMouseLeave}
                                          className="cursor-help"
                                        >
                                          <span className="text-sm text-gray-600">Purchaser</span>
                                          <p className="text-sm font-normal text-gray-900 mt-1">
                                            {approval.requestor}
                                          </p>
                                        </div>
                                      ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Purchaser</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("purchaseDate") && (
                                   <div className="min-w-[120px]">
                                      {approval.purchaseDate && approval.purchaseDate !== "N/A" ? (
                                        <div
                                          onMouseEnter={(e) => handleTooltipMouseEnter(e, 'purchase-date', (
                                            <div className="flex flex-col p-3">
                                              <div className="flex flex-col" style={{ marginBottom: '10px' }}>
                                                <div className="flex items-center gap-2">
                                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className="font-medium text-gray-900 break-words" style={{ fontSize: '14px', lineHeight: '20px' }}>
                                                      Purchase date
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                              <div style={{ borderTop: '1px solid #D5D3D0', paddingTop: '10px', paddingBottom: '0' }}>
                                                <div style={{ marginBottom: '0' }}>
                                                  <div className="text-xs text-gray-500">Value</div>
                                                  <div className="text-xs text-gray-900 font-medium">{approval.purchaseDate}</div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          onMouseLeave={handleTooltipMouseLeave}
                                          className="cursor-help"
                                        >
                                          <span className="text-sm text-gray-600">Purchase date</span>
                                          <p className="text-sm font-normal text-gray-900 mt-1">
                                            {approval.purchaseDate}
                                          </p>
                                        </div>
                                      ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Purchase date</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("checkDate") && (
                                   <div className="min-w-[120px]">
                                     {approval.checkDate && approval.checkDate !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'check-date', getFieldTooltipContent('Check date', approval.checkDate))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Check date</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           {approval.checkDate}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Check date</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("entity") && (
                                   <div className="min-w-[120px]">
                                     {approval.entity && approval.entity !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'entity', getFieldTooltipContent('Entity', approval.entity))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Entity</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           {approval.entity}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Entity</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("category") && (
                                   <div className="min-w-[120px]">
                                     {approval.expenseCategory && approval.expenseCategory !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'category', getFieldTooltipContent('Category', approval.expenseCategory))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Category</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           {approval.expenseCategory}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Category</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {approval.trip && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Linked trip</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.trip.name || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("paymentMethod") && (
                                   <div className="min-w-[120px]">
                                     {approval.paymentMethod && approval.paymentMethod !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'payment-method', getFieldTooltipContent('Payment method', approval.paymentMethod))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Payment method</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           {approval.paymentMethod}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Payment method</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {approval.warning && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Warnings</span>
                                     <div className="mt-1">
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'warning', (
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
                                                 <div className="text-xs text-gray-900 font-medium">
                                                   {approval.warning === "Potential duplicate detected"
                                                     ? "A similar expense has been detected. Please verify this is not a duplicate submission."
                                                     : approval.warning}
                                                 </div>
                                               </div>
                                             </div>
                                           </div>
                                         ))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help inline-block"
                                       >
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
                                       </div>
                                     </div>
                                   </div>
                                 )}
                                 <div className="ml-auto">
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 border border-gray-200"
                                     onClick={() => handleOpenMetadataModal(approval.category)}
                                     disabled={metadataLoading}
                                   >
                                     <Settings className="h-4 w-4" />
                                   </Button>
                                 </div>
                               </div>
                             )}
                           </>
                         )}
                       {(approval.category === "Time and Attendance" || approval.category === "Approvals - Time and Attendance") && (
                           <>
                             <div className="border-t border-gray-200 my-4"></div>
                             {metadataLoading ? (
                               <div className="inline-grid grid-cols-4 gap-6">
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex flex-wrap items-start gap-6">
                                 {getVisibleFields(approval.category).has("duration") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Duration</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.changes?.new || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("startTime") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Start time</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.startTime || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("endTime") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">End time</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.endTime || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("unpaidBreak") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Unpaid break</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       30 min
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("officeLocation") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Office location</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.officeLocation || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("numberOfBreaks") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Number of breaks</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.numberOfBreaks || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("totalHours") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Total hours</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.totalHours || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("overtime") && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Overtime</span>
                                     <p className="text-sm font-normal text-gray-900 mt-1">
                                       {approval.overtime || "N/A"}
                                     </p>
                                   </div>
                                 )}
                                 {approval.warning && (
                                   <div className="min-w-[120px]">
                                     <span className="text-sm text-gray-600">Warnings</span>
                                     <div className="mt-1">
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'warning', (
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
                                                 <div className="text-xs text-gray-900 font-medium">
                                                   {approval.warning === "Exceeds 12 hours"
                                                     ? "This time entry exceeds 12 hours. Please verify the start and end times are correct."
                                                     : approval.warning}
                                                 </div>
                                               </div>
                                             </div>
                                           </div>
                                         ))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help inline-block"
                                       >
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
                                       </div>
                                     </div>
                                   </div>
                                 )}
                                 <div className="ml-auto">
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 border border-gray-200"
                                     onClick={() => handleOpenMetadataModal(approval.category)}
                                     disabled={metadataLoading}
                                   >
                                     <Settings className="h-4 w-4" />
                                   </Button>
                                 </div>
                               </div>
                             )}
                           </>
                         )}
                       {(approval.category === "Payroll") && (
                           <>
                             <div className="border-t border-gray-200 my-4"></div>
                             {metadataLoading ? (
                               <div className="inline-grid grid-cols-3 gap-6">
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                                 <div className="animate-pulse">
                                   <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                                   <div className="h-5 bg-gray-200 rounded w-32"></div>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex flex-wrap items-start gap-6">
                                 {getVisibleFields(approval.category).has("entity") && (
                                   <div className="min-w-[120px]">
                                     {approval.entity && approval.entity !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'entity', getFieldTooltipContent('Entity', approval.entity))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Entity</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           {approval.entity}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Entity</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("filing") && (
                                   <div className="min-w-[120px]">
                                     {approval.filing && approval.filing !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'filing', getFieldTooltipContent('Filing', approval.filing))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Filing</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           {approval.filing}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Filing</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("agency") && (
                                   <div className="min-w-[120px]">
                                     {approval.agency && approval.agency !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'agency', getFieldTooltipContent('Agency', approval.agency))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Agency</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           {approval.agency}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Agency</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("accountNumber") && (
                                   <div className="min-w-[120px]">
                                     {approval.accountNumber && approval.accountNumber !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'account-number', getFieldTooltipContent('Account number', approval.accountNumber))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Account number</span>
                                         <p className={`text-sm font-normal mt-1 ${approval.accountNumberMissing ? 'text-red-600' : 'text-gray-900'}`}>
                                           {approval.accountNumber}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Account number</span>
                                         <p className={`text-sm font-normal mt-1 ${approval.accountNumberMissing ? 'text-red-600' : 'text-gray-900'}`}>
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 {getVisibleFields(approval.category).has("requestedOn") && (
                                   <div className="min-w-[120px]">
                                     {approval.requestedOn && approval.requestedOn !== "N/A" ? (
                                       <div
                                         onMouseEnter={(e) => handleTooltipMouseEnter(e, 'requested-on', getFieldTooltipContent('Requested on', approval.requestedOn))}
                                         onMouseLeave={handleTooltipMouseLeave}
                                         className="cursor-help"
                                       >
                                         <span className="text-sm text-gray-600">Requested on</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           {approval.requestedOn}
                                         </p>
                                       </div>
                                     ) : (
                                       <>
                                         <span className="text-sm text-gray-600">Requested on</span>
                                         <p className="text-sm font-normal text-gray-900 mt-1">
                                           N/A
                                         </p>
                                       </>
                                     )}
                                   </div>
                                 )}
                                 <div className="ml-auto">
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-8 w-8 border border-gray-200"
                                     onClick={() => handleOpenMetadataModal(approval.category)}
                                     disabled={metadataLoading}
                                   >
                                     <Settings className="h-4 w-4" />
                                   </Button>
                                 </div>
                               </div>
                             )}
                           </>
                         )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-24">
                    {!(approval.category === "Time and Attendance" || approval.category === "Approvals - Time and Attendance" || approval.category === "Payroll") && (
                      <h2 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 500 }}>
                        {(approval.category === "HR Management" || approval.category === "Approvals - HR Management") ? "Changes" : 
                         (approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements") ? "Receipt" : "Details"}
                      </h2>
                    )}
                    {(approval.category === "Time and Attendance" || approval.category === "Approvals - Time and Attendance") ? (
                      <div className="space-y-6">
                        {/* Jobs Table */}
                        <div>
                          <h3 className="text-lg text-gray-900 mb-3" style={{ fontWeight: 500 }}>Jobs</h3>
                          <div className="border border-gray-200 rounded-2xl overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">Office location</th>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">Start time</th>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">End time</th>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">Duration</th>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">Percentage</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                <tr className="border-t border-gray-200">
                                  <td className="px-4 py-3 text-sm text-gray-900">{approval.officeLocation || "Remote"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{approval.startTime || "9:00 AM"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{approval.endTime || "10:57 PM"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{approval.changes?.new || "N/A"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">100%</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                        {/* Breaks Table */}
                        <div>
                          <h3 className="text-lg text-gray-900 mb-3" style={{ fontWeight: 500 }}>Breaks</h3>
                          <div className="border border-gray-200 rounded-2xl overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">Office location</th>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">Start time</th>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">End time</th>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">Duration</th>
                                  <th className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase">Percentage</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white">
                                <tr className="border-t border-gray-200">
                                  <td className="px-4 py-3 text-sm text-gray-900">{approval.officeLocation || "Remote"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">12:00 PM</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">12:30 PM</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">30 min</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">0%</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : approval.category === "Payroll" ? null : (
                      <div className="border border-gray-200 rounded-2xl overflow-visible bg-white">
                        <div className="p-4 space-y-3 overflow-visible">
                      {(approval.category === "Reimbursements" || approval.category === "Approvals - Reimbursements") ? (
                           receiptImage ? (
                             <div className="flex items-center justify-center min-h-[200px] bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                               <Image
                                 src={receiptImage}
                                 alt="Receipt"
                                 width={159}
                                 height={200}
                                 className="object-contain"
                                 style={{ maxHeight: '400px' }}
                               />
                             </div>
                           ) : (
                             <div className="flex items-center justify-center min-h-[200px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                               <p className="text-gray-400 text-sm">Receipt image placeholder</p>
                             </div>
                           )
                         ) : (approval.category === "HR Management" || approval.category === "Approvals - HR Management") ? (
                           <>
                             <div className="flex justify-between items-center">
                               <span className="text-gray-600" style={{ fontSize: '0.875rem', lineHeight: '1.25rem' }}>{approval.fieldName || "Target annual bonus"}</span>
                               <div className="flex items-center gap-2">
                                 <span className="font-normal text-gray-900" style={{ fontSize: '0.875rem', lineHeight: '1.25rem' }}>{approval.changes.current} → {approval.changes.new}</span>
                                 {approval.warning === "Exceeds the approved band" && (
                                   <div
                                     onMouseEnter={(e) => handleTooltipMouseEnter(e, 'warning', (
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
                                             <div className="text-xs text-gray-900 font-medium">
                                               This new value exceeds the approved band for {approval.employee?.role || "this role"}. The approved range for {approval.employee?.role || "this role"} is typically lower than the requested amount.
                                             </div>
                                           </div>
                                         </div>
                                       </div>
                                     ))}
                                     onMouseLeave={handleTooltipMouseLeave}
                                     className="cursor-help"
                                   >
                                     <AlertTriangle 
                                       className="h-4 w-4 text-yellow-600 cursor-help" 
                                     />
                                   </div>
                                 )}
                               </div>
                             </div>
                           </>
                         ) : approval.category === "Training" ? (
                           <p className="text-sm text-gray-600">
                             {approval.summary || `You are required to complete the ${approval.courseName || "assigned course"} as part of your training requirements. This course covers essential topics.`}
                           </p>
                         ) : approval.category === "Documents" ? (
                           <p className="text-sm text-gray-600">
                             {approval.summary || `You are required to review and sign the ${approval.documentName || "assigned document"}. This document contains important information.`}
                           </p>
                         ) : approval.category === "Miscellaneous" ? (
                           <p className="text-sm text-gray-600">
                             {approval.summary || `${approval.newHireName || "A new hire"} joined the team as a ${approval.newHireRole || "team member"}. Please take them out to lunch to help them feel welcome and integrated into the team.`}
                           </p>
                         ) : (
                           <>
                             <div className="flex justify-between">
                               <span className="text-gray-600" style={{ fontSize: '16px', lineHeight: '12px' }}>Current Value</span>
                               <span className="font-normal text-gray-900" style={{ fontSize: '16px', lineHeight: '12px' }}>{approval.changes?.current || "N/A"}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-gray-600" style={{ fontSize: '16px', lineHeight: '12px' }}>New Value</span>
                               <span className="font-normal text-green-600" style={{ fontSize: '16px', lineHeight: '12px' }}>{approval.changes?.new || "N/A"}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-gray-600" style={{ fontSize: '16px', lineHeight: '12px' }}>Change Amount</span>
                               <span className="font-normal" style={{ fontSize: '16px', lineHeight: '12px' }}>{approval.changes?.amount || "N/A"}</span>
                             </div>
                           </>
                         )}
                       </div>
                    </div>
                    )}
                  </div>
                  
                  {/* AI Prompt */}
                  {selectedItem && approval && (
                    <div className={`${isSplitView ? "pt-4" : "pt-6"} border-t border-gray-200 mt-6`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Need more information?</span>
                        <button
                          onClick={() => {
                            if (onOpenAIPanel) {
                              // Extract request context from approval data
                              const requestContext = approval ? {
                                category: approval.category,
                                employee: approval.employee,
                                fieldName: approval.fieldName,
                                changes: approval.changes
                              } : null
                              onOpenAIPanel(requestContext)
                            }
                          }}
                          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline font-normal"
                        >
                          <Sparkles className="h-4 w-4" />
                          Ask a question
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {page !== "approvals" && activeTab === "Approval Process" && (
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F9F7F6' }}>
              <div className="p-6 pb-20">
                <div className="mb-4">
                  <h2 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 500 }}>Approval Process</h2>
                  <p className="text-sm text-gray-600">Step 1: All approvers must accept</p>
                </div>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                     <table className="w-full">
                       <thead className="bg-white border-b border-border border-t border-l border-r border-gray-200 rounded-t-[16px]">
                         <tr>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Approver</th>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Sent on</th>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Responded on</th>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Decision</th>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Notes</th>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal"></th>
                         </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                         <tr>
                           <td className="px-4 py-3">
                             <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-normal text-sm">
                                 JS
                               </div>
                               <span className="text-sm font-normal text-gray-900">John Smith</span>
                             </div>
                           </td>
                           <td className="px-4 py-3 text-sm text-gray-600">
                             {new Date().toLocaleDateString('en-US', { 
                               year: 'numeric', 
                               month: 'long', 
                               day: 'numeric' 
                             })}
                           </td>
                           <td className="px-4 py-3 text-sm text-gray-400">-</td>
                           <td className="px-4 py-3">
                             {parentActiveTab === "reviewed" ? (
                               <div className="inline-flex items-center gap-1">
                                 <div className={`rounded-full shrink-0 ${
                                   (() => {
                                     return approval?.reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                                       approval?.reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                                       approval?.reviewStatus === "Completed" ? "bg-[#2780CE]" :
                                       "bg-gray-400"
                                   })()
                                 }`} style={{ width: '8px', height: '8px' }} />
                                 <span className="text-sm text-gray-900">
                                   {approval?.reviewStatus || '--'}
                                 </span>
                               </div>
                             ) : (parentActiveTab === "all" || parentActiveTab === "created") ? (
                               <div className="inline-flex items-center gap-1">
                                 <div className={`rounded-full shrink-0 ${
                                   (() => {
                                     return approval?.itemStatus === "Approved" ? "bg-[#2D8A70]" :
                                       approval?.itemStatus === "Rejected" ? "bg-[#E4633C]" :
                                       approval?.itemStatus === "Completed" ? "bg-[#2780CE]" :
                                       approval?.itemStatus === "Pending" ? "bg-[#F59701]" :
                                       approval?.reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                                       approval?.reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                                       approval?.reviewStatus === "Completed" ? "bg-[#2780CE]" :
                                       "bg-gray-400"
                                   })()
                                 }`} style={{ width: '8px', height: '8px' }} />
                                 <span className="text-sm text-gray-900">
                                   {approval?.itemStatus || approval?.reviewStatus || '--'}
                                 </span>
                               </div>
                             ) : (
                               <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal bg-yellow-100 text-yellow-800">
                                 Pending
                               </span>
                             )}
                           </td>
                           <td className="px-4 py-3 text-sm text-gray-400">
                             {approval?.reviewedOn ? new Date(approval.reviewedOn).toLocaleDateString('en-US', { 
                               year: 'numeric', 
                               month: 'long', 
                               day: 'numeric' 
                             }) : '-'}
                           </td>
                           <td className="px-4 py-3">
                            <PebbleButton size={ButtonSizes.S} appearance={ButtonAppearances.OUTLINE}>
                              Send reminder
                            </PebbleButton>
                           </td>
                         </tr>
                         <tr>
                           <td className="px-4 py-3">
                             <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-normal text-sm">
                                 SW
                               </div>
                               <span className="text-sm font-normal text-gray-900">Sarah Wilson</span>
                             </div>
                           </td>
                           <td className="px-4 py-3 text-sm text-gray-600">
                             {new Date().toLocaleDateString('en-US', { 
                               year: 'numeric', 
                               month: 'long', 
                               day: 'numeric' 
                             })}
                           </td>
                           <td className="px-4 py-3 text-sm text-gray-400">-</td>
                           <td className="px-4 py-3">
                             {parentActiveTab === "reviewed" ? (
                               <div className="inline-flex items-center gap-1">
                                 <div className={`rounded-full shrink-0 ${
                                   approval?.reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                                   approval?.reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                                   approval?.reviewStatus === "Completed" ? "bg-[#2780CE]" :
                                   "bg-gray-400"
                                 }`} style={{ width: '8px', height: '8px' }} />
                                 <span className="text-sm text-gray-900">
                                   {approval?.reviewStatus || '--'}
                                 </span>
                               </div>
                             ) : (parentActiveTab === "all" || parentActiveTab === "created") ? (
                               <div className="inline-flex items-center gap-1">
                                 <div className={`rounded-full shrink-0 ${
                                   approval?.itemStatus === "Approved" ? "bg-[#2D8A70]" :
                                   approval?.itemStatus === "Rejected" ? "bg-[#E4633C]" :
                                   approval?.itemStatus === "Completed" ? "bg-[#2780CE]" :
                                   approval?.itemStatus === "Pending" ? "bg-[#F59701]" :
                                   approval?.reviewStatus === "Approved" ? "bg-[#2D8A70]" :
                                   approval?.reviewStatus === "Rejected" ? "bg-[#E4633C]" :
                                   approval?.reviewStatus === "Completed" ? "bg-[#2780CE]" :
                                   "bg-gray-400"
                                 }`} style={{ width: '8px', height: '8px' }} />
                                 <span className="text-sm text-gray-900">
                                   {approval?.itemStatus || approval?.reviewStatus || '--'}
                                 </span>
                               </div>
                             ) : (
                               <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal bg-yellow-100 text-yellow-800">
                                 Pending
                               </span>
                             )}
                           </td>
                           <td className="px-4 py-3 text-sm text-gray-400">-</td>
                           <td className="px-4 py-3">
                            <PebbleButton size={ButtonSizes.S} appearance={ButtonAppearances.OUTLINE}>
                              Send reminder
                            </PebbleButton>
                           </td>
                         </tr>
                       </tbody>
                     </table>
                </div>
              </div>
            </div>
          )}
          
          {page !== "approvals" && activeTab === "Policy" && (
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F9F7F6' }}>
              <div className={`p-6 pb-20 ${!isSplitView && viewMode === "full-width" && (backgroundColor as string) === "white" ? "max-w-[768px] mx-auto w-full" : ""}`}>
                <div className="mb-4">
                  <h2 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 500 }}>Approval Policies</h2>
                  <p className="text-sm text-gray-600">Policies triggered for this request</p>
                </div>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                     <table className="w-full">
                       <thead className="bg-white border-b border-border border-t border-l border-r border-gray-200 rounded-t-[16px]">
                         <tr>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Name</th>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Published by</th>
                         </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                         <tr>
                           <td className="px-4 py-3 text-sm font-normal text-gray-900">HR Management Policy</td>
                           <td className="px-4 py-3 text-sm text-gray-600">Jennifer Martinez</td>
                         </tr>
                         <tr>
                           <td className="px-4 py-3 text-sm font-normal text-gray-900">Expense Reimbursement Policy</td>
                           <td className="px-4 py-3 text-sm text-gray-600">Michael Chen</td>
                         </tr>
                         <tr>
                           <td className="px-4 py-3 text-sm font-normal text-gray-900">Time Tracking Policy</td>
                           <td className="px-4 py-3 text-sm text-gray-600">Lisa Thompson</td>
                         </tr>
                       </tbody>
                     </table>
                </div>
              </div>
            </div>
          )}
          
          {page !== "approvals" && activeTab === "Activity log" && (
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F9F7F6' }}>
              <div className={`p-6 pb-20 ${!isSplitView && viewMode === "full-width" && (backgroundColor as string) === "white" ? "max-w-[768px] mx-auto w-full" : ""}`}>
                <div className="mb-4">
                  <h2 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 500 }}>Activity Log</h2>
                  <p className="text-sm text-gray-600">History of actions performed on this request</p>
                </div>
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                     <table className="w-full">
                       <thead className="bg-white border-b border-border border-t border-l border-r border-gray-200 rounded-t-[16px]">
                         <tr>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Date and time</th>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Performed by</th>
                           <th className="px-6 py-3 text-left rippling-text-xs text-muted-foreground uppercase font-normal">Action</th>
                         </tr>
                       </thead>
                       <tbody className="bg-white divide-y divide-gray-200">
                         <tr>
                           <td className="px-4 py-3 text-sm text-gray-600">
                             {new Date().toLocaleDateString('en-US', { 
                               year: 'numeric', 
                               month: 'long', 
                               day: 'numeric',
                               hour: '2-digit',
                               minute: '2-digit'
                             })}
                           </td>
                           <td className="px-4 py-3 text-sm font-normal text-gray-900">{approval.requestor}</td>
                           <td className="px-4 py-3 text-sm text-gray-600">Request submitted</td>
                         </tr>
                       </tbody>
                     </table>
                </div>
              </div>
            </div>
          )}
          
          {page !== "approvals" && activeTab === "Comments" && (
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F9F7F6' }}>
              <div className={`p-6 pb-20 ${!isSplitView && viewMode === "full-width" && (backgroundColor as string) === "white" ? "max-w-[768px] mx-auto w-full" : ""}`}>
                <div className="mb-4">
                  <h2 className="text-lg text-gray-900 mb-2" style={{ fontWeight: 500 }}>Comments</h2>
                  <p className="text-sm text-gray-600">Discussion and feedback on this request</p>
                </div>
                <div className="space-y-4">
                     {approval.comments && approval.comments.length > 0 ? (
                       approval.comments.map((comment: any) => (
                         <div key={comment.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                           <div className="flex items-start gap-3">
                             <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-normal text-sm">
                               {comment.author.split(' ').map((n: string) => n[0]).join('')}
                             </div>
                             <div className="flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="text-sm font-normal text-gray-900">{comment.author}</span>
                                 <span className="text-xs text-gray-500">{comment.timestamp}</span>
                               </div>
                               <p className="text-sm text-gray-700">{comment.text}</p>
                             </div>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-center py-8">
                         <p className="text-gray-500">No comments yet</p>
                       </div>
                     )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {parentActiveTab !== "reviewed" && (
        <div className="border-t border-border p-4 flex justify-between items-center bg-card flex-shrink-0">
          {page === "approvals" ? (
            // Action footer for approval requests - matching original styling
            <>
              <div className="relative" ref={snoozePopoverRef}>
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.OUTLINE}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    setSnoozePopoverOpen(!snoozePopoverOpen)
                  }}
                >
                  Snooze
                </PebbleButton>
                {snoozePopoverOpen && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-30 min-w-[240px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('laterToday')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Later today</span>
                      <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('tomorrow')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Tomorrow</span>
                      <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('nextWeek')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Next week</span>
                      <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSnoozePopoverOpen(false)
                        setSnoozeModalOpen(true)
                        setSnoozeDate(new Date())
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs"
                    >
                      Pick a date and time
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.OUTLINE}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    // Handle edit request action
                  }}
                >
                  Edit request
                </PebbleButton>
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.DESTRUCTIVE}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    if (selectedItem && onReject) {
                      onReject(selectedItem)
                      if (onSelectNextItem) {
                        // Small delay to ensure the item is removed from the list first
                        setTimeout(() => {
                          onSelectNextItem()
                        }, 0)
                      }
                    }
                  }}
                >
                  Reject
                </PebbleButton>
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.PRIMARY}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    if (selectedItem && onApprove) {
                      onApprove(selectedItem)
                      if (onSelectNextItem) {
                        // Small delay to ensure the item is removed from the list first
                        setTimeout(() => {
                          onSelectNextItem()
                        }, 0)
                      }
                    }
                  }}
                >
                  Approve
                </PebbleButton>
              </div>
            </>
          ) : (approval.category === "Training" || approval.category === "Documents" || approval.category === "Miscellaneous" || approval.category === "Payroll") ? (
            <>
              <div className="relative" ref={snoozePopoverRef}>
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.OUTLINE}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    setSnoozePopoverOpen(!snoozePopoverOpen)
                  }}
                >
                  Snooze
                </PebbleButton>
                {snoozePopoverOpen && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-30 min-w-[240px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('laterToday')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Later today</span>
                      <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('tomorrow')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Tomorrow</span>
                      <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('nextWeek')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Next week</span>
                      <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSnoozePopoverOpen(false)
                        setSnoozeModalOpen(true)
                        setSnoozeDate(new Date())
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs"
                    >
                      Pick a date and time
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.OUTLINE}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    if (selectedItem && onMarkAsDone) {
                      onMarkAsDone(selectedItem)
                      if (onSelectNextItem) {
                        // Small delay to ensure the item is removed from the list first
                        setTimeout(() => {
                          onSelectNextItem()
                        }, 0)
                      }
                    }
                  }}
                >
                  Mark as done
                </PebbleButton>
                {approval.category === "Payroll" && (
                  <PebbleButton 
                    size={ButtonSizes.M}
                    appearance={ButtonAppearances.ACCENT}
                    disabled={hasSelectedItems}
                    onClick={() => {
                      if (selectedItem && onRemoveItem) {
                        onRemoveItem(selectedItem)
                      }
                    }}
                  >
                    Add account number
                  </PebbleButton>
                )}
                {approval.category === "Documents" && (
                  <PebbleButton 
                    size={ButtonSizes.M}
                    appearance={ButtonAppearances.ACCENT}
                    disabled={hasSelectedItems}
                    onClick={() => {
                      if (selectedItem && onRemoveItem) {
                        onRemoveItem(selectedItem)
                      }
                    }}
                  >
                    Sign document
                  </PebbleButton>
                )}
                {approval.category === "Training" && (
                  <PebbleButton 
                    size={ButtonSizes.M}
                    appearance={ButtonAppearances.ACCENT}
                    disabled={hasSelectedItems}
                    onClick={() => {
                      if (selectedItem && onRemoveItem) {
                        onRemoveItem(selectedItem)
                      }
                    }}
                  >
                    Take course
                  </PebbleButton>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="relative" ref={snoozePopoverRef}>
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.OUTLINE}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    setSnoozePopoverOpen(!snoozePopoverOpen)
                  }}
                >
                  Snooze
                </PebbleButton>
                {snoozePopoverOpen && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-md shadow-lg z-30 min-w-[240px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('laterToday')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Later today</span>
                      <span className="text-gray-500">{formatSnoozeTime(getLaterToday())}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('tomorrow')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Tomorrow</span>
                      <span className="text-gray-500">{formatSnoozeTime(getTomorrow())}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickSnooze('nextWeek')
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs flex items-center justify-between"
                    >
                      <span>Next week</span>
                      <span className="text-gray-500">{formatSnoozeTime(getNextWeek())}</span>
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSnoozePopoverOpen(false)
                        setSnoozeModalOpen(true)
                        setSnoozeDate(new Date())
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs"
                    >
                      Pick a date and time
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.OUTLINE}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    // Handle edit request action
                  }}
                >
                  Edit request
                </PebbleButton>
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.DESTRUCTIVE}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    if (selectedItem && onReject) {
                      onReject(selectedItem)
                      if (onSelectNextItem) {
                        // Small delay to ensure the item is removed from the list first
                        setTimeout(() => {
                          onSelectNextItem()
                        }, 0)
                      }
                    }
                  }}
                >
                  Reject
                </PebbleButton>
                <PebbleButton 
                  size={ButtonSizes.M}
                  appearance={ButtonAppearances.PRIMARY}
                  disabled={hasSelectedItems}
                  onClick={() => {
                    if (selectedItem && onApprove) {
                      onApprove(selectedItem)
                      if (onSelectNextItem) {
                        // Small delay to ensure the item is removed from the list first
                        setTimeout(() => {
                          onSelectNextItem()
                        }, 0)
                      }
                    }
                  }}
                >
                  Approve
                </PebbleButton>
              </div>
            </>
          )}
        </div>
      )}
        
      {(hasSelectedItems && parentActiveTab !== "reviewed" && typeof window !== 'undefined') ? createPortal(
        <div key={`bulk-action-footer-${selectedItems?.size || 0}`} className="fixed bottom-[75px] left-1/2 transform -translate-x-1/2 text-white p-4 shadow-lg flex items-center z-50" style={{ backgroundColor: '#7A005D', borderRadius: '16px' }}>
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
              <span className="text-sm font-normal">{selectedItems?.size || 0}</span>
              <span className="text-sm">selected</span>
            </div>
          </div>
          <div className="flex items-center gap-2" style={{ marginLeft: '24px' }}>
              {(() => {
                if (!selectedItems || selectedItems.size === 0) return null;
                
                // Check if all items are selected
                const allApprovalIds = getAllApprovalIds()
                const isAllSelected = selectedItems.size === allApprovalIds.length && 
                  allApprovalIds.every(id => selectedItems.has(id))
                
                // If all items are selected, show only Snooze (with popover)
                if (isAllSelected) {
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
                              setSnoozeModalOpen(true)
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
                
                // Get all selected items data - need to check both approvalData Record and taskData
                const selectedApprovals = Array.from(selectedItems).map(id => 
                  approvalData[id as unknown as keyof typeof approvalData]
                ).filter(Boolean);
                
                // Determine categories of selected items
                const hasApprovals = selectedApprovals.some(item => 
                  item.category.startsWith('Approvals -')
                );
                const hasDocuments = selectedApprovals.some(item => item.category === 'Documents');
                const hasTraining = selectedApprovals.some(item => item.category === 'Training');
                const hasTeamBuilding = selectedApprovals.some(item => item.category === 'Miscellaneous');
                const hasTasks = hasDocuments || hasTraining || hasTeamBuilding
                
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
                              setSnoozeModalOpen(true)
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
                if (hasApprovals && !hasDocuments && !hasTraining && !hasTeamBuilding) {
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
                              setSnoozeModalOpen(true)
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
                else if (hasDocuments && !hasApprovals && !hasTraining && !hasTeamBuilding) {
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
                              setSnoozeModalOpen(true)
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
                else if (hasTraining && !hasApprovals && !hasDocuments && !hasTeamBuilding) {
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
                              setSnoozeModalOpen(true)
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
                else if (hasTeamBuilding && !hasApprovals && !hasDocuments && !hasTraining) {
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
                              setSnoozeModalOpen(true)
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
                // If combination of tasks (training/documents/team building) are selected (no approvals), show Mark as done and Snooze
                else if (hasTasks && !hasApprovals) {
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
                              setSnoozeModalOpen(true)
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
                // If mixed selections (shouldn't happen with new logic, but keep as fallback), only show Mark as done
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
                    </Button>,
                    <Button 
                      key="edit-request" 
                      variant="ghost" 
                      className="text-white hover:bg-white/20 h-8 px-3"
                      onClick={() => {
                        // Handle edit request action
                      }}
                    >
                      Edit request
                    </Button>
                  );
                }
                
                return actions;
              })()}
          </div>
        </div>,
        document.body
      ) : null}
    </div>
      
      {/* Metadata Field Selection Modal */}
      {metadataModalOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleCloseMetadataModal}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg text-gray-900" style={{ fontWeight: 500 }}>Customize Metadata Fields</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseMetadataModal}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-sm text-gray-600 mb-4">Select which metadata fields to display:</p>
                <div className="space-y-3">
                  {getAllMetadataFields(currentCategory).map((field) => (
                    <div key={field.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={field.id}
                        checked={tempSelectedFields.has(field.id)}
                        onCheckedChange={() => handleToggleField(field.id)}
                      />
                      <label
                        htmlFor={field.id}
                        className="text-sm font-normal text-gray-900 cursor-pointer flex-1"
                      >
                        {field.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={handleCloseMetadataModal}
                  className="rippling-btn-outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMetadataFields}
                  className="rippling-btn-primary"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Snooze Modal */}
      {snoozeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSnoozeModalOpen(false)}>
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
                  setSnoozeModalOpen(false)
                  setSnoozeDate(null)
                  setSnoozeTime("08:00")
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSnooze}
                disabled={!snoozeDate}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Tooltip */}
      {tooltipData.id !== null && tooltipData.content && typeof window !== 'undefined' && createPortal(
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
            width: '320px',
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100vh - 16px)',
            padding: '0'
          }}
        >
          {tooltipData.content}
        </div>,
        document.body
      )}
    </>
  )
}

