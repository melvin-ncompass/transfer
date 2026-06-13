import { Stack } from '@mui/material';
import { PrimaryButton } from '../../../src/components/buttons';
import { Alert } from '@mui/material';
import { TextField } from '@mui/material';
import { CircularProgress } from '@mui/material';
import { Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../../src/api';
import { Snackbar } from '@mui/material';
import { delay } from "lodash"

export function ForgotPasswordView() {
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

    const handleCreatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setSnackbar({ open: true, message: 'Email is required' });
            return;
        }
        try {
            await forgotPassword({
                email: email,
            }).unwrap();
            setSnackbar({ open: true, message: 'Password reset link sent to your email.' });
            delay(() => navigate('/?showAuth=true&authTab=sign-in'), 2000);
            setEmail('');
        } catch (err: any) {
            setSnackbar({ open: true, message: err.data?.message || err.message || '' });
        }
    };

    const isValidEmail = (mail: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(mail);
        };
        
    return (
        <Stack pl={2} pr={2}>
            <form onSubmit={handleCreatePassword}>
                <Stack spacing={4}>
                    <Stack spacing={0.5} alignItems="center">
                        <Typography variant="h5" sx={{ fontWeight: 600 }} align="center">
                            Forgot Password
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center">
                            Enter your email and we’ll send you a reset link.
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
                        disabled={isLoading || !isValidEmail(email) }
                        sx={{ mt: 2, py: 1.25, fontWeight: 600 }}
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </PrimaryButton>

                    <Snackbar
                        open={snackbar.open}
                        autoHideDuration={5000}
                        onClose={handleCloseSnackbar}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    >
                        <Alert onClose={handleCloseSnackbar} sx={{ width: '100%' }}>
                            {snackbar.message}
                        </Alert>
                    </Snackbar>
                </Stack>
            </form>
        </Stack>
    );
}