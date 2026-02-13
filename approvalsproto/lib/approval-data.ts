// Shared approval data generation functions

// Helper function to extract attributes from details copy
export const extractAttributes = (detailsCopy: string, example: string) => {
  const attributes: Record<string, string> = {}
  
  // Extract {impacted employee} or {impacted person}
  const employeeMatch = detailsCopy.match(/\{impacted (employee|person)\}/)
  if (employeeMatch) {
    // Try to extract from example - handle patterns like "Hire Sarah Kim" or "Update Sarah Kim's"
    let employeeName = ''
    // Pattern 1: "Hire/Update/... Name (position)" or "Name's"
    const hirePattern = example.match(/(?:Hire|Update|Terminate|Grant|Create|Delete)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/)
    if (hirePattern) {
      employeeName = hirePattern[1].trim()
    } else {
      // Pattern 2: Fallback to splitting by 's|for|to
      const exampleParts = example.split(/(?:'s|for|to)/)
      if (exampleParts.length > 0) {
        const firstPart = exampleParts[0].trim()
        // Remove action verbs if present
        employeeName = firstPart.replace(/^(?:Hire|Update|Terminate|Grant|Create|Delete)\s+/i, '').trim()
      }
    }
    if (employeeName) {
      attributes.impactedEmployee = employeeName
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
  
  // Extract Apps, Reason, Effective date for new Apps request
  if (detailsCopy.includes('{number} apps')) {
    const appsMatch = example.match(/(\d+)\s+apps/)
    if (appsMatch) {
      attributes.apps = `${appsMatch[1]} apps`
    }
    // Extract app names if available in example (e.g., "apps: Slack, Figma")
    const appNamesMatch = example.match(/apps[:\s]+(.+?)(?:\.|Reason|Effective)/i)
    if (appNamesMatch) {
      attributes.apps = appNamesMatch[1].trim()
    }
  }
  // Extract Reason (common patterns: "Reason: ..." or "reason: ...")
  const reasonMatch = example.match(/[Rr]eason[:\s]+(.+?)(?:\.|Effective|Start|Title|Department|Level|Compensation|$)/i)
  if (reasonMatch) {
    attributes.reason = reasonMatch[1].trim()
  }
  // Extract Effective date (common patterns: "Effective date: ..." or "Effective: ...")
  const effectiveDateMatch = example.match(/[Ee]ffective\s+(?:date[:\s]+)?(.+?)(?:\.|Start|Title|Department|Level|Compensation|$)/i)
  if (effectiveDateMatch) {
    attributes.effectiveDate = effectiveDateMatch[1].trim()
  }
  
  // Extract Start date, Title, Department, Level, Compensation for HRIS hire requests
  const startDateMatch = example.match(/[Ss]tart\s+(?:date[:\s]+)?(.+?)(?:\.|Title|Department|Level|Compensation|$)/i)
  if (startDateMatch) {
    attributes.startDate = startDateMatch[1].trim()
  }
  const titleMatch = example.match(/[Tt]itle[:\s]+(.+?)(?:\.|Department|Level|Compensation|Start|$)/i)
  if (titleMatch) {
    attributes.title = titleMatch[1].trim()
  }
  const departmentMatch = example.match(/[Dd]epartment[:\s]+(.+?)(?:\.|Level|Compensation|Start|Title|$)/i)
  if (departmentMatch) {
    attributes.department = departmentMatch[1].trim()
  }
  const levelMatch = example.match(/[Ll]evel[:\s]+(.+?)(?:\.|Compensation|Start|Title|Department|$)/i)
  if (levelMatch) {
    attributes.level = levelMatch[1].trim()
  }
  const compensationMatch = example.match(/[Cc]ompensation[:\s]+(.+?)(?:\.|Start|Title|Department|Level|$)/i)
  if (compensationMatch) {
    attributes.compensation = compensationMatch[1].trim()
  }
  
  // Extract attributes for CLOSE_HEADCOUNT: Memo, Closed by, Headcount owner
  const memoMatch = example.match(/[Mm]emo[:\s]+(.+?)(?:\.|Closed by|Headcount owner|Previous employee|Number of new headcount|Annualized cash impact|$)/i)
  if (memoMatch) {
    attributes.memo = memoMatch[1].trim()
  }
  const closedByMatch = example.match(/[Cc]losed by[:\s]+(.+?)(?:\.|Headcount owner|Memo|Previous employee|Number of new headcount|Annualized cash impact|$)/i)
  if (closedByMatch) {
    attributes.closedBy = closedByMatch[1].trim()
  }
  const headcountOwnerMatch = example.match(/[Hh]eadcount owner[:\s]+(.+?)(?:\.|Memo|Closed by|Previous employee|Number of new headcount|Annualized cash impact|$)/i)
  if (headcountOwnerMatch) {
    attributes.headcountOwner = headcountOwnerMatch[1].trim()
  }
  
  // Extract attributes for BACKFILL_HEADCOUNT: Previous employee, Number of new headcount, Annualized cash impact, Memo
  const previousEmployeeMatch = example.match(/[Pp]revious employee[:\s]+(.+?)(?:\.|Number of new headcount|Annualized cash impact|Memo|Closed by|Headcount owner|$)/i)
  if (previousEmployeeMatch) {
    attributes.previousEmployee = previousEmployeeMatch[1].trim()
  }
  const numberOfNewHeadcountMatch = example.match(/[Nn]umber of new headcount[:\s]+(.+?)(?:\.|Annualized cash impact|Memo|Previous employee|Closed by|Headcount owner|$)/i)
  if (numberOfNewHeadcountMatch) {
    attributes.numberOfNewHeadcount = numberOfNewHeadcountMatch[1].trim()
  }
  const annualizedCashImpactMatch = example.match(/[Aa]nnualized cash impact[:\s]+(.+?)(?:\.|Memo|Previous employee|Number of new headcount|Closed by|Headcount owner|$)/i)
  if (annualizedCashImpactMatch) {
    attributes.annualizedCashImpact = annualizedCashImpactMatch[1].trim()
  }
  
  // Extract attributes for IT automation requests: Impacted employee, Department, Requested resource, Reason
  // Impacted employee and Department are already extracted above, but ensure they're captured for IT automation
  if (detailsCopy.includes('{resource}')) {
    // Extract requested resource - could be in the example after "Grant access to" or "Requested resource:"
    const resourceMatch = example.match(/[Rr]equested resource[:\s]+(.+?)(?:\.|Impacted employee|Department|Reason|$)/i)
    if (resourceMatch) {
      attributes.requestedResource = resourceMatch[1].trim()
    } else {
      // Fallback: extract resource from "Grant access to ..."
      const grantAccessMatch = example.match(/[Gg]rant access to\s+(.+?)(?:\.|Impacted employee|Department|Requested resource|Reason|$)/i)
      if (grantAccessMatch) {
        attributes.requestedResource = grantAccessMatch[1].trim()
      }
    }
  }
  
  return attributes
}

// Helper function to add business days (excluding weekends)
const addBusinessDays = (date: Date, businessDays: number): Date => {
  const result = new Date(date)
  let daysToAdd = businessDays
  while (daysToAdd > 0) {
    result.setDate(result.getDate() + 1)
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      daysToAdd--
    }
  }
  return result
}

// Helper function to generate due date based on action type
export const generateDueDate = (actionType: string, daysFromNow: number = 7, useBusinessDays: boolean = false): string => {
  const today = new Date()
  let dueDate: Date
  if (useBusinessDays) {
    dueDate = addBusinessDays(today, daysFromNow)
  } else {
    dueDate = new Date(today)
    dueDate.setDate(today.getDate() + daysFromNow)
  }
  return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Helper function to map App to category
export const mapAppToCategory = (app: string): string => {
  const categoryMap: Record<string, string> = {
    'Apps': 'Approvals - Apps',
    'Banking': 'Approvals - Banking',
    'Contractor hub': 'Approvals - Contractor Hub',
    'Custom objects': 'Approvals - Custom Objects',
    'Devices': 'Approvals - Devices',
    'Global payroll': 'Approvals - Payroll',
    'Headcount': 'Approvals - Headcount',
    'HRIS': 'Approvals - HR Management',
    'IT automations': 'Approvals - IT',
    'Payroll': 'Approvals - Payroll',
    'Permissions': 'Approvals - Permissions',
    'Procurement': 'Approvals - Procurement',
    'Recruiting': 'Approvals - Recruiting',
    'RPass': 'Approvals - RPass',
    'Scheduling': 'Approvals - Scheduling',
    'Spend': 'Approvals - Reimbursements',
    'Time and attendance': 'Approvals - Time and Attendance',
    'Time off': 'Approvals - Time Off',
    'Travel': 'Approvals - Travel',
    'Variable Comp': 'Approvals - Variable Compensation',
    'Benefits': 'Approvals - Benefits',
    'Chat': 'Approvals - Chat',
    'Tranformations': 'Approvals - Transformations'
  }
  return categoryMap[app] || `Approvals - ${app}`
}

// CSV data from the provided file
export const csvData = [
  { app: 'Apps', actionType: 'APPS_REQUEST', detailsCopy: 'Update access for {impacted employee} ({number} apps)', example: "Update Michael Johnson's access to 3 apps" },
  { app: 'Apps', actionType: 'APPS_UPDATE_ACCESS_REQUEST', detailsCopy: 'Update access for {impacted employee} ({number} apps)', example: "Update Sarah Johnson's access to 5 apps. Apps: Slack, Figma, Notion, Asana, Jira. Reason: Role change. Effective date: Jan 15, 2025" },
  { app: 'Apps', actionType: 'APP_INSTALL_REQUEST', detailsCopy: 'Grant access for {impacted employee} ({number} apps)', example: 'Grant Michael Johnson access to 3 apps. Apps: Slack, Figma, Notion. Reason: New team member onboarding. Effective date: Jan 15, 2025' },
  { app: 'Banking', actionType: 'BANKING_NEW_PAYMENT_REQUEST', detailsCopy: 'Transfer {amount} to {recipient}', example: 'Transfer $100 to Michael Johnson. Amount: $100. Recipient: Michael Johnson. Currency: USD. Transfer type: ACH. Reason: Vendor payment' },
  { app: 'Contractor hub', actionType: 'CONTRACT_CREATION', detailsCopy: 'Create a contract for {impacted person} ({role})', example: 'Create a contract for Michael Johnson (Product Designer). Contractor: Michael Johnson. Contract type: Independent Contractor. Department: Design. Total contract amount: $50,000. Start date: Jan 1, 2025. End date: Dec 31, 2025' },
  { app: 'Contractor hub', actionType: 'CONTRACT_NEGOTIATION', detailsCopy: 'Approve proposed contract changes for {impacted person} ({role})', example: 'Approve proposed contract changes for Michael Johnson (Product Designer). Contractor: Michael Johnson. Contract type: Independent Contractor. Requested change: Increase hourly rate from $100 to $120' },
  { app: 'Custom objects', actionType: 'CUSTOM_OBJECT_DATA_ROW_DELETE', detailsCopy: 'Delete {record name} in {object}', example: 'Delete record_1 in object_1' },
  { app: 'Custom objects', actionType: 'CUSTOM_OBJECT_DATA_ROW_DELETE_NO_DUE_DATE', detailsCopy: 'Delete {record name} in {object}', example: 'Delete customer_record_123 in Customer_Data' },
  { app: 'Custom objects', actionType: 'CUSTOM_OBJECT_DATA_ROW_CREATE', detailsCopy: 'Create {record name} in {object}', example: 'Create record_1 in object_1' },
  { app: 'Custom objects', actionType: 'CUSTOM_OBJECT_DATA_ROW_UPDATE', detailsCopy: 'Update {record name}: {field} → {new value}', example: 'Update record _1 name to new_record' },
  { app: 'Devices', actionType: 'DEVICES_REQUEST', detailsCopy: 'Assign and order device for {impacted employee}', example: 'Assign and order device for Michael Johnson. Employee: Michael Johnson. New purchases: MacBook Pro 16", Magic Mouse. Item cost: $2,500. Reason: New hire equipment. Effective date: Jan 15, 2025' },
  { app: 'Global payroll', actionType: 'GLOBAL_PAYROLL_PROCESS_REQUEST_APPROVAL', detailsCopy: '{amount} for {entity} ({period})', example: '$923,688.28 for Lopez Ltd (Jun 16–30). Pay period start date: Jun 16, 2025. Pay period end date: Jun 30, 2025. Take action deadline: Jul 2, 2025. Pay run memo: Monthly payroll processing' },
  { app: 'Headcount', actionType: 'BACKFILL_HEADCOUNT', detailsCopy: 'Backfill for {terminated employee}', example: 'Backfill for Michael Johnson' },
  { app: 'Headcount', actionType: 'NEW_HEADCOUNT', detailsCopy: 'Add {x} headcount for {title} ({level}) in {department}', example: 'Add 1 headcount for Product Design Lead (L7) in Design. Number of new headcount: 1. Annualized cash impact: $150,000. Memo: New design team expansion. Headcount owner: Sarah Johnson. Job title: Product Design Lead. Work location: San Francisco, CA. Department: Design. Level: L7. Job Family: Design' },
  { app: 'Headcount', actionType: 'EDIT_HEADCOUNT', detailsCopy: 'Update "{job req}" ({field} → {new value}, + {x} other changes)', example: 'Update "new designer" (level -> L8 and 3 other changes. Memo: Updated level requirement. Changed by: John Smith. Change: Level updated from L7 to L8, Department changed from Design to Product' },
  { app: 'Headcount', actionType: 'CLOSE_HEADCOUNT', detailsCopy: 'Close "{job requisition}" requisition', example: 'Close "new designer" requisition' },
  { app: 'Headcount', actionType: 'HEADCOUNT', detailsCopy: '{Stitch together other details}', example: 'Update "new designer" level to L8 and backfill for Michael Johnson. Number of changes: 2. Changed by: John Smith. Memo: Combined headcount update and backfill request' },
  { app: 'HRIS', actionType: 'TRANSITION', detailsCopy: 'Update {impacted employee}\'s {field} → {new value}', example: 'Update Michael Johnson\'s position -> Product Design Lead. Employee: Michael Johnson. Change: Position updated from Product Designer to Product Design Lead. Reason: Promotion. Change effect date: Jan 15, 2025' },
  { app: 'HRIS', actionType: 'HIRE', detailsCopy: 'Hire {impacted employee} ({position})', example: 'Hire Michael Johnson (Product Designer). Employee: Michael Johnson. Start date: Jan 15, 2025. Title: Product Designer. Department: Design. Level: L5. Compensation: $120,000' },
  { app: 'HRIS', actionType: 'HIRE_WITH_DETAILS', detailsCopy: 'Hire {impacted employee} ({position})', example: 'Hire Sarah Kim (Senior Product Designer). Employee: Sarah Kim. Start date: Jan 15, 2025. Title: Senior Product Designer. Department: Design. Level: L6. Compensation: $150,000' },
  { app: 'HRIS', actionType: 'TERMINATE', detailsCopy: 'Terminate {impacted employee} ({position})', example: 'Terminate Michael Johnson (Product Designer). Employee: Michael Johnson. Title: Product Designer. Termination type: Voluntary. Termination reason: Resignation. Start date: Jan 1, 2024. End date: Jan 15, 2025' },
  { app: 'HRIS', actionType: 'PERSONAL_INFO_CHANGES', detailsCopy: 'Update {impacted employee}\'s {field} → {new value}', example: 'Update Michael Johnson\'s address -> 123 Main Street. Employee: Michael Johnson. Change: Address updated from 456 Oak Avenue to 123 Main Street. Reason: Relocation. Change effect date: Jan 15, 2025' },
  { app: 'IT automations', actionType: 'APP_ACCESS_REQUEST', detailsCopy: 'Grant access to {resource}', example: 'Grant access to rippling-app-test.slack.com' },
  { app: 'Payroll', actionType: 'PAYROLL_RUN_REQUEST_APPROVAL', detailsCopy: '{amount} for {entity} ({period})', example: '$923,688.28 for Lopez Ltd (Jun 16–30). Pay period start date: Jun 16, 2025. Pay period end date: Jun 30, 2025. Take action deadline: Jul 2, 2025. Pay run memo: Monthly payroll processing' },
  { app: 'Permissions', actionType: 'GRANT_DEVELOPER_PERMISSION', detailsCopy: 'Developer permission grant for {impacted employee}', example: 'Grant developer permissions for Michael Johnson. Employee: Michael Johnson. Permission requested: Developer access to production database. Reason: New team member needs database access for development work' },
  { app: 'Procurement', actionType: 'PROCUREMENT_REQUEST', detailsCopy: '{vendor} license purchase ({amount})', example: 'Figma license purchase ($1,000). Amount: $1,000. Vendor: Figma. Payment method: Credit Card. Memo: Annual license renewal for design team' },
  { app: 'Recruiting', actionType: 'ATS_OFFER_LETTER_REQUEST', detailsCopy: 'Offer letter for {candidate name} ({position})', example: 'Offer letter for Michael Johnson (Product Designer). Applicant: Michael Johnson. Job requisition: Senior Product Designer. Employment type: Full-time. Job title: Product Designer' },
  { app: 'Recruiting', actionType: 'ATS_JOB_REQUISITION_CREATE_REQUEST', detailsCopy: 'Create requisition "{requisition name}" ({department})', example: 'Create requisition "Senior Product Designer" (Design). Job requisition: Senior Product Designer. Hiring manager: Sarah Johnson. Employment type: Full-time. Job title: Senior Product Designer' },
  { app: 'Recruiting', actionType: 'ATS_JOB_REQUISITION_EDIT_REQUEST', detailsCopy: 'Update requisition "{requisition name}": {field} → {new value}', example: 'Update requisition "Senior Product Designer": recruiter -> Michael Johnson and 2 other changes. Job requisition: Senior Product Designer. Hiring manager: Sarah Johnson. Change: Recruiter updated from John Smith to Michael Johnson, Department changed from Design to Product. Changed by: Sarah Johnson' },
  { app: 'Recruiting', actionType: 'ATS_DECISION_TO_HIRE_REQUEST', detailsCopy: 'Decide to hire {candidate name} ({position})', example: 'Decide to hire Michael Johnson (Product Designer). Application: APP-12345. Job req name: Senior Product Designer. Employment type: Full-time. Job title: Product Designer' },
  { app: 'RPass', actionType: 'RPASS_REQUEST', detailsCopy: 'Grant access for {impacted employee} ({number} RPass items)', example: 'Grant access for Michael Johnson (5 RPass items). Employee: Michael Johnson. Items: Slack, Figma, Notion, Asana, Jira. Reason: New team member onboarding. Effective date: Jan 15, 2025' },
  { app: 'Scheduling', actionType: 'SCHEDULING_CHANGE_REQUEST', detailsCopy: 'Change shift to {requested time}', example: 'Change shift to Dec 10, 08:15 AM - 05:00 PM PST. Person: Michael Johnson. Schedule: Weekly schedule. Current shift: Dec 9, 08:15 AM - 05:00 PM PST. Proposed shift: Dec 10, 08:15 AM - 05:00 PM PST' },
  { app: 'Scheduling', actionType: 'SCHEDULING_EDIT_SHIFT', detailsCopy: 'Update shift {field} --> {new value} ({shift})', example: 'Update shift location -> San Francisco (Dec 10, 08:15 AM - 05:00 PM PST). Person: Michael Johnson. Schedule: Weekly schedule. Shift: Dec 10, 08:15 AM - 05:00 PM PST. Change: Location updated from New York to San Francisco' },
  { app: 'Scheduling', actionType: 'SCHEDULING_COVER_OFFER', detailsCopy: 'Offer to cover {proposed time}', example: 'Offer to cover Dec 10, 08:15 AM - 05:00 PM PST. Person: Sarah Johnson. Schedule: Weekly schedule. Shift: Dec 10, 08:15 AM - 05:00 PM PST' },
  { app: 'Scheduling', actionType: 'SCHEDULING_DROP_SHIFT', detailsCopy: 'Drop shift ({dropped time})', example: 'Drop shift (Dec 10, 08:15 AM - 05:00 PM PST). Person: Michael Johnson. Schedule: Weekly schedule. Shift: Dec 10, 08:15 AM - 05:00 PM PST' },
  { app: 'Scheduling', actionType: 'SCHEDULING_SWAP_OFFER', detailsCopy: 'Swap {shift1} for {shift2)', example: 'Swap Dec 10, 08:15 AM - 05:00 PM PST for Dec 11, 08:15 AM - 05:00 PM PST. Person: Michael Johnson. Schedule: Weekly schedule. Current shift: Dec 10, 08:15 AM - 05:00 PM PST. Proposed shift: Dec 11, 08:15 AM - 05:00 PM PST' },
  { app: 'Scheduling', actionType: 'SCHEDULING_EMPLOYEE_SHIFT_CONFIRM', detailsCopy: 'Confirm {impacted employee} working {shift}', example: 'Confirm Michael Johnson working Dec 10, 08:15 AM - 05:00 PM PST. Person: Michael Johnson. Schedule: Weekly schedule. Shift: Dec 10, 08:15 AM - 05:00 PM PST' },
  { app: 'Spend', actionType: 'SPEND_REQUEST', detailsCopy: 'Reimburse {amount} ({vendor})', example: 'Reimburse $37.95 (Uber)' },
  { app: 'Time and attendance', actionType: 'TIME_ENTRY', detailsCopy: '{logged time} on {date}', example: '13.75 hours on Dec 10. Person: Michael Johnson. Start time: 8:00 AM. End time: 9:45 PM. Duration: 13.75 hours' },
  { app: 'Time off', actionType: 'LEAVE_REQUEST_APPROVAL', detailsCopy: '{requested quantity} {type of request} ({start date}–{end date})', example: '2.00 vacation days (Dec 10 -11). Employee: Michael Johnson. Start date: Dec 10, 2025. End date: Dec 11, 2025. Duration: 2.00 days' },
  { app: 'Travel', actionType: 'FLIGHT_APPROVAL_REQUEST', detailsCopy: 'Flight for "{trip name}" ({flight details})', example: 'Flight for "Team offsite" (LGA->SFO, Roundtrip). Details: LGA->SFO, Roundtrip. Amount: $450.00. Trip date: Dec 15, 2025. Selection: Economy class' },
  { app: 'Travel', actionType: 'FLIGHT_PRE_APPROVAL_REQUEST', detailsCopy: 'Flight for "{trip name}" ({flight details}) — pre-approval required', example: 'Flight for "Team offsite" (LGA->SFO, Roundtrip) -- pre-approval required' },
  { app: 'Variable Comp', actionType: 'VARIABLE_COMPENSATION_PAYEE_PAYOUT_V1', detailsCopy: '{payout amount} to {payee} ({period})', example: '$101,200 payout for jessica Garcia (December 01 -15). Amount: $101,200. Person: Jessica Garcia. Period: December 01 -15' },
  { app: 'Benefits', actionType: 'BENEFITS_CARRIER_REQUEST', detailsCopy: 'Add {Carrier} ({impacted employees } - {Cost} - {Effective date})', example: 'Add Blue Shield of CA (143 employees - 96K/mo - Effective Mar 1)' },
  { app: 'Chat', actionType: 'CHAT_CHANNEL_CREATION', detailsCopy: '{Request type} with {proposed members}', example: 'Create direct message with Michael Johnson' },
  { app: 'Chat', actionType: 'CHAT_CHANNEL_GROUPS_UPDATE', detailsCopy: 'Update {channel name} membership ({change})', example: 'Update Small channel membership (Add 3 people)' },
  { app: 'Contractor hub', actionType: 'INVOICE_SUBMISSION', detailsCopy: 'Invoice {invoice #} for {Vendor name} - {Amount}', example: 'Invoice (3453) for MJ Agency - $5000' },
  { app: 'Custom objects', actionType: 'CUSTOM_OBJECT_DATA_ROW_RUN_BUSINESS_PROCESS', detailsCopy: 'Update {record name}: {field} → {new value}', example: 'Update record _1 name to new_record' },
  { app: 'Headcount', actionType: 'FORECASTED_ATTRITION_HEADCOUNT', detailsCopy: 'Add {x} headcount for {title} ({level}) in {department} (Forecasted attrition)', example: 'Add 1 headcount for Product Design Lead (L7) in Design (Forecasted attrition)' },
  { app: 'Scheduling', actionType: 'SCHEDULING_SHIFT_PUBLISH', detailsCopy: 'Publish shift ({Shift})', example: 'Publish shift (Dec 10, 08:15 AM - 05:00 PM PST)' },
  { app: 'Scheduling', actionType: 'SCHEDULING_EMPLOYEE_SHIFT_PUBLISH', detailsCopy: 'Publish shift for {Employee} ({Shift})', example: 'Publish shift for John Smith (Dec 10, 08:15 AM - 05:00 PM PST)' },
  { app: 'Tranformations', actionType: 'REFRESH_SCHEDULE_CHANGE', detailsCopy: '{status} refresh for {Tranformation name} source data', example: 'Enable refresh for "transformation_name" source data' }
]

// Generate approval data from CSV
export const generateApprovalData = () => {
  const sampleRequestors = ['Kristine Young', 'Thomas Bennett', 'Madeline Hernandez', 'Sarah Johnson', 'Michael Chen', 'Lisa Thompson', 'John Smith', 'Maria Garcia', 'Alex Martinez', 'Stephanie Perkins']
  
  const generated = csvData.map((row, index) => {
    let attributes = extractAttributes(row.detailsCopy, row.example)
    const category = mapAppToCategory(row.app)
    let subject = row.example // Use example as subject
    
    // Special handling for APPS_UPDATE_ACCESS_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'APPS_UPDATE_ACCESS_REQUEST') {
      subject = "Update Sarah Johnson's access to 5 apps"
      attributes = {
        'Impacted employee': 'Sarah Johnson',
        'Apps': 'Slack, Figma, Notion, Asana, Jira',
        'Reason': 'Role change',
        'Effective date': 'Jan 15, 2025'
      }
    }
    
    // Special handling for APPS_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'APPS_REQUEST') {
      subject = "Update Michael Johnson's access to 3 apps"
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Apps': 'Slack, Figma, Notion',
        'Reason': 'Role change',
        'Effective date': 'Jan 15, 2025'
      }
    }
    
    // Special handling for HIRE - use simple subject but add attributes manually
    if (row.actionType === 'HIRE') {
      subject = 'Hire Michael Johnson (Product Designer)'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Start date': 'Jan 15, 2025',
        'Title': 'Product Designer',
        'Department': 'Design',
        'Level': 'L5',
        'Compensation': '$120,000'
      }
    }
    
    // Special handling for HIRE_WITH_DETAILS - use simple subject but add attributes manually
    if (row.actionType === 'HIRE_WITH_DETAILS') {
      subject = 'Hire Sarah Kim (Senior Product Designer)'
      // Manually set the attributes for this specific request
      attributes = {
        'Employee': 'Sarah Kim',
        'Start date': 'Jan 15, 2025',
        'Title': 'Senior Product Designer',
        'Department': 'Design',
        'Level': 'L6',
        'Compensation': '$150,000'
      }
    }
    
    // Special handling for TERMINATE - use simple subject but add attributes manually
    if (row.actionType === 'TERMINATE') {
      subject = 'Terminate Michael Johnson (Product Designer)'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Title': 'Product Designer',
        'Termination type': 'Voluntary',
        'Termination reason': 'Resignation',
        'Start date': 'Jan 1, 2024',
        'End date': 'Jan 15, 2025'
      }
    }
    
    // Special handling for PERSONAL_INFO_CHANGES - use simple subject but add attributes manually
    if (row.actionType === 'PERSONAL_INFO_CHANGES') {
      subject = 'Update Michael Johnson\'s address -> 123 Main Street'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Change': 'Address updated from 456 Oak Avenue to 123 Main Street',
        'Reason': 'Relocation',
        'Change effect date': 'Jan 15, 2025'
      }
    }
    
    // Special handling for GRANT_DEVELOPER_PERMISSION - use simple subject but add attributes manually
    if (row.actionType === 'GRANT_DEVELOPER_PERMISSION') {
      subject = 'Grant developer permissions for Michael Johnson'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Permission requested': 'Developer access to production database',
        'Reason': 'New team member needs database access for development work'
      }
    }
    
    // Special handling for PROCUREMENT_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'PROCUREMENT_REQUEST') {
      subject = 'Figma license purchase ($1,000)'
      attributes = {
        'Amount': '$1,000',
        'Vendor': 'Figma',
        'Payment method': 'Credit Card',
        'Memo': 'Annual license renewal for design team'
      }
    }
    
    // Special handling for ATS_OFFER_LETTER_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'ATS_OFFER_LETTER_REQUEST') {
      subject = 'Offer letter for Michael Johnson (Product Designer)'
      attributes = {
        'Application': 'APP-12345',
        'Job req name': 'Senior Product Designer',
        'Employment type': 'Full-time',
        'Job title': 'Product Designer'
      }
    }
    
    // Special handling for ATS_JOB_REQUISITION_CREATE_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'ATS_JOB_REQUISITION_CREATE_REQUEST') {
      subject = 'Create requisition "Senior Product Designer" (Design)'
      attributes = {
        'Job req name': 'Senior Product Designer',
        'Hiring manager': 'Sarah Johnson',
        'Employment type': 'Full-time',
        'Job title': 'Senior Product Designer'
      }
    }
    
    // Special handling for ATS_JOB_REQUISITION_EDIT_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'ATS_JOB_REQUISITION_EDIT_REQUEST') {
      subject = 'Update requisition "Senior Product Designer": recruiter -> Michael Johnson and 2 other changes'
      attributes = {
        'Job req name': 'Senior Product Designer',
        'Hiring manager': 'Sarah Johnson',
        'Change': 'Recruiter updated from John Smith to Michael Johnson, Department changed from Design to Product',
        'Changed by': 'Sarah Johnson'
      }
    }
    
    // Special handling for RPASS_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'RPASS_REQUEST') {
      subject = 'Grant access for Michael Johnson (5 RPass items)'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Items': 'Slack, Figma, Notion, Asana, Jira',
        'Reason': 'New team member onboarding',
        'Effective date': 'Jan 15, 2025'
      }
    }
    
    // Special handling for SCHEDULING_CHANGE_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'SCHEDULING_CHANGE_REQUEST') {
      subject = 'Change shift to Dec 10, 08:15 AM - 05:00 PM PST'
      attributes = {
        'Person': 'Michael Johnson',
        'Schedule': 'Weekly schedule',
        'Current shift': 'Dec 9, 08:15 AM - 05:00 PM PST',
        'Proposed shift': 'Dec 10, 08:15 AM - 05:00 PM PST'
      }
    }
    
    // Special handling for SCHEDULING_EDIT_SHIFT - use simple subject but add attributes manually
    if (row.actionType === 'SCHEDULING_EDIT_SHIFT') {
      subject = 'Update shift location -> San Francisco (Dec 10, 08:15 AM - 05:00 PM PST)'
      attributes = {
        'Person': 'Michael Johnson',
        'Schedule': 'Weekly schedule',
        'Shift': 'Dec 10, 08:15 AM - 05:00 PM PST',
        'Change': 'Location updated from New York to San Francisco'
      }
    }
    
    // Special handling for SCHEDULING_COVER_OFFER - use simple subject but add attributes manually
    if (row.actionType === 'SCHEDULING_COVER_OFFER') {
      subject = 'Offer to cover Dec 10, 08:15 AM - 05:00 PM PST'
      attributes = {
        'Person': 'Sarah Johnson',
        'Schedule': 'Weekly schedule',
        'Shift': 'Dec 10, 08:15 AM - 05:00 PM PST'
      }
    }
    
    // Special handling for SCHEDULING_DROP_SHIFT - use simple subject but add attributes manually
    if (row.actionType === 'SCHEDULING_DROP_SHIFT') {
      subject = 'Drop shift (Dec 10, 08:15 AM - 05:00 PM PST)'
      attributes = {
        'Person': 'Michael Johnson',
        'Schedule': 'Weekly schedule',
        'Shift': 'Dec 10, 08:15 AM - 05:00 PM PST'
      }
    }
    
    // Special handling for SCHEDULING_SWAP_OFFER - use simple subject but add attributes manually
    if (row.actionType === 'SCHEDULING_SWAP_OFFER') {
      subject = 'Swap Dec 10, 08:15 AM - 05:00 PM PST for Dec 11, 08:15 AM - 05:00 PM PST'
      attributes = {
        'Person': 'Michael Johnson',
        'Schedule': 'Weekly schedule',
        'Current shift': 'Dec 10, 08:15 AM - 05:00 PM PST',
        'Proposed shift': 'Dec 11, 08:15 AM - 05:00 PM PST'
      }
    }
    
    // Special handling for SCHEDULING_EMPLOYEE_SHIFT_CONFIRM - use simple subject but add attributes manually
    if (row.actionType === 'SCHEDULING_EMPLOYEE_SHIFT_CONFIRM') {
      subject = 'Confirm Michael Johnson working Dec 10, 08:15 AM - 05:00 PM PST'
      attributes = {
        'Person': 'Michael Johnson',
        'Schedule': 'Weekly schedule',
        'Shift': 'Dec 10, 08:15 AM - 05:00 PM PST'
      }
    }
    
    // Special handling for TIME_ENTRY - use simple subject but add attributes manually
    if (row.actionType === 'TIME_ENTRY') {
      subject = '13.75 hours on Dec 10'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Start time': '8:00 AM',
        'End time': '9:45 PM',
        'Duration': '13.75 hours'
      }
    }
    
    // Special handling for LEAVE_REQUEST_APPROVAL - use simple subject but add attributes manually
    if (row.actionType === 'LEAVE_REQUEST_APPROVAL') {
      subject = '2.00 vacation days (Dec 10 -11)'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Start date': 'Dec 10, 2025',
        'End date': 'Dec 11, 2025',
        'Duration': '2.00 days'
      }
    }
    
    // Special handling for FLIGHT_APPROVAL_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'FLIGHT_APPROVAL_REQUEST') {
      subject = 'Flight for "Team offsite" (LGA->SFO, Roundtrip)'
      attributes = {
        'Details': 'LGA->SFO, Roundtrip',
        'Amount': '$450.00',
        'Trip date': 'Dec 15, 2025',
        'Selection': 'Economy class'
      }
    }
    
    // Special handling for FLIGHT_PRE_APPROVAL_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'FLIGHT_PRE_APPROVAL_REQUEST') {
      subject = 'Flight for "Team offsite" (LGA->SFO, Roundtrip) -- pre-approval required'
      attributes = {
        'Details': 'LGA->SFO, Roundtrip',
        'Amount': '$450.00',
        'Trip date': 'Dec 15, 2025',
        'Selection': 'Economy class'
      }
    }
    
    // Special handling for VARIABLE_COMPENSATION_PAYEE_PAYOUT_V1 - use simple subject but add attributes manually
    if (row.actionType === 'VARIABLE_COMPENSATION_PAYEE_PAYOUT_V1') {
      subject = '$101,200 payout for jessica Garcia (December 01 -15)'
      attributes = {
        'Amount': '$101,200',
        'Person': 'Jessica Garcia',
        'Period': 'December 01 -15'
      }
    }
    
    // Special handling for NEW_HEADCOUNT - use simple subject but add attributes manually
    if (row.actionType === 'NEW_HEADCOUNT') {
      subject = 'Add 1 headcount for Product Design Lead (L7) in Design'
      attributes = {
        'Number of new headcount': '1',
        'Annualized cash impact': '$150,000',
        'Memo': 'New design team expansion',
        'Headcount owner': 'Sarah Johnson',
        'Title': 'Product Design Lead',
        'Work location': 'San Francisco, CA',
        'Department': 'Design',
        'Level': 'L7',
        'Job Family': 'Design'
      }
    }
    
    // Special handling for EDIT_HEADCOUNT - use simple subject but add attributes manually
    if (row.actionType === 'EDIT_HEADCOUNT') {
      subject = 'Update "new designer" (level -> L8 and 3 other changes'
      attributes = {
        'Memo': 'Updated level requirement',
        'Changed by': 'John Smith',
        'Change': 'Level updated from L7 to L8, Department changed from Design to Product'
      }
    }
    
    // Special handling for BACKFILL_HEADCOUNT - use simple subject but add attributes manually
    if (row.actionType === 'BACKFILL_HEADCOUNT') {
      subject = 'Backfill for Michael Johnson'
      attributes = {
        'Previous employee': 'Sarah Johnson',
        'Number of new headcount': '1',
        'Annualized cash impact': '$120,000',
        'Memo': 'Replacing departed team member'
      }
    }
    
    // Special handling for CLOSE_HEADCOUNT - use simple subject but add attributes manually
    if (row.actionType === 'CLOSE_HEADCOUNT') {
      subject = 'Close "new designer" requisition'
      attributes = {
        'Memo': 'Position no longer needed',
        'Closed by': 'John Smith',
        'Headcount owner': 'Sarah Johnson'
      }
    }
    
    // Special handling for HEADCOUNT - use simple subject but add attributes manually
    if (row.actionType === 'HEADCOUNT') {
      subject = 'Update "new designer" level to L8 and backfill for Michael Johnson'
      attributes = {
        'Number of changes': '2',
        'Changed by': 'John Smith',
        'Memo': 'Combined headcount update and backfill request'
      }
    }
    
    // Special handling for TRANSITION - use simple subject but add attributes manually
    if (row.actionType === 'TRANSITION') {
      subject = 'Update Michael Johnson\'s position -> Product Design Lead'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Change': 'Position updated from Product Designer to Product Design Lead',
        'Reason': 'Promotion',
        'Change effect date': 'Jan 15, 2025'
      }
    }
    
    // Special handling for APP_ACCESS_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'APP_ACCESS_REQUEST') {
      subject = 'Grant access to rippling-app-test.slack.com'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Department': 'Engineering',
        'Requested resource': 'rippling-app-test.slack.com',
        'Reason': 'New team member needs access'
      }
    }
    
    // Special handling for APP_INSTALL_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'APP_INSTALL_REQUEST') {
      subject = 'Grant Michael Johnson access to 3 apps'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'Apps': 'Slack, Figma, Notion',
        'Reason': 'New team member onboarding',
        'Effective date': 'Jan 15, 2025'
      }
    }
    
    // Special handling for BANKING_NEW_PAYMENT_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'BANKING_NEW_PAYMENT_REQUEST') {
      subject = 'Transfer $100 to Michael Johnson'
      attributes = {
        'Amount': '$100',
        'Currency': 'USD',
        'Transfer type': 'ACH',
        'Reason': 'Vendor payment'
      }
    }
    
    // Special handling for CONTRACT_CREATION - use simple subject but add attributes manually
    if (row.actionType === 'CONTRACT_CREATION') {
      subject = 'Create a contract for Michael Johnson (Product Designer)'
      attributes = {
        'Contractor': 'Michael Johnson',
        'Contract type': 'Independent Contractor',
        'Department': 'Design',
        'Total contract amount': '$50,000',
        'Start date': 'Jan 1, 2025',
        'End date': 'Dec 31, 2025'
      }
    }
    
    // Special handling for CONTRACT_NEGOTIATION - use simple subject but add attributes manually
    if (row.actionType === 'CONTRACT_NEGOTIATION') {
      subject = 'Approve proposed contract changes for Michael Johnson (Product Designer)'
      attributes = {
        'Impacted contractor': 'Michael Johnson',
        'Contract type': 'Independent Contractor',
        'Change': 'Increase hourly rate from $100 to $120'
      }
    }
    
    // Special handling for DEVICES_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'DEVICES_REQUEST') {
      subject = 'Assign and order device for Michael Johnson'
      attributes = {
        'Impacted employee': 'Michael Johnson',
        'New purchases': 'MacBook Pro 16", Magic Mouse',
        'Item cost': '$2,500',
        'Reason': 'New hire equipment',
        'Effect date': 'Jan 15, 2025'
      }
    }
    
    // Special handling for PAYROLL_RUN_REQUEST_APPROVAL and GLOBAL_PAYROLL_PROCESS_REQUEST_APPROVAL - use simple subject but add attributes manually
    if (row.actionType === 'PAYROLL_RUN_REQUEST_APPROVAL' || row.actionType === 'GLOBAL_PAYROLL_PROCESS_REQUEST_APPROVAL') {
      subject = '$923,688.28 for Lopez Ltd (Jun 16–30)'
      attributes = {
        'Pay period: start date': 'Jun 16, 2025',
        'Pay period: end date': 'Jun 30, 2025',
        'Take action deadline': 'Jul 2, 2025',
        'Pay run memo': 'Monthly payroll processing'
      }
    }
    
    // Special handling for ATS_DECISION_TO_HIRE_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'ATS_DECISION_TO_HIRE_REQUEST') {
      subject = 'Decide to hire Michael Johnson (Product Designer)'
      attributes = {
        'Application': 'APP-12345',
        'Job req name': 'Senior Product Designer',
        'Employment type': 'Full-time',
        'Job title': 'Product Designer'
      }
    }
    
    // Special handling for CHAT_CHANNEL_CREATION - use simple subject but add attributes manually
    if (row.actionType === 'CHAT_CHANNEL_CREATION') {
      subject = 'Create direct message with Michael Johnson'
      attributes = {
        'Channel type': 'Direct message',
        'Proposed members': 'Michael Johnson',
        'Request note': 'New team communication channel'
      }
    }
    
    // Special handling for CHAT_CHANNEL_GROUPS_UPDATE - use simple subject but add attributes manually
    if (row.actionType === 'CHAT_CHANNEL_GROUPS_UPDATE') {
      subject = 'Update Small channel membership (Add 3 people)'
      attributes = {
        'Channel name': 'Small channel',
        'Channel type': 'Group',
        'Groups added': '3 people',
        'Groups removed': '',
        'Request note': 'Update channel membership'
      }
    }
    
    // Special handling for INVOICE_SUBMISSION - use simple subject but add attributes manually
    if (row.actionType === 'INVOICE_SUBMISSION') {
      subject = 'Invoice (3453) for MJ Agency - $5000'
      attributes = {
        'Invoice number': '3453',
        'Vendor name': 'MJ Agency',
        'Amount': '$5000'
      }
    }
    
    // Special handling for FORECASTED_ATTRITION_HEADCOUNT - use simple subject but add attributes manually
    if (row.actionType === 'FORECASTED_ATTRITION_HEADCOUNT') {
      subject = 'Add 1 headcount for Product Design Lead (L7) in Design (Forecasted attrition)'
      attributes = {
        'Number of new headcount': '1',
        'Annualized cash impact': '$150,000',
        'Memo': 'Forecasted attrition replacement',
        'Headcount owner': 'Sarah Johnson',
        'Title': 'Product Design Lead',
        'Work location': 'San Francisco, CA',
        'Department': 'Design',
        'Level': 'L7',
        'Job Family': 'Design'
      }
    }
    
    // Special handling for SCHEDULING_SHIFT_PUBLISH - use simple subject but add attributes manually
    if (row.actionType === 'SCHEDULING_SHIFT_PUBLISH') {
      subject = 'Publish shift (Dec 10, 08:15 AM - 05:00 PM PST)'
      attributes = {
        'Schedule': 'Weekly schedule',
        'Shift': 'Dec 10, 08:15 AM - 05:00 PM PST',
        'Location': 'San Francisco Office',
        'Department': 'Operations',
        'Number of employees': '12'
      }
    }
    
    // Special handling for SCHEDULING_EMPLOYEE_SHIFT_PUBLISH - use simple subject but add attributes manually
    if (row.actionType === 'SCHEDULING_EMPLOYEE_SHIFT_PUBLISH') {
      subject = 'Publish shift for John Smith (Dec 10, 08:15 AM - 05:00 PM PST)'
      attributes = {
        'Employee': 'John Smith',
        'Schedule': 'Weekly schedule',
        'Shift': 'Dec 10, 08:15 AM - 05:00 PM PST'
      }
    }
    
    // Special handling for SPEND_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'SPEND_REQUEST') {
      subject = 'Reimburse $37.95 (Uber)'
      attributes = {
        'Amount': '$37.95',
        'Vendor': 'Uber',
        'Purchaser': 'Michael Johnson',
        'Purchase date': 'Dec 10, 2025'
      }
    }
    
    // Special handling for BENEFITS_CARRIER_REQUEST - use simple subject but add attributes manually
    if (row.actionType === 'BENEFITS_CARRIER_REQUEST') {
      subject = 'Add Blue Shield of CA (143 employees - 96K/mo - Effective Mar 1)'
      attributes = {
        'Carrier': 'Blue Shield of CA',
        'Country': 'United States',
        'Impacted employees': '143',
        'Cost': '96K/mo',
        'Effective date': 'Mar 1'
      }
    }
    
    // Special handling for REFRESH_SCHEDULE_CHANGE - use simple subject but add attributes manually
    if (row.actionType === 'REFRESH_SCHEDULE_CHANGE') {
      subject = 'Enable refresh for "transformation_name" source data'
      attributes = {
        'Transformation name': 'transformation_name',
        'Change': 'Enable refresh',
        'Frequency': 'Daily'
      }
    }
    
    const requestorIndex = index % sampleRequestors.length
    const requestor = sampleRequestors[requestorIndex]
    const daysAgo = index % 30
    const requestedDate = new Date()
    requestedDate.setDate(requestedDate.getDate() - daysAgo)
    const requestedOn = requestedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const timeAgo = daysAgo === 0 ? 'just now' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`
    
    // Generate due date based on CSV specifications
    let dueDate: string | undefined
    const actionType = row.actionType
    
    // High urgency: 1 business day
    if (actionType === 'BANKING_NEW_PAYMENT_REQUEST' || 
        actionType === 'GLOBAL_PAYROLL_PROCESS_REQUEST_APPROVAL' ||
        actionType === 'PAYROLL_RUN_REQUEST_APPROVAL' ||
        actionType === 'TIME_ENTRY' ||
        actionType === 'LEAVE_REQUEST_APPROVAL' ||
        actionType === 'VARIABLE_COMPENSATION_PAYEE_PAYOUT_V1') {
      dueDate = generateDueDate(actionType, 1, true) // 1 business day
    }
    // Medium-high urgency: 3 business days
    else if (actionType === 'APPS_REQUEST' ||
             actionType === 'APP_INSTALL_REQUEST' ||
             actionType === 'BENEFITS_CARRIER_REQUEST' ||
             actionType === 'BACKFILL_HEADCOUNT' ||
             actionType === 'NEW_HEADCOUNT' ||
             actionType === 'EDIT_HEADCOUNT' ||
             actionType === 'CLOSE_HEADCOUNT' ||
             actionType === 'FORECASTED_ATTRITION_HEADCOUNT' ||
             actionType === 'HEADCOUNT' ||
             actionType === 'TRANSITION' ||
             actionType === 'HIRE' ||
             actionType === 'HIRE_WITH_DETAILS' ||
             actionType === 'TERMINATE' ||
             actionType === 'PERSONAL_INFO_CHANGES' ||
             actionType === 'GRANT_DEVELOPER_PERMISSION' ||
             actionType === 'PROCUREMENT_REQUEST' ||
             actionType === 'ATS_OFFER_LETTER_REQUEST' ||
             actionType === 'ATS_JOB_REQUISITION_CREATE_REQUEST' ||
             actionType === 'ATS_JOB_REQUISITION_EDIT_REQUEST' ||
             actionType === 'ATS_DECISION_TO_HIRE_REQUEST' ||
             actionType === 'RPASS_REQUEST' ||
             actionType === 'SPEND_REQUEST' ||
             actionType === 'DEVICES_REQUEST' ||
             actionType === 'APPS_UPDATE_ACCESS_REQUEST') {
      dueDate = generateDueDate(actionType, 3, true) // 3 business days
    }
    // Medium/operational cadence: 5 business days
    else if (actionType === 'CONTRACT_CREATION' ||
             actionType === 'INVOICE_SUBMISSION' ||
             actionType === 'CONTRACT_NEGOTIATION' ||
             actionType === 'APP_ACCESS_REQUEST' ||
             actionType === 'SCHEDULING_CHANGE_REQUEST' ||
             actionType === 'SCHEDULING_EDIT_SHIFT' ||
             actionType === 'SCHEDULING_COVER_OFFER' ||
             actionType === 'SCHEDULING_DROP_SHIFT' ||
             actionType === 'SCHEDULING_SWAP_OFFER' ||
             actionType === 'SCHEDULING_EMPLOYEE_SHIFT_CONFIRM' ||
             actionType === 'SCHEDULING_SHIFT_PUBLISH' ||
             actionType === 'SCHEDULING_EMPLOYEE_SHIFT_PUBLISH' ||
             actionType === 'REFRESH_SCHEDULE_CHANGE' ||
             actionType === 'FLIGHT_APPROVAL_REQUEST' ||
             actionType === 'FLIGHT_PRE_APPROVAL_REQUEST') {
      dueDate = generateDueDate(actionType, 5, true) // 5 business days
    }
    // Low urgency: no due date
    else if (actionType === 'CHAT_CHANNEL_CREATION' ||
             actionType === 'CHAT_CHANNEL_GROUPS_UPDATE' ||
             actionType === 'CUSTOM_OBJECT_DATA_ROW_DELETE' ||
             actionType === 'CUSTOM_OBJECT_DATA_ROW_DELETE_NO_DUE_DATE' ||
             actionType === 'CUSTOM_OBJECT_DATA_ROW_CREATE' ||
             actionType === 'CUSTOM_OBJECT_DATA_ROW_UPDATE' ||
             actionType === 'CUSTOM_OBJECT_DATA_ROW_RUN_BUSINESS_PROCESS') {
      dueDate = undefined // No due date
    }
    // Default fallback (shouldn't happen, but just in case)
    else {
      dueDate = generateDueDate(actionType, 7, true) // Default to 7 business days
    }
    
    // Base approval object
    const approval: any = {
      id: index + 1,
      requestor,
      subject,
      category,
      time: timeAgo,
      requestedOn,
      // Ensure specific requests are always pending so they're visible
      status: (row.actionType === 'BACKFILL_HEADCOUNT' || row.actionType === 'CLOSE_HEADCOUNT' || row.actionType === 'GRANT_DEVELOPER_PERMISSION' || row.actionType === 'ATS_JOB_REQUISITION_CREATE_REQUEST' || row.actionType === 'SCHEDULING_COVER_OFFER' || row.actionType === 'SCHEDULING_EMPLOYEE_SHIFT_CONFIRM' || row.actionType === 'VARIABLE_COMPENSATION_PAYEE_PAYOUT_V1' || row.actionType === 'BANKING_NEW_PAYMENT_REQUEST' || row.actionType === 'CUSTOM_OBJECT_DATA_ROW_UPDATE' || row.actionType === 'CHAT_CHANNEL_GROUPS_UPDATE' || row.actionType === 'SPEND_REQUEST' || row.actionType === 'TIME_ENTRY' || row.actionType === 'LEAVE_REQUEST_APPROVAL') 
        ? 'pending' 
        : (index % 3 === 0 ? 'reviewed' : 'pending'), // Mix of pending and reviewed
      itemStatus: (row.actionType === 'BACKFILL_HEADCOUNT' || row.actionType === 'CLOSE_HEADCOUNT' || row.actionType === 'GRANT_DEVELOPER_PERMISSION' || row.actionType === 'ATS_JOB_REQUISITION_CREATE_REQUEST' || row.actionType === 'SCHEDULING_COVER_OFFER' || row.actionType === 'SCHEDULING_EMPLOYEE_SHIFT_CONFIRM' || row.actionType === 'VARIABLE_COMPENSATION_PAYEE_PAYOUT_V1' || row.actionType === 'BANKING_NEW_PAYMENT_REQUEST' || row.actionType === 'CUSTOM_OBJECT_DATA_ROW_UPDATE' || row.actionType === 'CHAT_CHANNEL_GROUPS_UPDATE' || row.actionType === 'SPEND_REQUEST' || row.actionType === 'TIME_ENTRY' || row.actionType === 'LEAVE_REQUEST_APPROVAL')
        ? 'Pending'
        : (index % 3 === 0 ? (index % 6 === 0 ? 'Approved' : 'Rejected') : 'Pending'),
      isSnoozed: false,
      createdBy: requestor,
      dueDate,
      taskType: row.app, // Map App to taskType
      actionType: row.actionType,
      attributes // Store extracted attributes for tooltips
    }
    
    // Add reviewedOn for reviewed items
    if (approval.status === 'reviewed') {
      const reviewedDate = new Date(requestedDate)
      reviewedDate.setDate(reviewedDate.getDate() + Math.floor(Math.random() * 5) + 1)
      approval.reviewedOn = reviewedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      approval.reviewStatus = approval.itemStatus
    }
    
    // Add category-specific fields based on action type
    if (row.app === 'Spend' || row.actionType === 'SPEND_REQUEST') {
      approval.vendor = { name: attributes['Vendor'] || attributes.vendor || 'Vendor' }
      approval.amount = attributes['Amount'] || attributes.amount || '$0.00'
      approval.entity = 'Acme Corp'
      approval.purchaseDate = requestedOn
      approval.expenseCategory = 'Business Expense'
      approval.reason = 'Business expense'
      const amountValue = attributes['Amount'] || attributes.amount || '$0.00'
      approval.changes = { current: '$0', new: amountValue, amount: amountValue }
    } else if (row.app === 'HRIS' || row.app === 'Headcount') {
      approval.employee = {
        name: attributes.impactedEmployee || attributes.impactedPerson || 'Employee',
        role: attributes.role || attributes.position || 'Employee',
        status: 'Full Time',
        location: 'United States'
      }
      approval.fieldName = attributes.field || 'Field'
      approval.changes = {
        current: 'Current Value',
        new: attributes.newValue || 'New Value',
        amount: attributes.newValue || 'New Value'
      }
      if (attributes.changeEffectDate) {
        approval.changeEffectDate = attributes.changeEffectDate
      }
    } else if (row.app === 'Time and attendance') {
      approval.startTime = '9:00 AM'
      approval.endTime = '5:00 PM'
      approval.officeLocation = 'Office'
      approval.changes = {
        current: '0h 0m',
        new: attributes.loggedTime || '8h 0m',
        amount: attributes.loggedTime || '8h 0m'
      }
    } else if (row.app === 'Payroll' || row.app === 'Global payroll') {
      approval.entity = attributes.entity || 'Entity'
      approval.amount = attributes.amount || '$0.00'
      approval.period = attributes.period || 'Period'
    } else if (row.app === 'Travel') {
      approval.trip = {
        name: attributes.tripName || 'Trip',
        linked: true
      }
      approval.flightDetails = attributes.flightDetails || 'Flight details'
    } else if (row.app === 'Time off') {
      approval.requestedQuantity = attributes.requestedQuantity || '1'
      approval.typeOfRequest = attributes.typeOfRequest || 'Time off'
      approval.startDate = attributes.startDate || 'Start date'
      approval.endDate = attributes.endDate || 'End date'
    }
    
    return approval
  })
  
  return generated
}
