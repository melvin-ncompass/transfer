import { Type } from "@nestjs/common";
import { SchemaObject, ReferenceObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

export interface SwaggerParam {
  name: string;
  type?: Type<unknown> | String | Number | Boolean;
  required?: boolean;
  description?: string;
  example?: any;
}

export interface SwaggerBody {
  type: Type<unknown>;
  description?: string;
  required?: boolean;
}

export interface SwaggerQuery extends SwaggerParam {}

export interface SwaggerCookie {
  name: string;
  description?: string;
  required?: boolean;
}

export interface SwaggerResponse {
  status: number;
  description: string;
  dataType?: Type<unknown> | Type<unknown>[]; 
  rawSchema?: SchemaObject | ReferenceObject;
}

export interface SwaggerEndpointOptions {
  summary: string;
  description?: string;
  tags?: string[];
  bearerAuth?: boolean;
  body?: SwaggerBody | SwaggerBody[];
  params?: SwaggerParam[];
  query?: SwaggerQuery[];
  cookies?: SwaggerCookie[];
  responses?: SwaggerResponse[];
}

export class ApiResponseEnvelope<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  message: string;
  data: T;
}