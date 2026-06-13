import { getSchemaPath } from "@nestjs/swagger";
import { CreateRoleResponseDto, CreateRoleWithPermissionsResponseDto, GetOneRoleResponseDto, GetRolesNonDetailResponseDto, GetRolesResponseDto, MapPermissionsDto, UpdateRoleResponseDto } from "../dto/roles-swagger-response.dto";
import { AssignPermissionsDto, CreateRoleDto, CreateRoleWithPermissionsDto, UpdateRoleDto } from "../dto/roles.dto";

export const RolesSwagger = {
  GET_ALL_ROLES: {
    summary: 'Get Roles',
    description: 'Get all Roles',
    tags: ['System/Roles'],
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
        name: 'status',
        type: String,
        required: false
      },
      {
        name: 'isDetailed',
        type: Boolean,
        required: false,
        example:true
      }
    ],
    responses: [
      {
        status: 200,
        description: 'Roles fetched successfully',
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
                  example: 'Roles fetched successfully'
                },
                data: {
                  type: 'array',
                  items: {
                    oneOf: [
                      { $ref: getSchemaPath(GetRolesResponseDto) },
                      { $ref: getSchemaPath(GetRolesNonDetailResponseDto) }
                    ]
                  },
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
                  example: 'Roles fetched successfullyy'
                },
                data: {
                  type: 'array',
                  items: {
                    oneOf: [
                      { $ref: getSchemaPath(GetRolesResponseDto) },
                      { $ref: getSchemaPath(GetRolesNonDetailResponseDto) }
                    ]
                  },
                },
                total: { type: 'number', example: 50 },
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                lastPage: { type: 'number', example: 5 },
                search: { type: 'string', example: 'name' }
              },
              required: ['statusCode', 'message', 'data', 'total', 'page', 'limit', 'lastPage', 'search'],
            },
          ]
        }
      },
      {
        status: 400,
        description: 'Bad Request - Failed to fetch Roles',
      },
    ]
  },

  CREATE_ROLE: {
    summary: 'Create Roles',
    description: 'Create custom Roles',
    tags: ['System/Roles'],
    bearerAuth: true,
    body: {
      type: CreateRoleDto,
      description: 'Details needed to create custom Roles',

    },
    responses: [
      {
        dataType: CreateRoleResponseDto,
        status: 200,
        description: 'Roles created successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Roles creation failed',
      },
    ],
  },

  GET_ONE_ROLE: {
    summary: 'Get Role',
    description: 'Get speific Role',
    tags: ['System/Roles'],
    bearerAuth: true,
    params: [{
      name: 'id',
      type: String
    }],
    responses: [
      {
        dataType: GetOneRoleResponseDto,
        status: 200,
        description: 'Role fetched successfully',

      },
      {
        status: 400,
        description: 'Bad Request - Failed to fetch Role',
      },
    ],
  },

  DELETE_ROLE: {
    summary: 'Delete Role',
    description: 'Soft Delete Role',
    tags: ['System/Roles'],
    bearerAuth: true,
    params: [{
      name: 'id',
      type: String,
    }],
    responses: [
      {
        status: 200,
        description: 'Role deletion successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Role deletion failed',
      },
    ],
  },

  RESTORE_ROLE: {
    summary: 'Restore Role',
    description: 'Restore Role',
    tags: ['System/Roles'],
    bearerAuth: false,
    params: [{
      name: 'id',
      type: String,
    }],
    responses: [
      {
        status: 200,
        description: 'Role restored successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Role restoration failed',
      },
    ],
  },

  UPDATE_ROLE: {
    summary: 'Update Role',
    description: 'Update Role',
    tags: ['System/Roles'],
    bearerAuth: true,
    body: {
      type: UpdateRoleDto,
      description: "Details required to update role"
    },
    params: [{
      name: 'id',
      type: String,
    }],
    responses: [
      {
        dataType: UpdateRoleResponseDto,
        status: 200,
        description: 'Role updated successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Role updation failed',
      },
    ],
  },
  CREATE_ROLE_WITH_PERMISSIONS: {
    summary: 'Create Role With Permissions',
    description: 'Create Role With Permissions',
    tags: ['System/Roles'],
    bearerAuth: true,
    body: {
      type: CreateRoleWithPermissionsDto,
      description: 'Details needed to create Role With Permissions',
    },
    responses: [
      {
        dataType: CreateRoleWithPermissionsResponseDto,
        status: 200,
        description: 'Role With Permissions created successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Role With Permissions creation failed',
      },
    ],
  },

  MAP_PERMISSION: {
    summary: 'Map Permissions To Role',
    description: 'Map Permissions To Role',
    tags: ['System/Roles'],
    bearerAuth: true,
    params: [{
      name: 'roleId',
      type: String
    }],
    body: {
      type: AssignPermissionsDto,
      description: 'Details needed to map Permissions',
    },
    responses: [
      {
        dataType: MapPermissionsDto,
        status: 200,
        description: 'Permissions mapped successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Permissions mapped failed',
      },
    ],
  }
}