import { getSchemaPath } from "@nestjs/swagger";
import { CreateUserResponseDto, GetUsersNonPaginatedResponseDto, GetUsersPaginatedResponseDto, HardDeleteUserResponseDto, InviteMemberDto, RequestMemberDto, UserMemberDto } from "../dto/swagger-response.dto";
import { CreateUserDto, UpdateUserRoleDto } from "../dto/user.dto";

export const UserSwagger = {
  CREATE_USER: {
    summary: 'User Creation',
    description: 'User Creation',
    tags: ['System/Users'],
    bearerAuth: false,
    body: {
      type: CreateUserDto,
      description: "Details to create user",
    },
    responses: [
      {
        status: 200,
        description: 'User created successfully',
        dataType: CreateUserResponseDto
      },
      {
        status: 400,
        description: 'Bad Request - Failed to create user',
      },
    ],
  },

  GET_USER: {
    summary: 'Get all users',
    description: 'Get all users',
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
    },
    {
      name: 'status',
      type: String,
      required: false
    }],
    responses: [
      {
        status: 200,
        description: 'Users fetched successfully',
        rawSchema: {
          oneOf: [
            {
              type: 'object',
              properties: {
                statusCode: { type: 'number', example: 200 },
                message: {
                  type: 'string',
                  example: 'Users fetched successfully',
                },
                data: {
                  $ref: getSchemaPath(GetUsersNonPaginatedResponseDto),
                },
              },
              required: ['statusCode', 'message', 'data'],
            },
            {
              type: 'object',
              properties: {
                statusCode: { type: 'number', example: 200 },
                message: {
                  type: 'string',
                  example: 'Users fetched successfully',
                },
                data: {
                  $ref: getSchemaPath(GetUsersPaginatedResponseDto),
                },
              },
              required: ['statusCode', 'message', 'data'],
            },
          ],
        },
      },
      {
        status: 400,
        description: 'Bad Request - Failed to fetch users',
      },
    ],
  },

  RESTORE_USER: {
    summary: 'Restore user',
    description: 'Restore a user',
    tags: ['System/Users'],
    bearerAuth: true,
    params: [
      {
        name: 'id',
        type: String
      }
    ],
    responses: [
      {
        status: 200,
        description: 'User restored successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Failed to restore user',
      },
    ],
  },
  GET_ALL_USERS: {
    summary: 'Get All users V2',
    description: 'Get all users V2',
    tags: ['System/Users'],
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
    },
    {
      name: 'search',
      type: String,
      required: false
    },
    {
      name: 'status',
      type: String,
      required: false
    },
    {
      name: 'roleFilter',
      type: String,
      required: false
    }],
    responses: [
      {
        status: 200,
        description: 'Users fetched successfully',
        rawSchema: {
          oneOf: [

            {
              type: 'object',
              properties: {
                statusCode: { type: 'number', example: 200 },
                message: {
                  type: 'string',
                  example: 'Users fetched successfully',
                },
                data: {
                  type: 'array',
                  items: {
                    oneOf: [
                      { $ref: getSchemaPath(UserMemberDto) },
                      { $ref: getSchemaPath(InviteMemberDto) },
                      { $ref: getSchemaPath(RequestMemberDto) },
                    ],
                    discriminator: {
                      propertyName: 'type',
                      mapping: {
                        user: getSchemaPath(UserMemberDto),
                        invite: getSchemaPath(InviteMemberDto),
                        request: getSchemaPath(RequestMemberDto),
                      },
                    },
                  },
                },
              },
              required: ['statusCode', 'message', 'data'],
            },


            {
              type: 'object',
              properties: {
                statusCode: { type: 'number', example: 200 },
                message: {
                  type: 'string',
                  example: 'Users fetched successfully',
                },
                data: {
                  type: 'array',
                  items: {
                    oneOf: [
                      { $ref: getSchemaPath(UserMemberDto) },
                      { $ref: getSchemaPath(InviteMemberDto) },
                      { $ref: getSchemaPath(RequestMemberDto) },
                    ],
                    discriminator: {
                      propertyName: 'type',
                      mapping: {
                        user: getSchemaPath(UserMemberDto),
                        invite: getSchemaPath(InviteMemberDto),
                        request: getSchemaPath(RequestMemberDto),
                      },
                    },
                  },
                },
                total: { type: 'number', example: 50 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                lastPage: { type: 'number', example: 5 },
                search: { type: 'string', example: 'name' }
              },
              required: [
                'statusCode',
                'message',
                'data',
                'total',
                'page',
                'limit',
                'lastPage',
                'search'
              ],
            },
          ],
        },
      },
      {
        status: 400,
        description: 'Bad Request - Failed to fetch users',
      },
    ]
  },

  UPDATE_USER_ROLE: {
    summary: 'Update user role',
    description: 'Update a user role',
    tags: ['System/Users'],
    bearerAuth: true,
    body: {
      type: UpdateUserRoleDto,
      description: "Details required to update user role"
    },
    responses: [
      {
        status: 200,
        description: 'User role updated successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Failed to update user role',
      },
    ],
  },

  DEACTIVATE_USER: {
    summary: 'Deactivate user',
    description: 'Deactivate user using email',
    tags: ['System/Users'],
    bearerAuth: true,
    params: [{
      name: "email",
      type: String
    }],
    responses: [
      {
        status: 200,
        description: 'User deactivated successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Failed to deactivate user',
      },
    ],
  },
  ACTIVATE_USER: {
    summary: 'Activate user',
    description: 'Activate user using email',
    tags: ['System/Users'],
    bearerAuth: true,
    params: [{
      name: "email",
      type: String
    }],
    responses: [
      {
        status: 200,
        description: 'User activated successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Failed to activate user',
      },
    ],
  },

  HARD_DELETE_USER: {
    summary: 'Delete user',
    description: 'Delete user using email',
    tags: ['Not Integrated'],
    bearerAuth: true,
    body: {
      fields: {
        emails: {
          type: 'array',
          example: ['admin@example.com', 'user@example.com'],
          required: true,
        },
      } as const,
    },
    responses: [
      {
        status: 200,
        description: 'User hard-deleted successfully',
        dataType: HardDeleteUserResponseDto
      },
      {
        status: 400,
        description: 'Bad Request - Failed to hard-delete user',
      },
    ],
  }
}