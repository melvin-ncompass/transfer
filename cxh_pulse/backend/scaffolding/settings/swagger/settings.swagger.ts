import { getSchemaPath } from '@nestjs/swagger';
import { ConfigDto } from './../dto/settings.dto';
import { BrandingConfigItemDto, BrandingResponseDto, EmailConfigItemDto, EmailConfigResponseDto, PathConfigItemDto, PathConfigResponseDto } from './../dto/swagger-response.dto';
export const SettingsSwagger = {
  UPSERT_CONFIG: {
    summary: 'Upsert Config',
    description: 'Upsert Config',
    tags: ['System/Settings'],
    bearerAuth: true,
    body: {
      type: ConfigDto
    },
    responses: [
      {
        status: 200,
        description: 'Configuration created successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Failed to create configuration',
      },
    ],
  },

  BRANDING_CONFIG: {
    summary: 'Get Branding Config',
    description: 'Get Branding Config',
    tags: ['System/Settings'],
    bearerAuth: false,
    responses: [
      {
        dataType: BrandingResponseDto,
        status: 200,
        description: 'Retrieved Branding configuration successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Failed to retrieve Branding configuration',
      },
    ],
  },
  GET_CONFIG: {
    summary: 'Get Config',
    description: 'Get Config',
    tags: ['System/Settings'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Configuration fetched successfully',
        rawSchema: {
          oneOf: [
            { $ref: getSchemaPath(EmailConfigResponseDto) },
            { $ref: getSchemaPath(PathConfigResponseDto) },
            { $ref: getSchemaPath(BrandingResponseDto) },
          ],
        },
      },
      {
        status: 400,
        description: 'Invalid config name',
      },
      {
        status: 403,
        description: 'Unauthorized',
      },
    ],
  },

  GET_ALL_CONFIG: {
    summary: 'Get All Config',
    description: 'Get All Configuration',
    tags: ['System/Settings'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Configurations fetched successfully',
        rawSchema: {
          type: 'array',
          items: {
            oneOf: [
              { $ref: getSchemaPath(PathConfigItemDto) },
              { $ref: getSchemaPath(EmailConfigItemDto) },
              { $ref: getSchemaPath(BrandingConfigItemDto) },
            ],
            discriminator: {
              propertyName: 'name',
              mapping: {
                path: getSchemaPath(PathConfigItemDto),
                email: getSchemaPath(EmailConfigItemDto),
                branding: getSchemaPath(BrandingConfigItemDto),
              },
            },
          },
        },
      },

      {
        status: 400,
        description: 'Bad Request - Failed to retrieve all configuration',
      },
    ],

  },

  UPLOAD_PATH: {
    summary: 'Upsert Config',
    description: 'Upsert Config',
    tags: ['Not Integrated'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Upload path updated successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Failed to upload path',
      },
    ],
  }
}