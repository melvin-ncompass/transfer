import { Box, Button, Card, Container } from '@mui/material';
import { Iconify } from '../../../components/iconify';
import { SignUpView, SignInView } from "../../../../scaffolding/sections/auth";
import { landingViewStyles } from '../../../styles/pages/landing.styles';

type AuthSectionProps = {
    heroImage: string;
    authTab: 'sign-in' | 'sign-up';
    onBackToHero: () => void;
    isFlipped: boolean;
};

export function AuthSection({ heroImage, authTab, onBackToHero, isFlipped }: AuthSectionProps) {
    return (
        <Box sx={landingViewStyles.authFace(isFlipped, heroImage)}>
            <Container maxWidth="sm">
                <Card sx={landingViewStyles.authCard(heroImage)}>
                    <Box sx={landingViewStyles.authCardOverlay} />
                    <Box sx={landingViewStyles.authCardContent}>
                        <Button
                            startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
                            onClick={onBackToHero}
                            sx={landingViewStyles.backButton}
                        >
                            Back
                        </Button>
                        <Box sx={landingViewStyles.authContainer}>
                            {authTab === 'sign-in' ? <SignInView /> : <SignUpView />}
                        </Box>
                    </Box>
                </Card>
            </Container>
        </Box>
    );
}

