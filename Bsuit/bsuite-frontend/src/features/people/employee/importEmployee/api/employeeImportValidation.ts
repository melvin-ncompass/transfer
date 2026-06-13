import type { ImportedEmployeeItem } from "./employeeImport.api";

// Regular expressions
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const UAN_REGEX = /^\d{12}$/;
const PF_REGEX = /^[A-Z]{2}[A-Z]{3,5}\d{7}\d{0,3}\d{7}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidDate(dateStr: any): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Safely converts any value to a trimmed string.
 * Returns empty string for null/undefined.
 */
function safeString(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}
function toDateStr(val: unknown): string {
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? "" : val.toISOString().split("T")[0];
  }
  return safeString(val);
}
/**
 * Validates a single ImportedEmployeeItem.
 * Returns an object mapping field paths to arrays of error messages.
 * If no errors exist, the returned object is empty.
 */
export function validateEmployeeItem(employee: ImportedEmployeeItem): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  const addError = (field: string, message: string) => {
    if (!errors[field]) {
      errors[field] = [];
    }
    errors[field].push(message);
  };

  // contactName
  const contactName = safeString(employee.contactName);
  if (contactName === "") {
    addError("contactName", "Contact name is required");
  }

  // employeeType
  const employeeType = safeString(employee.employeeType);
  if (employeeType === "") {
    addError("employeeType", "Employee type is required");
  } else if (employeeType !== "permanent" && employeeType !== "intern") {
    addError("employeeType", "Employee type must be 'permanent' or 'intern'");
  }

  // employeeId
  const employeeId = safeString(employee.employeeId);
  if (employeeId === "") {
    addError("employeeId", "Employee ID is required");
  } else if (employeeId.length > 20) {
    addError("employeeId", "Max 20 chars");
  }

  // workEmail
  const workEmail = safeString(employee.workEmail);
  if (workEmail === "") {
    addError("workEmail", "Work email is required");
  } else if (!EMAIL_REGEX.test(workEmail)) {
    addError("workEmail", "Invalid work email address");
  }

  // dateOfJoining
  const dateOfJoining = employee.dateOfJoining;
  // dateOfJoining
  if (!employee.dateOfJoining) {
    addError("dateOfJoining", "Date of joining is required");
  } else if (!isValidDate(toDateStr(employee.dateOfJoining))) {
    addError("dateOfJoining", "Invalid date of joining format (YYYY-MM-DD)");
  }

  // gender
  const gender = safeString(employee.gender);
  if (gender !== "" && gender !== "male" && gender !== "female" && gender !== "others") {
    addError("gender", "Gender must be male, female, or others");
  }

  // department
  const department = safeString(employee.department);
  if (department === "") {
    addError("department", "Department is required");
  }

  // designation
  const designation = safeString(employee.designation);
  if (designation === "") {
    addError("designation", "Designation is required");
  }

  // reportingToEmployeeId (Conditional)
  const reportingToEmployeeId = safeString(employee.reportingToEmployeeId);
  if (!employee.isSelfReporting && reportingToEmployeeId === "") {
    addError("reportingToEmployeeId", "Reporting Manager Employee ID is required when Self Reporting is disabled");
  }

  // dateOfBirth
  const dateOfBirth = employee.dateOfBirth;
  // dateOfBirth
  if (!employee.dateOfBirth) {
    addError("dateOfBirth", "Date of birth is required");
  } else if (!isValidDate(toDateStr(employee.dateOfBirth))) {
    addError("dateOfBirth", "Invalid date of birth format (YYYY-MM-DD)");
  }
  // mobileNumber
  const mobileNumber = safeString(employee.mobileNumber);
  if (mobileNumber === "") {
    addError("mobileNumber", "Mobile number is required");
  }

  // panNumber
  const panNumber = safeString(employee.panNumber).toUpperCase();
  if (panNumber === "") {
    addError("panNumber", "PAN number is required");
  } else if (!PAN_REGEX.test(panNumber)) {
    addError("panNumber", "PAN must be in format AAAAA9999A");
  }

  // payroll (Conditional)
  if (employee.payroll) {
    const payroll = employee.payroll;
    const template = safeString(payroll.template);
    if (template === "") {
      addError("payroll.template", "Salary template name is required");
    }
    const incomeTaxConfig = safeString(payroll.incomeTaxConfig);
    if (incomeTaxConfig === "") {
      addError("payroll.incomeTaxConfig", "Income tax configuration is required");
    }
    if (payroll.annualGross === undefined || payroll.annualGross === null || isNaN(Number(payroll.annualGross))) {
      addError("payroll.annualGross", "Annual gross is required");
    } else if (Number(payroll.annualGross) <= 0) {
      addError("payroll.annualGross", "Annual gross must be positive");
    }

    if (payroll.isPfEnabled) {
      const pfNumber = safeString(payroll.pfNumber);
      if (pfNumber === "") {
        addError("payroll.pfNumber", "PF Number is required when PF is enabled");
      } else if (!PF_REGEX.test(pfNumber)) {
        addError("payroll.pfNumber", "Invalid PF Number format when PF is enabled");
      }
    }

    const uanNumber = safeString(payroll.uanNumber);
    if (uanNumber !== "") {
      if (!UAN_REGEX.test(uanNumber)) {
        addError("payroll.uanNumber", "UAN must be exactly 12 digits");
      }
    }
  }

  // attendance (Conditional)
  if (employee.attendance) {
    const attendance = employee.attendance;
    const shift = safeString(attendance.shift);
    if (shift === "") {
      addError("attendance.shift", "Shift name is required");
    }
    const weekoff = safeString(attendance.weekoff);
    if (weekoff === "") {
      addError("attendance.weekoff", "Week off plan is required");
    }
    const leavePlan = safeString(attendance.leavePlan);
    if (leavePlan === "") {
      addError("attendance.leavePlan", "Leave plan is required");
    }
    const holidayPlan = safeString(attendance.holidayPlan);
    if (holidayPlan === "") {
      addError("attendance.holidayPlan", "Holiday plan is required");
    }
  }

  return errors;
}

