"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Upload } from "lucide-react"
import { useState } from "react"

interface RequestContext {
  category?: string
  employee?: {
    name?: string
    department?: string
    role?: string
    manager?: string
    location?: string
  }
  fieldName?: string
  changes?: {
    current?: string
    new?: string
  }
}

interface AIPanelProps {
  isOpen: boolean
  onClose: () => void
  firstName?: string
  requestContext?: RequestContext | null
}

// Generate suggested questions based on request type
function getSuggestedQuestions(requestContext: RequestContext | null | undefined): string[] {
  if (!requestContext || !requestContext.category) {
    return []
  }

  const category = requestContext.category
  const employeeName = requestContext.employee?.name
  const fieldName = requestContext.fieldName || "this field"
  
  // Normalize category names (remove "Approvals - " prefix)
  const normalizedCategory = category.replace("Approvals - ", "")

  const questions: string[] = []

  if (normalizedCategory === "HR Management") {
    if (employeeName) {
      questions.push(`How does this change compare to ${employeeName}'s peers?`)
    }
    if (employeeName && fieldName) {
      questions.push(`Show me the previous changes made to ${employeeName}'s ${fieldName}.`)
    }
  } else if (normalizedCategory === "Time and Attendance") {
    questions.push("Who else was working this shift?")
    questions.push("How similar is this to other recent entries?")
  } else if (normalizedCategory === "Reimbursements") {
    if (employeeName) {
      questions.push(`How much is ${employeeName} spending compared to their peers?`)
    }
    questions.push("Was pre-approval required for this expense?")
  } else if (normalizedCategory === "Documents") {
    questions.push("Is there a specific deadline or downstream dependency tied to this signature?")
    questions.push("What happens if this document is not signed today?")
    questions.push("What changed compared to the last version I reviewed?")
  } else if (normalizedCategory === "Training") {
    questions.push("What happens if this training is not completed on time?")
    questions.push("Why is this training required?")
  } else if (normalizedCategory === "Miscellaneous") {
    questions.push("Who is this intended for (entire team, sub-group, cross-functional)?")
    questions.push("Is this primarily social, culture-building, or tied to a broader initiative?")
  } else if (normalizedCategory === "Payroll") {
    questions.push("Why is this amendment required?")
    questions.push("Has the payroll already been processed or paid?")
  }

  // Return 2-3 questions, filtering out any that couldn't be generated due to missing context
  return questions.slice(0, 3)
}

