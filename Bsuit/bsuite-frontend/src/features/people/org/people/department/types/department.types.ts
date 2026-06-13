
export interface IDepartment {
  id: number;
  departmentName: string;
}

export interface IDepartmentResponse {
  statusCode: number;
  message: string;
  data: IDepartment;
}

export interface IAllDepartmentResponse {
  statusCode: number;
  message: string;
  data: IDepartment[];
}

export interface ICreateDepartmentRequest {
  departmentName: string;
}

export interface IUpdateDepartmentRequest {
  id: number;
  departmentName: string;
}
