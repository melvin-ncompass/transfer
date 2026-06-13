import { useMemo, useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Stack, Slider, CircularProgress, Skeleton } from '@mui/material';
import { Iconify } from '../../../components/iconify';
import { PrimaryButton } from '../../../components/buttons';
import {
    useGetConfigurationQuery,
    useUpdateConfigurationMutation,
} from '../../../api';
import { ISnackBar } from '../../../types/component.types';
import { ProgressSnackbar } from '../../../components/snackbar';
import { configViewStyles } from '../../../styles/pages/config.styles';

// ----------------------------------------------------------------------

/**
 * Config View
 *
 * Configuration view for climate-health alert thresholds.
 * Handles all UI logic for the configuration page.
 */
export function ConfigView() {
    const { data: configuration, isLoading: configurationLoading } = useGetConfigurationQuery();
    const [updateConfiguration, { isLoading: updateConfigurationLoading }] =
        useUpdateConfigurationMutation();
    const [snackbar, setSnackbar] = useState<ISnackBar>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [temperatureThreshold, setTemperatureThreshold] = useState<number>(28.5);
    const [precipitationThreshold, setPrecipitationThreshold] = useState<number>(170);
    const [lastKnownConfig, setLastKnownConfig] = useState<{
        temperatureThreshold: number;
        precipitationThreshold: number;
    } | null>(null);

    useEffect(() => {
        if (configuration) {
            const tempValue = configuration.config.temperatureThreshold ?? 28.5;
            const precipValue = configuration.config.precipitationThreshold ?? 170;
            setTemperatureThreshold(tempValue);
            setPrecipitationThreshold(precipValue);
            setLastKnownConfig({
                temperatureThreshold: tempValue,
                precipitationThreshold: precipValue,
            });
        }
    }, [configuration]);

    const handleSaveSettings = () => {

        updateConfiguration({
            temperatureThreshold,
            precipitationThreshold,
        })
            .unwrap()
            .then(() => {
                setSnackbar({
                    open: true,
                    message: `Configuration saved: Temperature ${temperatureThreshold.toFixed(1)}°C, Precipitation ${precipitationThreshold}mm`,
                    severity: 'success',
                });
                setLastKnownConfig({
                    temperatureThreshold,
                    precipitationThreshold,
                });
            })
            .catch(() => {
                setSnackbar({ open: true, message: 'Failed to save configuration. Please try again.', severity: 'error' });
            });
    };

    const handleSnackbarClose = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    const isDataChanged = useMemo(() => {

        const baseConfig =
            lastKnownConfig ||
            (configuration
                ? {
                    temperatureThreshold: configuration.config.temperatureThreshold ?? 28.5,
                    precipitationThreshold: configuration.config.precipitationThreshold ?? 170,
                }
                : null);

        if (!baseConfig) {
            const tempChanged = Math.abs(temperatureThreshold - 28.5) > 0.01;
            const precipChanged = precipitationThreshold !== 170;
            return tempChanged || precipChanged;
        }

        const tempChanged = Math.abs(temperatureThreshold - baseConfig.temperatureThreshold) > 0.01;
        const precipChanged = precipitationThreshold !== baseConfig.precipitationThreshold;
        return tempChanged || precipChanged;
    }, [temperatureThreshold, precipitationThreshold, configuration, lastKnownConfig]);

    const isSliderLoading = configurationLoading || updateConfigurationLoading;

    return (
        <Box sx={configViewStyles.container}>
            <Box>
                <Stack spacing={1}>
                    {/* Temperature Danger Zone */}
                    <Card>
                        <CardContent sx={configViewStyles.cardContent}>
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="h5">Temperature Danger Zone</Typography>
                                </Stack>

                                <Typography variant="body2" color="text.secondary">
                                    Maximum temperature threshold for heat stress alerts.
                                </Typography>

                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2">Threshold Temperature (°C)</Typography>
                                        <Typography 
                                            variant="body2" 
                                            sx={{
                                                ...configViewStyles.thresholdValue, 
                                                minWidth: 48
                                            }}
                                        >
                                            {(configurationLoading || updateConfigurationLoading) ? (
                                                <CircularProgress size={12} /> ) : (
                                                temperatureThreshold && temperatureThreshold.toFixed(1) + '°C'
                                            )}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="caption" color="text.secondary" sx={configViewStyles.minLabel}>
                                            20°C
                                        </Typography>
                                        <Box sx={{ position: 'relative', width: '100%' }}>
                                        {/* Skeleton placeholder */}
                                        <Skeleton
                                            variant="rounded"
                                            height={14}
                                            width="100%"
                                            animation="wave"
                                            sx={{
                                            ...configViewStyles.slider,
                                            transform: 'none',
                                            my: 1,
                                            mt: 0.5,
                                            visibility: configurationLoading || updateConfigurationLoading ? 'visible' : 'hidden',
                                            }}
                                        />
                                        <Slider
                                            value={temperatureThreshold!}
                                            onChange={(_, value) => setTemperatureThreshold(value as number)}
                                            color="primary"
                                            min={20}
                                            max={40}
                                            step={0.1}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(value) => `${value}°C`}
                                            sx={{
                                                ...configViewStyles.slider,
                                                position: 'absolute',
                                                inset: 0,
                                                visibility: configurationLoading || updateConfigurationLoading ? 'hidden' : 'visible',
                                                transition: 'none',
                                                '& .MuiSlider-thumb': {
                                                        transition: 'none',
                                                },
                                                '& .MuiSlider-track': {
                                                        transition: 'none',
                                                },
                                            }}
                                        />
                                        </Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={configViewStyles.maxLabel}
                                        >
                                            40°C
                                        </Typography>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                                        Temperatures above this value trigger heat stress warnings.
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        p: 1,
                                        backgroundColor: 'var(--brand-surface)',
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography variant="subtitle2" gutterBottom>
                                        Impact Preview
                                    </Typography>
                                    <Box component="ul" sx={configViewStyles.impactList}>
                                        <Box component="li">
                                            <Typography variant="body2" color="text.secondary">
                                                Maternal distress indicators typically increase by 15-20%
                                            </Typography>
                                        </Box>
                                        <Box component="li">
                                            <Typography variant="body2" color="text.secondary">
                                                SMS guidance deployment recommended
                                            </Typography>
                                        </Box>
                                        <Box component="li">
                                            <Typography variant="body2" color="text.secondary">
                                                Clinic hours adjustment may be needed
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Precipitation Risk Threshold */}
                    <Card>
                        <CardContent sx={configViewStyles.cardContent}>
                            <Stack spacing={1}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Typography variant="h5">Precipitation Risk Threshold</Typography>
                                </Stack>

                                <Typography variant="body2" color="text.secondary">
                                    Monthly rainfall threshold for malaria risk prediction.
                                </Typography>

                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2">Threshold Precipitation (mm)</Typography>
                                        <Typography variant="body2" sx={configViewStyles.thresholdValue}>
                                            {(configurationLoading || updateConfigurationLoading) ? <CircularProgress size={12} /> : precipitationThreshold + ' mm'} 
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Typography variant="caption" color="text.secondary" sx={configViewStyles.precipMinLabel}>
                                            100 mm
                                        </Typography>
                                        <Box sx={{ position: 'relative', width: '100%' }}>
                                            {/* Skeleton placeholder */}
                                            <Skeleton
                                                variant="rounded"
                                                height={14}
                                                width="100%"
                                                animation="wave"
                                                sx={{
                                                ...configViewStyles.slider,
                                                transform: 'none',
                                                my: 1,
                                                visibility: isSliderLoading ? 'visible' : 'hidden',
                                                }}
                                            />
                                            <Slider
                                                value={precipitationThreshold!}
                                                onChange={(_, value) => setPrecipitationThreshold(value as number)}
                                                min={100}
                                                max={300}
                                                step={1}
                                                valueLabelDisplay="auto"
                                                valueLabelFormat={(value) => `${value} mm`}
                                                sx={{
                                                    ...configViewStyles.slider,
                                                    position: 'absolute',
                                                    inset: 0,
                                                    visibility: isSliderLoading ? 'hidden' : 'visible',
                                                    transition: 'none',
                                                    '& .MuiSlider-thumb': {
                                                        transition: 'none',
                                                    },
                                                    '& .MuiSlider-track': {
                                                        transition: 'none',
                                                    },
                                                }}
                                            />
                                            </Box>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={configViewStyles.precipMaxLabel}
                                        >
                                            300 mm
                                        </Typography>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                                        Monthly rainfall exceeding this value indicates increased malaria risk.
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        p: 1,
                                        backgroundColor: 'var(--brand-surface)',
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography variant="subtitle2" gutterBottom>
                                        Impact Preview
                                    </Typography>
                                    <Box component="ul" sx={configViewStyles.impactListNormal}>
                                        <Box component="li">
                                            <Typography variant="body2" color="text.secondary">
                                                Malaria incidence typically increases 2-3 weeks after heavy rainfall
                                            </Typography>
                                        </Box>
                                        <Box component="li">
                                            <Typography variant="body2" color="text.secondary">
                                                Antimalarial stock levels should be reviewed
                                            </Typography>
                                        </Box>
                                        <Box component="li">
                                            <Typography variant="body2" color="text.secondary">
                                                Vector control interventions recommended
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>

                {/* Save Settings Button */}
                <Box sx={configViewStyles.buttonContainer}>
                    <PrimaryButton
                        onClick={handleSaveSettings}
                        disabled={!isDataChanged}
                        loading={updateConfigurationLoading}
                        sx={configViewStyles.saveButton}
                    >
                        Save Settings
                    </PrimaryButton>
                </Box>
            </Box>

            <ProgressSnackbar
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={handleSnackbarClose}
            />
        </Box>
    );
}