// Generate contextual responses based on the question and request context
function generateResponse(question: string, requestContext: RequestContext | null | undefined): string {
  if (!requestContext || !requestContext.category) {
    return "I'd be happy to help! Could you provide more context about what you're looking for?"
  }

  const category = requestContext.category
  const normalizedCategory = category.replace("Approvals - ", "")
  const employeeName = requestContext.employee?.name || "the employee"
  const fieldName = requestContext.fieldName || "this field"
  const changes = requestContext.changes

  // HR Management responses
  if (normalizedCategory === "HR Management") {
    if (question.includes("compare to") && question.includes("peers")) {
      const currentVal = changes?.current ? parseFloat(changes.current.replace(/[^0-9.]/g, '')) : null
      const newVal = changes?.new ? parseFloat(changes.new.replace(/[^0-9.]/g, '')) : null
      let comparisonText = ""
      if (currentVal && newVal && changes?.current) {
        const percentChange = ((newVal - currentVal) / currentVal * 100).toFixed(0)
        comparisonText = `a ${percentChange}% increase from their current ${changes.current}`
      } else {
        comparisonText = "an increase from their current value"
      }
      return `${employeeName}'s requested ${fieldName} of ${changes?.new || "the new value"} represents ${comparisonText}. Based on similar roles in ${requestContext.employee?.department || "their department"}, this places them in the upper range compared to peers. The median for ${requestContext.employee?.role || "this role"} is typically around ${currentVal ? `$${Math.round(currentVal * 1.15).toLocaleString()}` : "the current value"}.`
    }
    if (question.includes("previous changes")) {
      return `Here are the recent changes to ${employeeName}'s ${fieldName}:\n\n• ${changes?.current || "Previous value"} → ${changes?.new || "Current value"}\n• The last change was approved by ${requestContext.employee?.manager || "their manager"}.\n\nWould you like me to show you the full change history?`
    }
  }

  // Time & Attendance responses
  if (normalizedCategory === "Time and Attendance") {
    if (question.includes("Who else was working")) {
      return `Based on the shift time, here are other employees who were likely working during this period:\n\n• Sarah Johnson (same department)\n• Michael Chen (overlapping shift)\n• Jennifer Davis (partial overlap)\n\nNote: This is based on typical schedules. Would you like me to check the exact attendance records?`
    }
    if (question.includes("similar") || question.includes("recent entries")) {
      return `This time entry is similar to ${employeeName}'s recent patterns. In the past month, they've logged:\n\n• 3 entries of similar duration\n• Average shift length: ~12 hours\n• Most common pattern: Extended shifts during conference periods\n\nThis entry follows their typical work pattern, though it does exceed the standard 12-hour guideline.`
    }
  }

  // Reimbursements responses
  if (normalizedCategory === "Reimbursements") {
    if (question.includes("spending compared to peers")) {
      const amount = changes?.new ? parseFloat(changes.new.replace(/[^0-9.]/g, '')) : 0
      const estimatedMonthly = amount * 8 // Rough estimate
      return `${employeeName} has spent approximately $${estimatedMonthly.toFixed(0)} this month on ${requestContext.employee?.role === "Sales Manager" ? "transportation and travel" : "expenses"}. This places them:\n\n• 15% above the department average\n• In the upper quartile for their role\n• Similar to other ${requestContext.employee?.role || "employees"} in ${requestContext.employee?.location || "their location"}\n\nThe largest expense category is transportation, which aligns with their role requirements.`
    }
    if (question.includes("pre-approval")) {
      const amount = changes?.new ? parseFloat(changes.new.replace(/[^0-9.]/g, '')) : 0
      const requiresApproval = amount > 50
      return `For this type of expense (${requestContext.employee?.role === "Sales Manager" ? "transportation" : "business expense"}), pre-approval is ${requiresApproval ? "required" : "not required"} for amounts ${requiresApproval ? "over $50" : "under $50"}.\n\n${requiresApproval ? "Since this expense exceeds the threshold, pre-approval should have been obtained. However, the expense appears to be legitimate and within policy." : "This expense is within the automatic approval limit, so no pre-approval was needed."}`
    }
  }

  // Documents responses
  if (normalizedCategory === "Documents") {
    if (question.includes("deadline") || question.includes("dependency")) {
      return `This document has a target completion date, and there are downstream dependencies:\n\n• The signature is needed before the next payroll cycle\n• Legal team requires this for compliance review\n• HR needs it to process related employee changes\n\nDelaying this signature could impact the timeline for related processes.`
    }
    if (question.includes("not signed today")) {
      return `If this document is not signed today:\n\n• The process will be delayed by at least one business day\n• Related workflows may be paused\n• You may need to re-verify some information if significant time passes\n\nI recommend signing today if possible to keep the process on track.`
    }
    if (question.includes("changed") || question.includes("last version")) {
      return `Compared to the last version you reviewed, the following changes were made:\n\n• Updated compliance language in section 3\n• Revised dates to reflect current timeline\n• Added clarification on employee responsibilities\n• Minor formatting updates for clarity\n\nThe core terms remain the same. Would you like me to highlight the specific sections that changed?`
    }
  }

  // Training responses
  if (normalizedCategory === "Training") {
    if (question.includes("not completed on time")) {
      return `If this training is not completed on time:\n\n• The employee may be marked as non-compliant\n• Access to certain systems or tools may be restricted\n• It could delay their onboarding or role progression\n• May require additional follow-up and rescheduling\n\nI recommend completing it before the due date to avoid any workflow interruptions.`
    }
    if (question.includes("required")) {
      return `This training is required because:\n\n• It's part of the mandatory compliance program for ${requestContext.employee?.role || "this role"}\n• It covers essential safety and policy information\n• Completion is tracked for regulatory purposes\n• It's a prerequisite for certain responsibilities\n\nAll employees in ${requestContext.employee?.department || "this department"} must complete this training.`
    }
  }

  // Miscellaneous responses
  if (normalizedCategory === "Miscellaneous") {
    if (question.includes("intended for")) {
      return `This team building activity is intended for:\n\n• The entire ${requestContext.employee?.department || "department"} team\n• All full-time employees in the organization\n• Cross-functional collaboration between teams\n\nIt's designed to foster better communication and team cohesion across different groups.`
    }
    if (question.includes("social") || question.includes("culture") || question.includes("initiative")) {
      return `This activity is primarily:\n\n• Culture-building focused - designed to strengthen team bonds\n• Part of a broader initiative to improve workplace collaboration\n• A mix of social interaction and professional development\n\nIt's tied to the company's goal of enhancing team dynamics and employee engagement.`
    }
  }

  // Payroll responses
  if (normalizedCategory === "Payroll") {
    if (question.includes("required")) {
      return `This payroll amendment is required because:\n\n• There was an error in the previous payroll processing\n• Employee information needs to be corrected (tax status, deductions, etc.)\n• Compliance with updated regulations or company policies\n• Adjustment needed for accurate tax reporting\n\nThese amendments ensure payroll accuracy and regulatory compliance.`
    }
    if (question.includes("processed") || question.includes("paid")) {
      return `Regarding the payroll processing status:\n\n• The original payroll has already been processed and paid\n• This amendment will be applied retroactively in the next payroll cycle\n• Employees will be notified about the change\n\nWould you like me to check the exact processing status?`
    }
  }

  // Default response for unrecognized questions
  return `I understand you're asking about "${question}". Based on the ${normalizedCategory} request for ${employeeName}, I can help you with that. Could you provide a bit more detail about what specific information you need?`
}

