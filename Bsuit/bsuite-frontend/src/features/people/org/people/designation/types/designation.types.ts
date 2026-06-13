
export interface IDesignation {
  id: number;
  designationName: string;
}

export interface IDesignationResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: IDesignation;
}

export interface IAllDesignationResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: IDesignation[];
}

export interface ICreateDesignationRequest {
  designationName: string;
}

export interface IUpdateDesignationRequest {
  id: number;
  designationName: string;
}
