import { Alert, Box, Stack, Typography } from '@mui/material';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCheckResetTokenMutation, useResetPasswordMutation } from '../../../src/api';
import { useRouter } from '../../../src/routes/hooks';
import { PasswordCreationForm } from '../../components/password-creation-form';
import { PasswordSuccess } from '../../components/password-success';
import { Iconify } from '../../../src/components/iconify';
import { PrimaryButton } from '../../../src/components/buttons';

export function ResetPasswordView() {
    const [checkResetToken] = useCheckResetTokenMutation();
    const [resetPassword, { isLoading }] = useResetPasswordMutation();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [success, setSuccess] = useState(false);
    const [invalidToken, setInvalidToken] = useState(false);


    useEffect(() => {
        if (token) {
            checkResetToken({ token })
                .unwrap()
                .then(() => setInvalidToken(false))
                .catch(() => setInvalidToken(true));
        }
    }, [token, checkResetToken]);


    const handleCreatePassword = async (password: string) => {
        setError(null);
        if (!token) {
            setError('Invalid or missing token');
            return;
        }
        try {
            await resetPassword({
                token: token,
                newPassword: password
            }).unwrap();
            setSuccess(true);
        } catch (err: any) {
            setError(err.data?.message || err.message || 'Error creating password');
        }
    };

    if (invalidToken) {
        return (
            <Stack spacing={3} alignItems="center">
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'error.lighter',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Iconify icon="mingcute:close-line" width={48} color="error.main" />
                </Box>
                <Stack spacing={2} alignItems="center">
                    <Typography variant="h5" sx={{ fontWeight: 600 }} color="error.main">
                        Verification Failed
                    </Typography>
                    <Alert severity="error" sx={{ width: '100%' }}>
                        {error || 'Invalid or expired token. Please contact your administrator.'}
                    </Alert>
                </Stack>
                <PrimaryButton sx={{ mt: 2 }} onClick={() => router.push('/?showAuth=true&authTab=sign-in')}>Back to Login</PrimaryButton>
            </Stack>
        )
    }

    if (success) {
        return (
            <PasswordSuccess
                subtitle="Your password has been reset successfully"
                onButtonClick={() => router.push('/?showAuth=true&authTab=sign-in')}
            />
        );
    }

    return (
        <PasswordCreationForm
            onSubmit={handleCreatePassword}
            error={error}
            loading={isLoading}
        />
    );
}