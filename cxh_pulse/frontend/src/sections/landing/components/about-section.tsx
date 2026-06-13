import { Box, Stack, Typography } from "@mui/material"
import { landingViewStyles } from "../../../../src/styles/pages/landing.styles";

export const AboutSection = () => (
    <Box sx={landingViewStyles.section}>
        <Stack spacing={6}>
            <Box>
                <Typography variant="h2" sx={landingViewStyles.sectionTitle}>
                    What is CxH Pulse?
                </Typography>

                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7, mb: 2 }}
                >
                    Climate x Health Pulse (CxH Pulse) is an integrated, web-based platform
                    that brings together localized climate data, health system data, and
                    disease surveillance to support timely, data-driven action.
                </Typography>

                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                >
                    Developed by DataKind, in partnership with Spectrum Africa and Jacaranda
                    Health, CxH Pulse is designed to make climate and health data useful,
                    usable, and actionable for local governments, NGOs, and health workers —
                    especially in climate-vulnerable settings.
                </Typography>
            </Box>

            <Box>
                <Typography variant="h2" sx={landingViewStyles.sectionTitle}>
                    Built with and for Local Systems
                </Typography>

                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7 }}
                >
                    Climate-health resilience grows when tools reflect real-world workflows,
                    strengthen local ownership, and evolve through collaboration. CxH Pulse
                    is co-designed with local partners, and built to support capacity building
                    and long-term sustainability. When released, CxH Pulse will be open
                    source, aligned with digital public good standards.
                </Typography>
            </Box>
            
        </Stack>
    </Box>
);