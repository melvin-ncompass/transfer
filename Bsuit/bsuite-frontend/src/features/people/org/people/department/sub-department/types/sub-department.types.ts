import type { IDepartment } from "../../types/department.types";

export interface ISubDepartment {
  id: number;
  subDepartmentName: string;
  department: IDepartment;
}

export interface ISubDepartmentResponse {
  statusCode: number;
  message: string;
  data: ISubDepartment;
}

export interface IAllSubDepartmentResponse {
  statusCode: number;
  message: string;
  data: ISubDepartment[];
}

export interface ICreateSubDepartmentRequest {
  subDepartmentName: string;
  departmentId: number;
}

export interface IUpdateSubDepartmentRequest {
  id: number;
  subDepartmentName: string;
}
