import { Box, Button, Card, Container } from '@mui/material';
import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Iconify } from '../../../components/iconify';
import { SignUpView, SignInView } from "../../../../scaffolding/sections/auth";
import { landingViewStyles } from '../../../styles/pages/landing.styles';
import { AuthTab, FlipContentView } from '../types';
import type { AuthTabType } from '../types';

type AuthSectionProps = {
    heroImage: string;
    authTab: AuthTabType;
    onBackToHero: () => void;
};

export const AuthSection = forwardRef<HTMLDivElement, AuthSectionProps>(
    ({ heroImage, authTab }, ref) => {
        const navigate = useNavigate();

        const handleBack = () => {
            navigate(`/?view=${FlipContentView.DATA_INTEGRATION}`);
        };

        return (
            <Box sx={landingViewStyles.authFace}>
                <Box ref={ref} sx={landingViewStyles.authFaceContent}>
                    <Container maxWidth="sm">
                        <Card sx={landingViewStyles.authCard(heroImage)}>
                            <Box sx={landingViewStyles.authCardOverlay} />
                            <Box sx={landingViewStyles.authCardContent}>
                                <Button
                                    startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
                                    onClick={handleBack}
                                    sx={landingViewStyles.backButton}
                                >
                                    Back
                                </Button>
                                <Box sx={landingViewStyles.authContainer}>
                                    {authTab === AuthTab.SIGN_IN ? <SignInView /> : <SignUpView />}
                                </Box>
                            </Box>
                        </Card>
                    </Container>
                </Box>
            </Box>
        );
    }
);

AuthSection.displayName = 'AuthSection';

