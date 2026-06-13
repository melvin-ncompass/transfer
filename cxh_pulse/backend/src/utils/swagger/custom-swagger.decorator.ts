import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { SwaggerEndpointOptions } from './swagger.interface';

export function SwaggerEndpoint<
  T extends Record<string, SwaggerEndpointOptions>,
>(
  config: T,
  key: keyof T,
) {
  const options = config[key];

  if (!options) {
    throw new Error(`Swagger config not found for key: ${String(key)}`);
  }

  const decorators = [];

  decorators.push(
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  );

  if (options.tags?.length) {
    decorators.push(ApiTags(...options.tags));
  }

  if (options.bearerAuth) {
    decorators.push(ApiBearerAuth());
  }

  if (options.cookieAuth?.length) {
    options.cookieAuth.forEach((cookie) => {
      decorators.push(
        ApiCookieAuth(cookie.name)
      );
    });
  }
  options.params?.forEach((param) => {
    decorators.push(
      ApiParam({
        name: param.name,
        type: param.type,
      }),
    );
  });

  options.query?.forEach((q) => {
    decorators.push(
      ApiQuery({
        name: q.name,
        type: q.type,
        required: q.required ?? false,
      }),
    );
  });

  if (options.body) {
    let bodyOptions: any = {
      description: options.body.description,
      required: options.body.required ?? true,
    };

    if (options.body.type) {
      bodyOptions.type = options.body.type;
    } else if (options.body.fields) {
      bodyOptions.schema = {
        type: 'object',
        properties: options.body.fields,
        required: Object.keys(options.body.fields).filter(
          (key) => options.body.fields![key].required
        ),
      };
    }

    decorators.push(ApiBody(bodyOptions));
  }

  options.responses?.forEach((response) => {

    if (response.rawSchema?.format === 'binary') {
      const mimeType = response.mimeType || 'image/*';
      decorators.push(
        ApiResponse({
          status: response.status,
          description: response.description,
          content: {
            [response.mimeType ?? 'application/octet-stream']: {
              schema: {
                type: 'string',
                format: 'binary',
              },
            },
          },
          headers: response.headers,
        }),
      );
      return;
    }

    if (response.rawSchema) {
      decorators.push(
        ApiResponse({
          status: response.status,
          description: response.description,
          schema: response.rawSchema,
        }),
      );
      return;
    }


    if (response.dataType) {
      decorators.push(ApiExtraModels(response.dataType));
    }

    const dataSchema = response.dataType
      ? response.isArray
        ? {
          type: 'array',
          items: { $ref: getSchemaPath(response.dataType) },
        }
        : { $ref: getSchemaPath(response.dataType) }
      : undefined;

    decorators.push(
      ApiResponse({
        status: response.status,
        description: response.description,
        schema: {
          type: 'object',
          properties: {
            statusCode: {
              type: 'number',
              example: response.status,
            },
            message: {
              type: 'string',
              example: response.description,
            },
            ...(dataSchema && { data: dataSchema }),
          },
        },
      }),
    );
  });

  return applyDecorators(...decorators);
}
