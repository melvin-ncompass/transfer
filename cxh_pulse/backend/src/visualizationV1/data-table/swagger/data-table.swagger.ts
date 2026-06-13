import { DataTableResponseDto } from "../dto/data-table.dto";

export const DataTableSwagger = {
    GET_DATA_TABLE: {
        summary: 'Get data table',
        description: 'Fetch data table for the specified time range filtered by location',
        tags: ['Business/Data'],
        bearerAuth: true,
        responses: [
            {
                status: 200,
                description: 'Data table fetched successfully',
                dataType: DataTableResponseDto,
                isArray: true
            },
            {
                status: 400,
                description: 'Invalid filters',
            },

            {
                status: 403,
                description: 'Forbidden - Insufficient permissions',
            },
        ],
    }
}