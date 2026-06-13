import { ChangePasswordDto, CheckResetTokenDto, ForgotPasswordDto, ResetPasswordDto, UpdateUserDto } from "../dto/profile.dto";
import { CheckResetTokenResponseDto, GetProfileResponseDto } from "../dto/swagger-response.dto";

export const ProfileSwagger = {
    GET_PROFILE: {
        summary: 'User Profile',
        description: 'Get user profile details',
        tags: ['System/Profile'],
        bearerAuth: true,
        responses: [
            {
                dataType: GetProfileResponseDto,
                status: 200,
                description: 'User profile details fetched successfully',

            },
            {
                status: 400,
                description: 'Bad Request - User profile details failed to fetch',
            },
        ],
    },

    UPDATE_USER_PROILE: {
        summary: 'Update User',
        description: 'Update User Details',
        tags: ['System/Profile'],
        bearerAuth: true,
        body: {
            type: UpdateUserDto,
            description: "Details required to update user"
        },
        responses: [
            {
                status: 200,
                description: 'User updated successfully',
            },
            {
                status: 400,
                description: 'Bad Request - User updation failed',
            },
        ],
    },
    CHANGE_PASSWORD: {
        summary: 'Change Password',
        description: 'Change user password',
        tags: ['System/Profile'],
        bearerAuth: true,
        body: {
            type: ChangePasswordDto,
            description: "Details required to update password"
        },
        responses: [
            {
                status: 200,
                description: 'Password updated successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Password updation failed',
            },
        ],
    },
    CHANGE_PROFILE_PIC: {
        summary: 'Change Profile Picture',
        description: 'Change user profile picture',
        tags: ['System/Profile'],
        bearerAuth: true,
        responses: [
            {
                status: 200,
                description: 'Profile picture updated successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Profile picture updation failed',
            },
        ],
    },
    REMOVE_PROFILE_PIC: {
        summary: 'Remove Profile Picture',
        description: 'Remove user profile picture',
        tags: ['System/Profile'],
        bearerAuth: true,
        responses: [
            {
                status: 200,
                description: 'Profile picture removed successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Profile picture failed to be removed',
            },
        ],
    },
    GET_PROFILE_PIC: {
        summary: 'Get Profile Picture',
        description: 'Get user profile picture',
        tags: ['System/Profile'],
        bearerAuth: true,
        responses: [
            {
                status: 200,
                description: 'Profile picture fetched successfully',
                rawSchema: { 
                    type: 'string', 
                    format: 'binary' 
                },
                mimeType: 'image/*',
                headers: {
                    'Content-Type': {
                        description: 'Image MIME type',
                        schema: { type: 'string', example: 'image/png' },
                    },
                },
            },
            {
                status: 400,
                description: 'Bad Request - Profile picture file missing',
            },
        ],
    },

    FORGOT_PASSWORD: {
        summary: 'Forgot Password',
        description: 'Forgot user password',
        tags: ['System/Profile'],
        bearerAuth: false,
        body: {
            type: ForgotPasswordDto,
            description: "Details required to send reset link"
        },
        responses: [
            {
                status: 200,
                description: 'Reset link sent successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Failed to send reset link',
            },
        ],
    },
    RESET_PASSWORD: {
        summary: 'Reset Password',
        description: 'Reset user password',
        tags: ['System/Profile'],
        bearerAuth: false,
        body: {
            type: ResetPasswordDto,
            description: "Details required to reset password"
        },
        responses: [
            {
                status: 200,
                description: 'Password reset successfully',
            },
            {
                status: 400,
                description: 'Bad Request - Failed to reset password',
            },
        ],
    },
    CHECK_RESET_TOKEN: {
        summary: 'Check Reset Token',
        description: 'Check Reset Token validity',
        tags: ['System/Profile'],
        bearerAuth: false,
        body: {
            type: CheckResetTokenDto,
            description: "Details required to verify token validity"
        },
        responses: [
            {
                dataType: CheckResetTokenResponseDto,
                status: 200,
                description: 'Reset token valid',
            },
            {
                status: 400,
                description: 'Bad Request - Reset token invalid',
            },
        ],
    }
}