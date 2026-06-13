export interface ValidationError {
  field: string;
  reason: string;
}

export interface ValidationResult {
  rowIndex: number;
  errors: ValidationError[];
}
