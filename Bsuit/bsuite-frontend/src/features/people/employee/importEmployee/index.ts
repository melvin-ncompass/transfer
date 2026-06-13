// Export all components and API hooks for easier imports

export { default as ImportEmployeePage } from './components/ImportEmployeePage';
export { EmployeeUploadView } from './components/EmployeeUploadView';
export { EmployeeValidationView } from './components/EmployeeValidationView';
export { EmployeeConfirmView } from './components/EmployeeConfirmView';

export {
  useDownloadEmployeeSampleExcelMutation,
  useImportEmployeesMutation,
  useValidateEmployeesMutation,
  useBulkCreateEmployeesMutation,
} from './api/employeeImport.api';

export type {
  ImportedEmployeeItem,
  EmployeePayroll,
  EmployeeAttendance,
  BulkCreateEmployeeDto,
} from './api/employeeImport.api';
