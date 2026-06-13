import { Box, Button, CircularProgress } from '@mui/material';
import { Icon } from '@iconify/react';
import { playableControlsStyles } from '../../../styles/components/playable-controls.styles';

type PlayableControlsProps = {
    isPlaying: boolean;
    isLooping: boolean;
    showAll: boolean;
    isLoading: boolean;
    framesLength: number;
    onPlayToggle: () => void;
    onLoopToggle?: () => void;
    onShowAllToggle?: () => void;
};

export function PlayableControls({
    isPlaying,
    isLooping,
    showAll,
    isLoading,
    framesLength,
    onPlayToggle,
    onLoopToggle,
    onShowAllToggle,
}: PlayableControlsProps) {
    return (
        <Box sx={playableControlsStyles.container}>
            <Button
                size="small"
                variant={isPlaying ? 'contained' : 'outlined'}
                onClick={onPlayToggle}
                disabled={framesLength === 0 || isLoading}
                sx={playableControlsStyles.playButton}
                title={isLoading ? 'Loading...' : isPlaying ? 'Pause' : 'Play'}
            >
                {isLoading ? (
                    <CircularProgress size={20} />
                ) : (
                    <Icon
                        icon={isPlaying ? 'solar:pause-bold' : 'solar:play-bold'}
                        width={20}
                        height={20}
                    />
                )}
            </Button>
            {onLoopToggle && (
                <Button
                    size="small"
                    variant={isLooping ? 'contained' : 'outlined'}
                    onClick={onLoopToggle}
                    sx={playableControlsStyles.loopButton}
                    title={isLooping ? 'Disable Loop' : 'Enable Loop'}
                >
                    <Icon
                        icon={isLooping ? 'solar:repeat-bold' : 'solar:repeat-outline'}
                        width={20}
                        height={20}
                    />
                </Button>
            )}
            {onShowAllToggle && (
                <Button
                    size="small"
                    variant={showAll ? 'contained' : 'outlined'}
                    onClick={onShowAllToggle}
                    disabled={isPlaying}
                    sx={playableControlsStyles.showAllButton(showAll, isPlaying)}
                    title={showAll ? 'Showing all data' : 'Show all data'}
                >
                    All
                </Button>
            )}
        </Box>
    );
}

