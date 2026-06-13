import { useCallback } from 'react';
import { flushSync } from 'react-dom';

type UseDateRangeHandlersProps = {
    isPlaying: boolean;
    setPlaying: (value: boolean) => void;
    setShowAll: (value: boolean) => void;
    setFrameIdx: (idx: number) => void;
    frameDates: Date[];
    setIsLooping: (value: boolean | ((prev: boolean) => boolean)) => void;
    setHasPlayed: (value: boolean) => void;
    resetHover: () => void;
    showAll: boolean;
    setIsPlaying: (value: boolean) => void;
};

export function useDateRangeHandlers({
    showAll,
    isPlaying,
    setPlaying,
    setShowAll,
    setFrameIdx,
    frameDates,
    setIsLooping,
    setHasPlayed,
    resetHover,
    setIsPlaying,
}: UseDateRangeHandlersProps) {
    const handlePlayToggle = useCallback(() => {
        if (!isPlaying) {
            setHasPlayed(true);

            if (showAll) {
            setShowAll(false);
            setFrameIdx(0);
            }
            setPlaying(true);
            setIsPlaying(true);
            resetHover();
            return;
        }
        setPlaying(false);
        setIsPlaying(false);
        }, [
        isPlaying,
        showAll,
        setShowAll,
        setFrameIdx,
        setPlaying,
        setIsPlaying,
        setHasPlayed,
        resetHover,
        ]);


    const handleFrameChange = useCallback((frame: Date) => {
        const index = frameDates.findIndex(d => d.getTime() === frame.getTime());
        if (index !== -1) setFrameIdx(index);
    }, [frameDates, setFrameIdx]);

    const handleShowAllToggle = useCallback(() => {
        resetHover();
        setHasPlayed(false);
        flushSync(() => {
            setPlaying(false);
        });
        flushSync(() => {
            setFrameIdx(0);
        });
        flushSync(() => {
            setShowAll(true);
        });
    }, [setFrameIdx, setPlaying, setShowAll]);

    const handleLoopToggle = useCallback(() => {
        setIsLooping((prev: boolean) => !prev);
    }, [setIsLooping]);

    return {
        handlePlayToggle,
        handleFrameChange,
        handleShowAllToggle,
        handleLoopToggle,
    };
}

