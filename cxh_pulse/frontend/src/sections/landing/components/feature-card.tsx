import { Card, CardContent, Stack, Typography } from '@mui/material';
import { Iconify, type IconifyName } from '../../../components/iconify';
import { landingViewStyles } from '../../../styles/pages/landing.styles';

type FeatureItem = {
    icon: IconifyName;
    label: string;
    description: string;
};

type FeatureCardProps = {
    icon: IconifyName;
    title: string;
    subtitle: string;
    items: FeatureItem[];
};

export function FeatureCard({ icon, title, subtitle, items }: FeatureCardProps) {
    return (
        <Card sx={landingViewStyles.card}>
            <CardContent>
                <Stack spacing={2}>
                    <Iconify icon={icon} width={40} height={40} sx={landingViewStyles.iconPrimary} />
                    <Typography variant="h5" fontWeight={600}>
                        {title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                    <Stack spacing={1.5} sx={landingViewStyles.featureItemsStack}>
                        {items.map((item, index) => (
                            <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                                <Iconify
                                    icon={item.icon}
                                    width={16}
                                    sx={landingViewStyles.dataSourceIcon(`chart.${index + 1}`)}
                                />
                                <Typography variant="body2" fontSize="0.875rem">
                                    <strong>{item.label}:</strong> {item.description}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

