import { useEffect, useLayoutEffect } from 'react';

type UseAnimationStateSyncProps = {
    playing: boolean;
    showAll: boolean;
    setPlaying: (value: boolean) => void;
    setShowAll: (value: boolean) => void;
    setFrameIdx: (idx: number) => void;
    setIsPlaying: (value: boolean) => void;
};

export function useAnimationStateSync({
    playing,
    showAll,
    setPlaying,
    setShowAll,
    setFrameIdx,
    setIsPlaying,
}: UseAnimationStateSyncProps) {
    // Sync playing state from animation hook to local state
    useEffect(() => {
        setIsPlaying(playing);
    }, [playing, setIsPlaying]);

    // Reset frameIdx and stop playing when showAll is enabled
    // Use useLayoutEffect to ensure this runs synchronously before render
    useLayoutEffect(() => {
        if (showAll) {
            setFrameIdx(0);
            if (playing) {
                setPlaying(false);
            }
        }
    }, [showAll, playing, setFrameIdx, setPlaying]);

    // Ensure showAll is false when playing starts (bidirectional sync)
    useLayoutEffect(() => {
        if (playing && showAll) {
            setShowAll(false);
        }
    }, [playing, showAll, setShowAll]);
}

