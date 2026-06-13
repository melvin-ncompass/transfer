import { LoginDto } from "../dto/auth.dto";

export const AuthSwagger = {
    LOGIN: {
        summary: 'User Login',
        description: 'User Login using email and password',
        tags: ['System/Auth'],
        bearerAuth: false,
        cookieAuth: [
            { 
                name: 'refresh_token', 
                description: 'HttpOnly, secure cookie for refresh token' 
            },
            { 
                name: 'session_id', 
                description: 'HttpOnly, secure cookie for session ID' 
            },
        ],
        body: {
            type: LoginDto,
            description: 'Details needed for user login',
        },
        responses: [
            {
                status: 200,
                description: 'User Login successful',
                rawSchema: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                            example: 'abcd',
                        },
                    },
                    required: ['accessToken'],
                },
            },

            {
                status: 400,
                description: 'Bad Request - Invalid user data',
            },
        ],
    },

    REFRESH_TOKEN: {
        summary: 'Access Token Refresh',
        description: 'Access Token Refresh using Refresh Token',
        tags: ['System/Auth'],
        bearerAuth: true,
        cookieAuth: [
            { 
                name: 'refresh_token', 
                description: 'HttpOnly, secure cookie for refresh token' 
            },
            { 
                name: 'session_id', 
                description: 'HttpOnly, secure cookie for session ID' 
            },
        ],
        responses: [
            {
                status: 200,
                description: 'Access Token refreshed successfully',
                rawSchema: {
                    type: 'object',
                    properties: {
                        accessToken: {
                            type: 'string',
                            example: 'abcd',
                        },
                    },
                    required: ['accessToken'],
                },
            },
            {
                status: 400,
                description: 'Bad Request - Access Token refreshed failed',
            },
        ],
    },
    LOGOUT: {
        summary: 'User Logout',
        description: 'User Session Logout using session id stored in cookie',
        tags: ['System/Auth'],
        bearerAuth: true,
        cookieAuth: [
            { 
                name: 'refresh_token', 
                description: 'HttpOnly, secure cookie for refresh token' 
            },
            { 
                name: 'session_id', 
                description: 'HttpOnly, secure cookie for session ID' 
            },
        ],
        responses: [
            {
                status: 200,
                description: 'User logged out successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Session Id missing',
            },
        ],
    }
}