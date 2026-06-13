import { Type } from '@nestjs/common';


export interface SwaggerResponse {
  status: number;
  description: string;
  dataType?: Type<unknown>;
  isArray?: boolean;
  rawSchema?: Record<string, any>;
  mimeType?: string;
  headers?: Record<string,
    {
      description?: string;
      schema: { type: string; example?: any };
    }
  >;
}

export interface SwaggerEndpointOptions {
  summary: string;
  description?: string;
  tags?: string[];
  bearerAuth?: boolean;
  cookieAuth?: SwaggerCookieAuth[];
  params?: SwaggerParam[];
  query?: SwaggerQuery[];
  body?: {
    type?: Type<unknown>;
    fields?: Record<string, SwaggerField>;
    description?: string;
    required?: boolean;
  };

  responses?: SwaggerResponse[];
}

export interface SwaggerParam {
  name: string;
  type?: Type<unknown>;
}
export interface SwaggerQuery {
  name: string;
  type?: Type<unknown>;
  required?: boolean;
}

export interface SwaggerCookieAuth {
  name: string;
  description?: string;
}

export interface SwaggerField {
  type: 'string' | 'number' | 'boolean' | 'integer'| 'array' | 'object';
  format?: 'email' | 'uuid' | 'date-time' | string;
  required?: boolean;
  example?: any;
  description?: string;
}
