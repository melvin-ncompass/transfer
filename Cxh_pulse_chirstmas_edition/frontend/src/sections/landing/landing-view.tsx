import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Stack, Typography } from '@mui/material';
import { useAppDispatch } from '../../store/hooks';
import { setUser, getFirstAccessibleNavPath } from '../../store/slices/authSlice';
import { useLazyGetCurrentUserQuery } from '../../api';
import { landingViewStyles } from '../../styles/pages/landing.styles';
import { HeroSection, AuthSection, FeatureCard, MethodologySection, LandingFooter } from './components';
import { OccasionLayer } from '../../branding/occasions/OccasionLayer';

// Hero image from public directory - use string path for Vite public assets
const heroImage = '/assets/images/Kajiado_County_aerial_landscape_view_52c637ec.png';

// ----------------------------------------------------------------------

export function LandingView() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [getCurrentUser] = useLazyGetCurrentUserQuery();
    const [authTab, setAuthTab] = useState<'sign-in' | 'sign-up'>('sign-in');
    const [searchParams] = useSearchParams();
    const showAuthParam = searchParams.get('showAuth');
    const authTabParam = searchParams.get('authTab');
    const [loading, setLoading] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (showAuthParam) {
            setIsFlipped(showAuthParam === 'true');
        }
        if (authTabParam) {
            setAuthTab(authTabParam as 'sign-in' | 'sign-up');
        }
    }, [showAuthParam, authTabParam]);

    const verifyAuth = async (): Promise<{ success: boolean; navigationPath?: string }> => {
        try {
            const currentUser = await getCurrentUser().unwrap();
            dispatch(setUser(currentUser));

            const navigationPath = getFirstAccessibleNavPath(
                currentUser.navigation,
                currentUser.permissions
            );

            return { success: true, navigationPath };
        } catch (error: any) {
            return { success: false };
        }
    };

    const handleExploreClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        setLoading(true);
        const authResult = await verifyAuth();
        if (authResult.success && authResult.navigationPath) {
            navigate(authResult.navigationPath);
        } else {
            setIsFlipped(true);
            setAuthTab('sign-in');
        }
        setLoading(false);
    };

    const handleBackToHero = () => {
        setIsFlipped(false);
        navigate('/', { replace: true });
    };

    return (
        <Box sx={landingViewStyles.container}>
            {/* Flip Card Container */}
            <Box sx={{
                ...landingViewStyles.flipCardContainer,
                animation: isFlipped ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none',
            }}>
                <Box sx={landingViewStyles.flipCardInner(isFlipped)}>
                    {/* Shards for Earthquake Effect */}
                    {Array.from({ length: 20 }).map((_, index) => (
                        <Box
                            key={`shard-${index}`}
                            sx={landingViewStyles.shard(heroImage, index, isFlipped)}
                        />
                    ))}

                    {/* Snowfall Effect */}
                    {Array.from({ length: 50 }).map((_, index) => (
                        <Box
                            key={`snow-${index}`}
                            sx={landingViewStyles.snowflake(index, isFlipped)}
                        />
                    ))}

                    {/* Snow Accumulation & Melting */}
                    <OccasionLayer isActive={isFlipped} />

                    <HeroSection heroImage={heroImage} loading={loading} onExploreClick={handleExploreClick} isFlipped={isFlipped} />
                    <AuthSection heroImage="/assets/images/winter-wallpaper.jpg" authTab={authTab} onBackToHero={handleBackToHero} isFlipped={isFlipped} />
                </Box>
            </Box>

            {/* Main Content */}
            <Container maxWidth="lg" sx={landingViewStyles.mainContent}>
                {/* Multi-Sectoral Data Integration Section */}
                <Box sx={landingViewStyles.section}>
                    <Typography variant="h2" sx={landingViewStyles.sectionTitle}>
                        Multi-Sectoral Data Integration
                    </Typography>
                    <Typography variant="body1" sx={landingViewStyles.sectionSubtitle}>
                        CxH Pulse brings together climate, health, and facility data to enable proactive
                        decision-making and targeted interventions
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

                <MethodologySection />
                <LandingFooter />
            </Container>
        </Box>
    );
}
