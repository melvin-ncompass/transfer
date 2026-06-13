import { Stack, Typography } from "@mui/material"
import { Iconify } from '../../../components/iconify';
import { PrimaryButton } from '../../../components/buttons';
import { landingViewStyles } from "../../../../src/styles/pages/landing.styles"

type ExploreSectionProps = {
    onExploreClick: (e: React.MouseEvent) => void;
    loading?: boolean;
};

export const ExploreSection = ({ onExploreClick, loading }: ExploreSectionProps) => (
    <Stack spacing={3} marginTop={3} marginBottom={3}>
        <Typography variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.7, mb: 2 }}>
            The first CxH Pulse prototype focuses on Kajiado County, Kenya, where heatwaves,
            droughts, and floods increasingly affect community health - particularly for
            pregnant and postpartum women.
        </Typography>

        <Typography variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.7, mb: 2 }}>
            This prototype brings together health data from the Kenya Health Information
            System (KHIS), climate data from Copernicus ERA5 and community-reported data
            from Jacaranda Health’s PROMPTS program.
        </Typography>

        <PrimaryButton
            variant="contained"
            size="large"
            onClick={onExploreClick}
            loading={loading}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={20} />}
            sx={landingViewStyles.heroButton}
            data-testid="button-explore-tool"
        >
            Explore the tool
        </PrimaryButton>
    </Stack>
);