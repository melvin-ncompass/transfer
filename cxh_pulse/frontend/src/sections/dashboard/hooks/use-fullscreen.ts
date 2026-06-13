import { useState, useEffect, useRef } from 'react';

export function useFullscreen() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleFullscreen = () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            // Enter fullscreen
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            } else if ((containerRef.current as any).webkitRequestFullscreen) {
                (containerRef.current as any).webkitRequestFullscreen();
            } else if ((containerRef.current as any).msRequestFullscreen) {
                (containerRef.current as any).msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            } else if ((document as any).msExitFullscreen) {
                (document as any).msExitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(
                !!(
                    document.fullscreenElement ||
                    (document as any).webkitFullscreenElement ||
                    (document as any).msFullscreenElement
                )
            );
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, []);

    return {
        containerRef,
        isFullscreen,
        handleFullscreen,
    };
}

