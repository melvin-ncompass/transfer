import { Box, Typography, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { landingViewStyles } from '../../../styles/pages/landing.styles';


export function LandingFooter() {
    const theme = useTheme();

    return (
        <Box sx={landingViewStyles.footer(theme.palette.divider)}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 3, sm: 3, md: 4 }}
                justifyContent="center"
                alignItems="center"
                sx={{ mb: 2, flexWrap: 'wrap', gap: { xs: 3, sm: 3, md: 4 } }}
            >
                {/* DataKind Logo */}
                <Box
                    component="img"
                    src="https://www.datakind.org/wp-content/uploads/2023/04/DK_LOGO_R_ORG.svg"
                    alt="DataKind"
                    sx={{
                        height: { xs: 35, sm: 40, md: 50 },
                        width: 'auto',
                        maxWidth: { xs: '200px', sm: 'none' },
                        objectFit: 'contain',
                    }}
                />
                {/* Spectrum Africa Logo */}
                <Box
                    component="img"
                    src="https://www.spectrumafrica.org/img/demos/finance/logo1.jpg"
                    alt="Spectrum Africa"
                    sx={{
                        height: { xs: 35, sm: 40, md: 50 },
                        width: 'auto',
                        maxWidth: { xs: '200px', sm: 'none' },
                        objectFit: 'contain',
                    }}
                />
                {/* Jacaranda Health Logo */}
                <Box
                    component="img"
                    src="https://jacarandahealth.org/ypoagriw/2023/09/JH-LOGO-WHITE-1.svg"
                    alt="Jacaranda Health"
                    sx={{
                        height: { xs: 35, sm: 40, md: 50 },
                        width: 'auto',
                        maxWidth: { xs: '200px', sm: 'none' },
                        objectFit: 'contain',
                        // Invert in light mode (white logo on light background needs to be dark)
                        // Keep white in dark mode (white logo on dark background is visible)
                        filter: theme.palette.mode === 'light' ? 'invert(1)' : 'none',
                    }}
                />
            </Stack>
            <Typography variant="body2" color="text.secondary">
                A collaboration between DataKind, Spectrum Africa, and Jacaranda Health
            </Typography>
        </Box>
    );
}

