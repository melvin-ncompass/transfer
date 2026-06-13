import { CheckInviteDto } from "scaffolding/user/signup-request/dto/signup-request.dto";
import { AcceptInviteDto, CreateUserFromInviteDto, InviteUserDto, ReinviteUserDto } from "../dto/invites.dto";
import { GetInvitesResponseDto, InviteResponseDto, OnboardResponseDto } from "../dto/swagger-response.dto";

export const InvitesSwagger = {
  INVITE_USER: {
    summary: 'Invite User',
    description: 'Invite User using name, email and role',
    tags: ['System/Invites'],
    bearerAuth: true,
    body: {
      type: InviteUserDto,
      description: 'User details to create invite',
    },
    responses: [
      {
        status: 200,
        description: 'Invite sent successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Invite user request failed',
      },
      {
        status: 403,
        description: 'Forbidden - Insufficient permissions',
      },
    ],
  },
  GET_INVITES: {
    summary: 'Get User Invites',
    description: 'Get all User Invites',
    tags: ['Not Integrated'],
    bearerAuth: true,
    responses: [
      {
        status: 200,
        description: 'Invite fetched successfully',
        dataType: GetInvitesResponseDto
      },
      {
        status: 400,
        description: 'Bad Request - Getting all user invites failed',
      },
      {
        status: 403,
        description: 'Forbidden - Insufficient permissions',
      },
    ],
  },

  CHECK_INVITE: {
    summary: 'Check User Invites',
    description: 'Check User Invites Token Validity ',
    tags: ['System/Invites'],
    bearerAuth: false,
    body: {
      type: CheckInviteDto,
      description: 'Invite token details to check token expiry',
    },
    responses: [
      {
        status: 200,
        description: 'Invite token valid',
        dataType: InviteResponseDto
      },
      {
        status: 400,
        description: 'Bad Request - Invite token expired',
      },
    ],
  },

  ACCEPT_INVITE: {
    summary: 'Accept Invite',
    description: 'Accept User Invite',
    tags: ['System/Invites'],
    bearerAuth: false,
    body: {
      type: AcceptInviteDto,
      description: 'Invite token details to check token expiry',
    },
    responses: [
      {
        status: 200,
        description: 'Invite accepted successfully',
        dataType: InviteResponseDto
      },
      {
        status: 400,
        description: 'Bad Request - Invite accept request failed',
      },
    ],
  },

  ONBOARD: {
    summary: 'User Onboard',
    description: 'User accepted invite',
    tags: ['System/Invites'],
    bearerAuth: false,
    body: {
      type: CreateUserFromInviteDto,
      description: 'Details to create password after accepting the invite',
    },
    responses: [
      {
        status: 200,
        description: 'User created successfully',
        dataType: OnboardResponseDto
      },
      {
        status: 400,
        description: 'Bad Request - User creation failed',
      },
    ],
  },

  REINVITE: {
    summary: 'Resend Invite',
    description: 'Resend User Invite',
    tags: ['System/Invites'],
    bearerAuth: true,
    body: {
      type: ReinviteUserDto,
      description: 'User details to reinvite',
    },
    responses: [
      {
        status: 200,
        description: 'Re-invite mail sent successfully',
      },
      {
        status: 400,
        description: 'Bad Request - Reinvite request failed',
      },
    ],
  }
}