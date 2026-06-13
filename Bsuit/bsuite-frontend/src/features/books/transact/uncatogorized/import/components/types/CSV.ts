// import type { DataRow } from "../pages/UploadCSV";
import type { ValidationResult } from "./ValidationTypes";

export interface CSV{
    index:number,
    data: Record<string, string>[]; // mapped data
  rawData: Record<string, string>[]; // raw CSV
  columnMapping?: Record<string, string>; // systemField -> CSV column
  uploadedFile?: File | null;
  validationResults?: ValidationResult[];
  serverDuplicates?: any[];
  duplicatesToCreate?:any[];
  hasEdits:boolean;
  dateFormat: string;
  dateCandidates: string[];
  descriptionCandidates: string[];
  debitCandidates: string[];
  creditCandidates: string[];
  processed:any[]; 
  accountId?:number;
}