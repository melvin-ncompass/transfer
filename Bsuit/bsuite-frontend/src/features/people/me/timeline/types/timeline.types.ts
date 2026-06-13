export interface TimelineDataItem {
  timestamp: string;
  date: string;
  employeeId: string;
  employee_name: string;
  area_of_change: string;
  initial_data?: Record<string, unknown>;
  final_data?: Record<string, unknown>;
}

export interface TimelineApiResponse {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: TimelineDataItem[];
}

export interface GetTimelineParams {
  employeeId: string | number;
  page?: number;
  limit?: number;
}
