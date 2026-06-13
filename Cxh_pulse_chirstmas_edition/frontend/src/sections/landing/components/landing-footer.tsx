import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { landingViewStyles } from '../../../styles/pages/landing.styles';

export function LandingFooter() {
    const theme = useTheme();

    return (
        <Box sx={landingViewStyles.footer(theme.palette.divider)}>
            <Typography variant="body2" color="text.secondary">
                A collaboration between DataKind, Spectrum Africa, and Jacaranda Health
            </Typography>
        </Box>
    );
}

