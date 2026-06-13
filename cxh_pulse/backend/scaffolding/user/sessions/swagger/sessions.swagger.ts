import { getSchemaPath } from "@nestjs/swagger";
import { UserLogResponseDto } from "../dto/swagger-response.dto";

export const SessionsSwagger = {
  SESSION_ACTIVITY_LOGS: {
    summary: 'Get Session logs',
    description: 'Get User Session logs',
    tags: ['Not Integrated'],
    bearerAuth: true,
    query: [{
      name: 'page',
      type: Number,
      required: false
    },
    {
      name: 'limit',
      type: Number,
      required: false
    },],
    responses: [
      {
        status: 200,
        description: 'Session logs fetched successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Failed to fetch session logs',
      },
    ],
  },

  USER_ACTIVITY_LOGS: {
    summary: 'Get All User Activity Logs',
    description: 'Fetch all user activity logs, with optional pagination',
    tags: ['System/Sessions'],
    bearerAuth: true,
    query: [
      {
        name: 'page',
        type: Number,
        required: false
      },
      {
        name: 'limit',
        type: Number,
        required: false
      },
      {
        name: 'search',
        type: String,
        required: false
      },
      {
        name: 'userFilter',
        type: String,
        required: false
      },
      {
        name: 'startDate',
        type: Date,
        required: false
      },
      {
        name: 'endDate',
        type: Date,
        required: false
      },
    ],
    responses: [
      {
        status: 200,
        description: 'All user activity logs fetched successfully',
        rawSchema: {
          oneOf: [
            {
              type: 'object',
              properties: {
                statusCode: {
                  type: 'number',
                  example: 200
                },
                message: {
                  type: 'string',
                  example: 'All user activity logs fetched successfully'
                },
                data: {
                  type: 'array',
                  items: { $ref: getSchemaPath(UserLogResponseDto) },
                },
              },
              required: ['statusCode', 'message', 'data'],
            },
            {
              type: 'object',
              properties: {
                statusCode: {
                  type: 'number',
                  example: 200
                },
                message: {
                  type: 'string',
                  example: 'All user activity logs fetched successfully'
                },
                data: {
                  type: 'array',
                  items: { $ref: getSchemaPath(UserLogResponseDto) },
                },
                total: { type: 'number', example: 50 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                lastPage: { type: 'number', example: 5 },
                search: { type: 'string', example: 'name' }
              },
              required: ['statusCode', 'message', 'data', 'total', 'page', 'limit', 'lastPage', 'search'],
            },
          ],
        },
      },
      {
        status: 400,
        description: 'Bad Request - Failed to fetch user activity logs',
      },
    ],
  },
}