import { useEffect, useRef } from 'react';

type UseAnimationLoopProps = {
    playing: boolean;
    speed: number;
    framesLength: number;
    isLooping: boolean;
    setFrameIdx: (updater: (i: number) => number) => void;
    setPlaying: (value: boolean) => void;
};

export function useAnimationLoop({
    playing,
    speed,
    framesLength,
    isLooping,
    setFrameIdx,
    setPlaying,
}: UseAnimationLoopProps) {
    const rafRef = useRef<number>(0);
    const lastTs = useRef<number>(0);
    const playingRef = useRef<boolean>(false);
    const framesRef = useRef<number>(framesLength);
    const speedRef = useRef<number>(speed);
    const isLoopingRef = useRef<boolean>(isLooping);

    useEffect(() => {
        playingRef.current = playing;
    }, [playing]);
    useEffect(() => {
        framesRef.current = framesLength;
    }, [framesLength]);
    useEffect(() => {
        speedRef.current = speed;
    }, [speed]);
    useEffect(() => {
        isLoopingRef.current = isLooping;
    }, [isLooping]);

    useEffect(() => {
        if (!playing || framesLength === 0) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = 0;
            }
            lastTs.current = 0;
            return undefined;
        }

        const loop = (ts: number) => {
            if (!playingRef.current || framesRef.current === 0) {
                rafRef.current = 0;
                return;
            }

            if (!lastTs.current) lastTs.current = ts;
            const delta = (ts - lastTs.current) / 1000;
            const minInterval = 0.1;
            const frameInterval = Math.max(1 / speedRef.current, minInterval);

            if (delta >= frameInterval) {
                setFrameIdx((i) => {
                    const nextIdx = i + 1;
                    const maxFrames = Math.max(framesRef.current, 1);
                    if (isLoopingRef.current) {
                        return nextIdx % maxFrames;
                    } else {
                        if (nextIdx >= maxFrames) {
                            playingRef.current = false;
                            setPlaying(false);
                            return i;
                        }
                        return nextIdx;
                    }
                });
                lastTs.current = ts;
            }
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = 0;
            }
            lastTs.current = 0;
        };
    }, [playing, speed, framesLength, isLooping, setFrameIdx, setPlaying]);
}

