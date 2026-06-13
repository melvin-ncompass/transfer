import { ConfigResponseDto } from "../dto/config-swagger-response.dto";
import { UpsertConfigDto } from "../dto/config.dto";

export const ConfigSwagger = {
    UPSERT_CONFIG: {
        summary: 'Create configuration setting',
        description: 'Create a new configuration setting with threshold values',
        tags: ['Business/Config'],
        bearerAuth: true,
        body: {
            type: UpsertConfigDto,
            description: 'Config setting to be created',

        },
        responses: [
            {
                status: 200,
                description: 'Config setting created successfully',
                dataType: ConfigResponseDto

            },
            {
                status: 400,
                description: 'Bad Request - Invalid input data',
            },
            {
                status: 403,
                description: 'Forbidden - Insufficient permissions',
            },
        ],
    },

    GET_ALL_CONFIG: {
        summary: 'Fetch config settings',
        description: 'Fetch all configuration settings with threshold values',
        tags: ['Business/Config'],
        bearerAuth: true,
        responses: [
            {
                status: 200,
                description: 'Config setting fetched successfully',
                dataType: ConfigResponseDto
            },
            {
                status: 403,
                description: 'Forbidden - Insufficient permissions',
            },
        ],
    }
}