/**
 * Validates a list of ImportedEmployeeItems.
 * Returns an array of validation errors in the same structure as the backend response.
 */
export function validateEmployeeList(employees: ImportedEmployeeItem[]): Array<{
  employeeId: string;
  workEmail: string;
  contactName: string;
  fields: Record<string, string[]>;
}> {
  const validationErrors: Array<{
    employeeId: string;
    workEmail: string;
    contactName: string;
    fields: Record<string, string[]>;
  }> = [];

  // Check for duplicate employeeId, workEmail, panNumber inside the file
  const seenEmployeeIds = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  const seenPans = new Map<string, number>();

  employees.forEach((emp) => {
    const empId = safeString(emp.employeeId);
    if (empId !== "") {
      seenEmployeeIds.set(empId, (seenEmployeeIds.get(empId) ?? 0) + 1);
    }
    const email = safeString(emp.workEmail).toLowerCase();
    if (email !== "") {
      seenEmails.set(email, (seenEmails.get(email) ?? 0) + 1);
    }
    const pan = safeString(emp.panNumber).toUpperCase();
    if (pan !== "") {
      seenPans.set(pan, (seenPans.get(pan) ?? 0) + 1);
    }
  });

  employees.forEach((employee) => {
    const fields = validateEmployeeItem(employee);

    // Add duplicate file validations
    const empId = safeString(employee.employeeId);
    if (empId !== "") {
      if ((seenEmployeeIds.get(empId) ?? 0) > 1) {
        if (!fields["employeeId"]) fields["employeeId"] = [];
        fields["employeeId"].push("Duplicate Employee ID in file");
      }
    }
    const email = safeString(employee.workEmail).toLowerCase();
    if (email !== "") {
      if ((seenEmails.get(email) ?? 0) > 1) {
        if (!fields["workEmail"]) fields["workEmail"] = [];
        fields["workEmail"].push("Duplicate email in file");
      }
    }
    const pan = safeString(employee.panNumber).toUpperCase();
    if (pan !== "") {
      if ((seenPans.get(pan) ?? 0) > 1) {
        if (!fields["panNumber"]) fields["panNumber"] = [];
        fields["panNumber"].push("Duplicate PAN number in file");
      }
    }

    if (Object.keys(fields).length > 0) {
      validationErrors.push({
        employeeId: empId,
        workEmail: email,
        contactName: safeString(employee.contactName),
        fields,
      });
    }
  });

  return validationErrors;
}
