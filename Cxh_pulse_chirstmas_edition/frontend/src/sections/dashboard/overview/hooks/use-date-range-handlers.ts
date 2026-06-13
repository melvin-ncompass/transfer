import { useCallback } from 'react';
import { flushSync } from 'react-dom';

type UseDateRangeHandlersProps = {
    isPlaying: boolean;
    setPlaying: (value: boolean) => void;
    setShowAll: (value: boolean) => void;
    setFrameIdx: (idx: number) => void;
    frameDates: Date[];
    setIsLooping: (value: boolean | ((prev: boolean) => boolean)) => void;
};

export function useDateRangeHandlers({
    isPlaying,
    setPlaying,
    setShowAll,
    setFrameIdx,
    frameDates,
    setIsLooping,
}: UseDateRangeHandlersProps) {
    const handlePlayToggle = useCallback(() => {
        if (!isPlaying) {
            flushSync(() => {
                setShowAll(false);
            });
            flushSync(() => {
                setPlaying(true);
            });
        } else {
            setPlaying(false);
        }
    }, [isPlaying, setPlaying, setShowAll]);

    const handleFrameChange = useCallback((frame: Date) => {
        const index = frameDates.findIndex(d => d.getTime() === frame.getTime());
        if (index !== -1) setFrameIdx(index);
    }, [frameDates, setFrameIdx]);

    const handleShowAllToggle = useCallback(() => {
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

