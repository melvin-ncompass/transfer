import { createContext, useContext, type ReactNode } from "react";
import type { NoticePeriodConfig } from "../settings/NoticePeriod/types/notice.types";
import type { EmployeeIdPrefixResponse } from "../settings/EmpIdGeneration/types/empidgen.types";
import type { IAllDepartmentResponse } from "../department/types/department.types";
import type { IAllDesignationResponse } from "../designation/types/designation.types";

/** Notice Period slice (part of People > Settings). */
export interface PeopleNoticePeriodSlice {
  data: NoticePeriodConfig | null;
  isLoading: boolean;
  configId: number;
  onConfigCreated: (id: number) => void;
}

/** Employee ID Prefix slice (part of People > Settings). */
export interface PeopleEmpIdPrefixSlice {
  data: EmployeeIdPrefixResponse | undefined;
  isLoading: boolean;
}

/** Department list (People > Department sub-tab). */
export interface PeopleDepartmentSlice {
  data: IAllDepartmentResponse | undefined;
  isLoading: boolean;
}

/** Designation list (People > Designation sub-tab). */
export interface PeopleDesignationSlice {
  data: IAllDesignationResponse | undefined;
  isLoading: boolean;
}

/** People tab context. Includes Department, Designation, and Settings (notice period, emp id) data. */
export interface PeopleContextValue {
  noticePeriod: PeopleNoticePeriodSlice;
  empIdPrefix: PeopleEmpIdPrefixSlice;
  department: PeopleDepartmentSlice;
  designation: PeopleDesignationSlice;
}

const defaultValue: PeopleContextValue = {
  noticePeriod: {
    data: null,
    isLoading: false,
    configId: 1,
    onConfigCreated: () => {},
  },
  empIdPrefix: {
    data: undefined,
    isLoading: false,
  },
  department: {
    data: undefined,
    isLoading: false,
  },
  designation: {
    data: undefined,
    isLoading: false,
  },
};

export const PeopleContext = createContext<PeopleContextValue>(defaultValue);

export interface PeopleProviderProps {
  value: PeopleContextValue;
  children: ReactNode;
}

export function PeopleProvider({ value, children }: PeopleProviderProps) {
  return (
    <PeopleContext.Provider value={value}>
      {children}
    </PeopleContext.Provider>
  );
}

export function usePeopleContext(): PeopleContextValue {
  return useContext(PeopleContext);
}
