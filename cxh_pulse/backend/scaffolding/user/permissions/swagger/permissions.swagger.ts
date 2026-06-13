import { CreatePermissionsBulkDto } from "../dto/permissions.dto";
import { GetPermissionResponseDto } from "../dto/swagger-response.dto";

export const PermissionSwagger = {
  CREATE_PERMISSION: {
    summary: 'create Permission',
    description: 'create custom Permission',
    tags: ['Not Integrated'],
    bearerAuth: true,
    body: {
      type: CreatePermissionsBulkDto,
      description: 'Details needed to create custom permissions',
    },
    responses: [
      {
        status: 200,
        description: 'Permissions created successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Permissions creation failed',
      },
    ],
  },
  GET_PERMISSIONS: {
    summary: 'Get permissions',
    description: 'Get all permissions',
    tags: ['Not Integrated'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Permissions fetched successfully',
        dataType: GetPermissionResponseDto
      },
      {
        status: 400,
        description: 'Bad Request - Failed to fetch Permissions',
      },
    ],
  },

  UPDATE_PERMISSION: {
    summary: 'Update Permission',
    description: 'Update Permission',
    tags: ['Not Integrated'],
    bearerAuth: true,
    params: [{
      name: 'id',
      type: String,
    }],
    responses: [
      {
        status: 200,
        description: 'Permissions updated successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Permissions updation failed',
      },
    ],
  },

  DELETE_PERMISSION: {
    summary: 'Delete Permission',
    description: 'Soft Delete Permission',
    tags: ['Not Integrated'],
    bearerAuth: true,
    params: [{
      name: 'id',
      type: String,
    }],
    responses: [
      {
        status: 200,
        description: 'Permissions deletion successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Permissions deletion failed',
      },
    ],
  },

  RESTORE_PERMISSION: {
    summary: 'Restore Permission',
    description: 'Restore Permission',
    tags: ['Not Integrated'],
    bearerAuth: false,
    params: [{
      name: 'id',
      type: String,
    }],
    responses: [
      {
        status: 200,
        description: 'Permissions restored successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Permissions restoration failed',
      },
    ],
  },
  HARD_DELETE_PERMISSION: {
    summary: 'Delete Permission',
    description: 'Hard delete Permission',
    tags: ['Not Integrated'],
    bearerAuth: true,
    params: [{
      name: 'id',
      type: String,
    }],
    responses: [
      {
        status: 200,
        description: 'Business permission and its children hard-deleted successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Permissions hard deletion failed',
      },
    ],
  }
}