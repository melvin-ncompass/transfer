import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { forwardRef } from 'react';
import { Iconify } from '../../../components/iconify';
import { landingViewStyles } from '../../../styles/pages/landing.styles';

type ClimateHealthPulseDocProps = {
    onBack?: () => void;
    onLoginClick?: (e: React.MouseEvent) => void;
    onRegisterClick?: (e: React.MouseEvent) => void;
};

export const ClimateHealthPulseDoc = forwardRef<
    HTMLDivElement,
    ClimateHealthPulseDocProps
>(
    ({ onBack, onLoginClick, onRegisterClick }, ref) => {
        const content = (
            <>
                {onBack && (
                    <Button
                        startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={20} />}
                        onClick={onBack}
                        sx={landingViewStyles.backButton}
                    >
                        Back
                    </Button>
                )}
                <Box sx={landingViewStyles.section}>
                    <Typography
                        variant="h1"
                        sx={{
                            ...landingViewStyles.sectionTitle,
                            lineHeight: 1.1,
                            fontWeight: 700,
                        }}
                    >
                        Climate x Health Pulse
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{
                            ...landingViewStyles.sectionSubtitle,
                            color: 'text.secondary',
                            maxWidth: 640,
                        }}
                    >
                        Turning climate and health data into action
                    </Typography>
                    <Stack spacing={3}>
                        <Typography variant="body1" color='text.secondary' sx={{ lineHeight: 1.7 }}>
                            Climate conditions are intensifying around the world — driving heatwaves,
                            droughts, floods, and shifting disease patterns that put growing strain on
                            health systems.
                        </Typography>

                        <Typography variant="body1" color='text.secondary' sx={{ lineHeight: 1.7 }}>
                            Health officials face urgent questions every day: when and
                            where will climate-sensitive health risks escalate? How
                            should resources be allocated to prepare for spikes in demand? What early
                            signals can guide faster, more effective response?
                        </Typography>

                        <Typography variant="body1" color='text.secondary' sx={{ lineHeight: 1.7 }}>
                            But the climate data needed to anticipate and respond to these risks rarely
                            reaches the people making frontline decisions. And when it does, climate
                            information is seldom integrated into health system workflows where it
                            could have the most impact.
                        </Typography>

                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 1,
                                mt: 2,
                            }}
                        >
                            <Typography
                                component="span"
                                variant="h5"
                                sx={{
                                    fontWeight: 800,
                                    color: 'primary.main',
                                }}
                            >
                                CxH Pulse
                            </Typography>

                            <Typography
                                component="span"
                                variant="h6"
                                sx={{
                                    lineHeight: 1.7,
                                    color: 'text.primary',
                                }}
                            >
                                bridges these gaps.
                            </Typography>
                        </Box>
                    </Stack>
                </Box>

            </>
        );

        return <Box ref={ref}>{content}</Box>;
    }
);

ClimateHealthPulseDoc.displayName = 'ClimateHealthPulseDoc';
