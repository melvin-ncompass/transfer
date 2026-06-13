import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { forwardRef } from 'react';
import { Iconify } from '../../../components/iconify';
import { FeatureCard } from './index';
import { landingViewStyles } from '../../../styles/pages/landing.styles';

type DataIntegrationDocProps = {
    onBack?: () => void;
    onLoginClick?: () => void;
    onRegisterClick?: () => void;
    isFlipCardBack?: boolean;
};

export const DataIntegrationDoc = forwardRef<HTMLDivElement, DataIntegrationDocProps>(
    ({ onBack, isFlipCardBack = false }, ref) => {
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
                <Box>
                    <Typography variant="h2" sx={landingViewStyles.sectionTitle}>
                        Featured Prototype: Kajiado County, Kenya
                    </Typography>
                </Box>
                <Box sx={landingViewStyles.section}>
                    <Typography variant="body1" sx={landingViewStyles.sectionSubtitle}>
                        CxH Pulse brings together climate, health, and facility data to enable proactive
                        decision-making and targeted interventions.
                    </Typography>

                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={3}
                        sx={landingViewStyles.cardsStack}
                    >
                        <FeatureCard
                            icon="solar:database-bold-duotone"
                            title="Data Sources"
                            subtitle="Comprehensive multi-source integration"
                            items={[
                                {
                                    icon: 'solar:health-bold-duotone',
                                    label: 'KHIS2',
                                    description: 'Maternal and child health indicators (monthly, 2022-2025)',
                                },
                                {
                                    icon: 'solar:chat-round-bold-duotone',
                                    label: 'PROMPTS',
                                    description: 'Conversational data from pregnant women (daily)',
                                },
                                {
                                    icon: 'solar:cloud-bold-duotone',
                                    label: 'ERA5',
                                    description: 'Climate data - temperature, rainfall, humidity',
                                },
                                {
                                    icon: 'solar:map-bold-duotone',
                                    label: 'Facility List',
                                    description: 'Service capacity and locations',
                                },
                            ]}
                        />
                        <FeatureCard
                            icon="eva:trending-up-fill"
                            title="Analytics Approach"
                            subtitle="Evidence-based correlation and forecasting"
                            items={[
                                {
                                    icon: 'eva:trending-up-fill',
                                    label: 'Heat Stress Index',
                                    description: 'Correlates temperature with maternal distress indicators',
                                },
                                {
                                    icon: 'eva:trending-up-fill',
                                    label: 'Malaria Risk',
                                    description: 'Links rainfall patterns to disease incidence',
                                },
                                {
                                    icon: 'eva:trending-up-fill',
                                    label: 'Ward-Level Forecasts',
                                    description: '12-month predictions with danger zones',
                                },
                                {
                                    icon: 'eva:trending-up-fill',
                                    label: 'Regression Models',
                                    description: 'Statistical associations for targeted interventions',
                                },
                            ]}
                        />
                        <FeatureCard
                            icon="solar:map-bold-duotone"
                            title="Priority Use Cases"
                            subtitle="Actionable insights for decision-makers"
                            items={[
                                {
                                    icon: 'solar:map-bold-duotone',
                                    label: 'Heat Exposure Monitoring',
                                    description: 'Detect maternal distress during heat spells',
                                },
                                {
                                    icon: 'solar:map-bold-duotone',
                                    label: 'Disease Surveillance',
                                    description: 'Anticipate malaria surges for medicine stocking',
                                },
                                {
                                    icon: 'solar:map-bold-duotone',
                                    label: 'Resource Planning',
                                    description: 'Align facility readiness with predicted risks',
                                },
                                {
                                    icon: 'solar:map-bold-duotone',
                                    label: 'Policy Advocacy',
                                    description: 'Data-driven climate adaptation strategies',
                                },
                            ]}
                        />
                    </Stack>
                </Box>
            </>
        );

        // If used as flip card back face, wrap in container with proper styling
        if (isFlipCardBack) {
            return (
                <Box sx={landingViewStyles.dataIntegrationFace}>
                    <Container ref={ref} maxWidth="lg" sx={landingViewStyles.mainContent}>
                        {content}
                    </Container>
                </Box>
            );
        }

        // Otherwise, render normally
        return <Box ref={ref}>{content}</Box>;
    }
);

DataIntegrationDoc.displayName = 'DataIntegrationDoc';

