import { Stack, TextField, CircularProgress, Typography, Button } from '@mui/material';
import { PrimaryButton } from '../../../src/components/buttons';
import { ProgressSnackbar } from '../../../src/components/snackbar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../../src/api';
import { delay } from "lodash"
import { getAuthUrl } from '../../../src/routes/utils/auth-urls';
import { AuthTab } from '../../../src/sections/landing/types';
import { ISnackBar } from '../../../src/types/component.types';
import { Iconify } from '../../../src/components/iconify';

export function ForgotPasswordView() {
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState<ISnackBar>({ open: false, message: '', severity: 'info' });
    const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

    const handleBack = () => {
        navigate('/login');
    };

    const handleCreatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setSnackbar({ open: true, message: 'Email is required', severity: 'warning' });
            return;
        }
        try {
            await forgotPassword({
                email: email,
            }).unwrap();
            setSnackbar({ open: true, message: `Password reset link has been sent to ${email}`, severity: 'success' });
            delay(() => navigate(getAuthUrl(AuthTab.SIGN_IN)), 2000);
            setEmail('');
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: err.data?.message || err.message || `Failed to send reset link to ${email}`,
                severity: 'error',
            });
        }
    };

    const isValidEmail = (mail: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(mail);
    };

    return (
        <Stack pl={2} pr={2}>
            <Button
                startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
                onClick={handleBack}
                sx={{ alignSelf: 'flex-start', mb: 2, textTransform: 'none' }}
            >
                Back
            </Button>
            <form onSubmit={handleCreatePassword}>
                <Stack spacing={4}>
                    <Stack spacing={0.5} alignItems="center">
                        <Typography variant="h5" sx={{ fontWeight: 600 }} align="center">
                            Forgot Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                            Enter your email and we'll send you a reset link.
                        </Typography>
                    </Stack>

                    <TextField
                        fullWidth
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <PrimaryButton
                        fullWidth
                        type="submit"
                        size="large"
                        startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <></>}
                        disabled={isLoading || !isValidEmail(email)}
                        sx={{ mt: 2, py: 1.25, fontWeight: 600 }}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </PrimaryButton>

                    <ProgressSnackbar
                        open={snackbar.open}
                        message={snackbar.message}
                        severity={snackbar.severity}
                        onClose={handleCloseSnackbar}
                    />
                </Stack>
            </form>
        </Stack>
    );
}