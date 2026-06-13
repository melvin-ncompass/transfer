import { ChristmasLayer } from './christmas/ChristmasLayer';
import { useBranding } from '../../contexts/branding-context';

interface OccasionLayerProps {
    isActive?: boolean;
}

export function OccasionLayer({ isActive = true }: OccasionLayerProps) {
    const { branding } = useBranding();
    const occasion = branding.occasion || 'default';

    if (occasion === 'christmas') {
        return <ChristmasLayer isActive={isActive} />;
    }

    // Fallback or other occasions
    return null;
}