export function AIPanel({ isOpen, onClose, firstName = "Ryland", requestContext }: AIPanelProps) {
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", content: string }>>([])

  const suggestedQuestions = getSuggestedQuestions(requestContext)
  const showSuggestions = suggestedQuestions.length > 0

  const handleQuestionClick = (question: string) => {
    // Set the input value
    setInputValue(question)
    // Submit the question immediately
    handleSubmit(question)
  }

  const handleSubmit = (questionText?: string) => {
    const textToSend = questionText || inputValue.trim()
    if (!textToSend) return

    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: textToSend }]
    setMessages(newMessages)
    
    // Clear input
    setInputValue("")
    
    // Generate contextual response based on the question and request context
    // Simulate a brief delay for realistic AI response timing
    setTimeout(() => {
      const response = generateResponse(textToSend, requestContext)
      setMessages([...newMessages, { 
        role: "assistant" as const, 
        content: response
      }])
    }, 800)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">New chat</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Chat Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="mb-4">
                <p className="text-base text-gray-900">Hi {firstName}, what do you need help with?</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Suggested Questions - only show when launched from request detail and no messages yet */}
          {showSuggestions && messages.length === 0 && (
            <div className="px-4 pb-4 border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 mb-3 font-medium">Suggested questions</p>
              <div className="flex flex-col gap-2">
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuestionClick(question)}
                    className="text-left text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-md transition-colors border border-blue-200 hover:border-blue-300"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="relative">
              <Input
                placeholder="Ask anything"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pr-20 h-12 text-base"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
            {/* Disclaimer */}
            <p className="text-xs text-gray-500 mt-2">Rippling AI can make mistakes. Check important info.</p>
          </div>
        </div>
    </div>
  )
}

