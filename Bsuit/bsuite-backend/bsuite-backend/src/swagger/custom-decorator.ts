import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { SwaggerEndpointOptions } from "./interface";

export function SwaggerEndpoint<
  T extends Record<string, SwaggerEndpointOptions>,
>(config: T, key: keyof T): MethodDecorator & PropertyDecorator {
  const options = config[key];

  if (!options) {
    throw new Error(`Swagger config not found for key: ${String(key)}`);
  }

  const decorators: Array<
    ClassDecorator | MethodDecorator | PropertyDecorator
  > = [];

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

  options.params?.forEach((param) => {
    decorators.push(
      ApiParam({
        name: param.name,
        type: param.type as any,
        required: param.required ?? true,
        description: param.description,
        example: param.example,
      }),
    );
  });

  options.query?.forEach((query) => {
    decorators.push(
      ApiQuery({
        name: query.name,
        type: query.type as any,
        required: query.required ?? false,
        description: query.description,
        example: query.example,
      }),
    );
  });

  options.cookies?.forEach((cookie) => {
    decorators.push(ApiCookieAuth(cookie.name));
    decorators.push(
      ApiHeader({
        name: cookie.name,
        description: `(Cookie) ${cookie.description ?? ""}`,
        required: cookie.required ?? false,
        schema: { type: "string" },
      }),
    );
  });

  if (options.body) {
    const bodies = Array.isArray(options.body) ? options.body : [options.body];

    bodies.forEach((body) => {
      decorators.push(ApiExtraModels(body.type));
      decorators.push(
        ApiBody({
          type: body.type,
          description: body.description,
          required: body.required ?? true,
        }),
      );
    });
  }

  options.responses?.forEach((response) => {
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

    const dataTypes = response.dataType
      ? Array.isArray(response.dataType)
        ? response.dataType
        : [response.dataType]
      : [];

    if (dataTypes.length) {
      decorators.push(ApiExtraModels(...dataTypes));
    }

    let dataSchema: any;

    if (dataTypes.length === 1) {
      dataSchema = { $ref: getSchemaPath(dataTypes[0]) };
    } else if (dataTypes.length > 1) {
      dataSchema = {
        oneOf: dataTypes.map((type) => ({
          $ref: getSchemaPath(type),
        })),
      };
    }

    decorators.push(
      ApiResponse({
        status: response.status,
        description: response.description,
        schema: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: response.status < 400,
            },
            statusCode: {
              type: "number",
              example: response.status,
            },
            timestamp: {
              type: "string",
              example: new Date().toISOString(),
            },
            message: {
              type: "string",
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
