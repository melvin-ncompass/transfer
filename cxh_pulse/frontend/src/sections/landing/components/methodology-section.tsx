import { Box, Card, CardContent, Typography } from '@mui/material';
import { landingViewStyles } from '../../../styles/pages/landing.styles';

const methodologyItems = [
    {
        label: 'Temporal Resolution',
        description:
            'Analysis uses monthly aggregation to align KHIS2 (monthly), PROMPTS (daily aggregated), and ERA5 (user-defined) data sources',
    },
    {
        label: 'Geographic Scope',
        description:
            'Ward-level analysis for Kajiado County with sub-county and county-level aggregations',
    },
    {
        label: 'Climate Variables',
        description:
            'Maximum temperature (Tmax), total precipitation, and dewpoint temperature from ERA5 reanalysis (Jan 2022 - Oct 2025)',
    },
    {
        label: 'Forecast Horizon',
        description:
            '12-month predictions based on historical climate-health correlations; not fully validated predictive models',
    },
    {
        label: 'Danger Zones',
        description:
            'Thresholds defined collaboratively with County MoH and adjusted based on local context',
    },
    {
        label: 'Data Completeness',
        description:
            'Visualizations indicate data gaps; missing values do not invalidate overall trends',
    },
    {
        label: 'Proof of Concept',
        description:
            'This v0 platform demonstrates multi-sectoral data integration potential to stakeholders and funders',
    },
];

export function MethodologySection() {
    return (
        <Box sx={landingViewStyles.section}>
            <Typography variant="h2" sx={landingViewStyles.sectionTitle}>
                Key Assumptions & Methodology
            </Typography>
            <Card sx={landingViewStyles.methodologyCard}>
                <CardContent sx={landingViewStyles.methodologyContent}>
                    <Box component="ol" sx={landingViewStyles.orderedList}>
                        {methodologyItems.map((item, index) => (
                            <Typography key={index} component="li" variant="body2" fontSize="0.875rem">
                                <strong>{item.label}:</strong> {item.description}
                            </Typography>
                        ))}
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

