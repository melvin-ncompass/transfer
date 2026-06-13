import { Box, useTheme } from '@mui/material';
import { sliderTrackStyles } from '../../../styles/components/slider-track.styles';

type SliderTrackProps = {
    trackRef: React.RefObject<HTMLDivElement | null>;
    startPercent: number;
    endPercent: number;
    startIndex: number;
    endIndex: number;
    playable: boolean;
    isPlaying: boolean;
    currentFrame: Date | null;
    currentFramePercent: number | null;
    isFrameInRange: boolean;
    dragTarget: 'start' | 'end' | 'middle' | 'thumb' | null;
    onMouseDown: (target: 'start' | 'end' | 'middle' | 'thumb', e: React.MouseEvent | React.TouchEvent) => void;
    onFrameChange?: (frame: Date) => void;
    frames: Date[];
    onPlayToggle?: () => void;
    getMonthIndex: (date: Date) => number;
    totalMonths: number;
    setIsDragging: (value: boolean) => void;
    setDragTarget: (target: 'start' | 'end' | 'middle' | 'thumb' | null) => void;
};

export function SliderTrack({
    trackRef,
    startPercent,
    endPercent,
    startIndex,
    endIndex,
    playable,
    isPlaying,
    currentFrame,
    currentFramePercent,
    isFrameInRange,
    dragTarget,
    onMouseDown,
    onFrameChange,
    frames,
    onPlayToggle,
    getMonthIndex,
    totalMonths,
    setIsDragging,
    setDragTarget,
}: SliderTrackProps) {
    const theme = useTheme();

    return (
        <Box
            flex={1}
            px={2}
            position="relative"
            height={6}
            ref={trackRef}
            sx={sliderTrackStyles.track(playable, isPlaying)}
            tabIndex={0}
        >
            <Box
                position="absolute"
                top={-27}
                sx={{
                    ...sliderTrackStyles.dateLabel(theme),
                    left: `${(startPercent + endPercent) / 2}%`,
                    transform: 'translateX(-50%)',
                }}
            >
                {(() => {
                    const monthsCount = endIndex - startIndex + 1;
                    return `${monthsCount} month${monthsCount > 1 ? 's' : ''}`;
                })()}
            </Box>

            <Box
                position="absolute"
                height="100%"
                top={0}
                bottom={0}
                sx={sliderTrackStyles.selectedRange(playable, isPlaying, dragTarget)}
                style={{
                    left: `${startPercent}%`,
                    width: `${endPercent - startPercent}%`,
                }}
                onMouseMove={(e) => {
                    if (playable && isPlaying) return;
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickPercent = (clickX / rect.width) * 100;
                    if (clickPercent < 10) e.currentTarget.style.cursor = 'ew-resize';
                    else if (clickPercent > 90) e.currentTarget.style.cursor = 'ew-resize';
                    else e.currentTarget.style.cursor = 'grab';
                }}
                onClick={(e) => {
                    if (playable && isPlaying && onPlayToggle) {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const clickPercent = (clickX / rect.width) * 100;
                        if (clickPercent >= 10 && clickPercent <= 90) {
                            onPlayToggle();
                        }
                    }
                }}
                onMouseDown={(e) => {
                    if (playable && isPlaying) {
                        e.preventDefault();
                        return;
                    }
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const clickPercent = (clickX / rect.width) * 100;

                    if (playable && currentFramePercent !== null) {
                        if (currentFramePercent < 5 && clickPercent < 15) {
                            onMouseDown('start', e as any);
                            return;
                        }
                        if (currentFramePercent > 95 && clickPercent > 85) {
                            onMouseDown('end', e as any);
                            return;
                        }
                    }

                    if (clickPercent < 10) onMouseDown('start', e as any);
                    else if (clickPercent > 90) onMouseDown('end', e as any);
                    else onMouseDown('middle', e as any);
                }}
                onTouchStart={(e) => {
                    if (playable && isPlaying) {
                        e.preventDefault();
                        return;
                    }
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    const touch = e.touches[0];
                    const clickX = touch.clientX - rect.left;
                    const clickPercent = (clickX / rect.width) * 100;

                    if (playable && currentFramePercent !== null) {
                        if (currentFramePercent < 5 && clickPercent < 15) {
                            onMouseDown('start', e as any);
                            return;
                        }
                        if (currentFramePercent > 95 && clickPercent > 85) {
                            onMouseDown('end', e as any);
                            return;
                        }
                    }

                    if (clickPercent < 10) onMouseDown('start', e as any);
                    else if (clickPercent > 90) onMouseDown('end', e as any);
                    else onMouseDown('middle', e as any);
                }}
            />

            {playable && currentFrame && isFrameInRange && currentFramePercent !== null && (
                <Box
                    position="absolute"
                    top="50%"
                    sx={{
                        ...sliderTrackStyles.frameThumb(isPlaying),
                        transform: 'translate(-50%, -50%)',
                    }}
                    style={{
                        left: `${currentFramePercent}%`,
                    }}
                    onMouseDown={(e: React.MouseEvent) => {
                        const rect = trackRef.current?.getBoundingClientRect();
                        if (rect) {
                            const trackX = e.clientX - rect.left;
                            const trackPercent = (trackX / rect.width) * 100;

                            if (currentFramePercent !== null && currentFramePercent < 5 && trackPercent < 3) {
                                return;
                            }
                            if (currentFramePercent !== null && currentFramePercent > 95 && trackPercent > 97) {
                                return;
                            }
                        }

                        e.preventDefault();
                        e.stopPropagation();
                        if (onFrameChange && frames.length > 0) {
                            setIsDragging(true);
                            setDragTarget('thumb');
                        }
                    }}
                    onTouchStart={(e: React.TouchEvent) => {
                        const rect = trackRef.current?.getBoundingClientRect();
                        if (rect) {
                            const touch = e.touches[0];
                            const trackX = touch.clientX - rect.left;
                            const trackPercent = (trackX / rect.width) * 100;

                            if (currentFramePercent !== null && currentFramePercent < 5 && trackPercent < 3) {
                                return;
                            }
                            if (currentFramePercent !== null && currentFramePercent > 95 && trackPercent > 97) {
                                return;
                            }
                        }

                        e.preventDefault();
                        e.stopPropagation();
                        if (onFrameChange && frames.length > 0) {
                            setIsDragging(true);
                            setDragTarget('thumb');
                        }
                    }}
                />
            )}

            {!(playable && isPlaying) && (
                <>
                    <Box
                        position="absolute"
                        width={playable ? 20 : 10}
                        height={playable ? 20 : 10}
                        top="50%"
                        sx={{
                            ...sliderTrackStyles.handle(playable),
                            transform: 'translate(-50%, -50%)',
                        }}
                        style={{ left: `${startPercent}%` }}
                        onMouseDown={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onMouseDown('start', e);
                        }}
                        onTouchStart={(e: React.TouchEvent) => {
                            e.stopPropagation();
                            onMouseDown('start', e as any);
                        }}
                    />
                    <Box
                        position="absolute"
                        width={playable ? 20 : 10}
                        height={playable ? 20 : 10}
                        top="50%"
                        sx={{
                            ...sliderTrackStyles.handle(playable),
                            transform: 'translate(-50%, -50%)',
                        }}
                        style={{ left: `${endPercent}%` }}
                        onMouseDown={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onMouseDown('end', e);
                        }}
                        onTouchStart={(e: React.TouchEvent) => {
                            e.stopPropagation();
                            onMouseDown('end', e as any);
                        }}
                    />
                </>
            )}
        </Box>
    );
}

