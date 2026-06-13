import { CheckRequestDto, CreateUserFromRequestDto, CreateUserRequestDto } from "../dto/signup-request.dto";
import { CreateUserRequestResponseDto, GetUserRequestResponseDto, ProcessUserResponseDto } from "../dto/swagger-response.dto";

export const SignupSwagger = {
    CREATE_USER_FROM_REQUEST: {
        summary: 'User Signup Request',
        description: 'User Signup Request Creation',
        tags: ['System/Sign Up Request'],
        bearerAuth: false,
        body: {
            type: CreateUserRequestDto,
            description: 'User details to create request',
        },
        responses: [
            {
                dataType: CreateUserRequestResponseDto,
                status: 200,
                description: 'Request sent successfully',
            },
            {
                status: 400,
                description: 'Bad Request - User signup request failed',
            },
        ],
    },

    GET_USER_REQUEST: {
        summary: 'Get all user Signup Request',
        description: 'Get all user Signup Requests',
        tags: ['System/Sign Up Request'],
        bearerAuth: false,
        responses: [
            {
                dataType: GetUserRequestResponseDto,
                status: 200,
                description: 'All user Signup Request fetched successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Failed to fetch user signup requests',
            },
        ],
    },

    PROCESS_USER_REQUEST: {
        summary: 'User Signup Request Processing',
        description: 'Processing user Signup Requests',
        tags: ['System/Sign Up Request'],
        bearerAuth: true,
        responses: [
            {
                dataType: ProcessUserResponseDto,
                status: 200,
                description: 'Request has been processed successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Failed to process user signup requests',
            },
        ],
    },

    CHECK_REQUEST: {
        summary: 'User Signup Request Check',
        description: 'Get all user Signup Requests',
        tags: ['Not Integrated'],
        bearerAuth: false,
        body: {
            type: CheckRequestDto,
            description: "Detail to retrieve request status"
        },
        responses: [
            {
                status: 200,
                description: 'Request status retrieved successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Failed to fetch user signup request status',
            },
        ],
    },

    REQUEST_ONBOARD: {
        summary: 'User Signup Request Onboarding',
        description: 'User Signup Request Onboarding Processing',
        tags: ['Not Integrated'],
        bearerAuth: false,
        body: {
            type: CreateUserFromRequestDto,
            description: "Details to create user from request"
        },
        responses: [
            {
                status: 200,
                description: 'User created successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Failed to create user from request',
            },
        ],
    }
}