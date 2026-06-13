export interface DateRange {
    from: Date;
    to: Date;
}

export interface DateRangeSliderProps {
    minYear?: number;
    maxYear?: number;
    minMonth?: number;
    maxMonth?: number;
    initialFrom: Date;
    initialTo: Date;
    onChange?: (range: DateRange) => void;
    playable?: boolean;
    isPlaying?: boolean;
    currentFrame?: Date | null;
    onPlayToggle?: () => void;
    onFrameChange?: (frame: Date) => void;
    frames?: Date[];
    isFullscreen?: boolean;
    isLooping?: boolean;
    onLoopToggle?: () => void;
    showAll?: boolean;
    onShowAllToggle?: () => void;
    isLoading?: boolean;
    start?: { month: number; year: number };
    end?: { month: number; year: number };
}

