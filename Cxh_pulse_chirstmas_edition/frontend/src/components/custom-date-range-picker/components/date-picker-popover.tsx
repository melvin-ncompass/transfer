import { Box, Button, FormControl, InputLabel, MenuItem, Popover, Select, Typography } from '@mui/material';
import { MONTHS } from '../utils/date-calculations';

type DatePickerPopoverProps = {
    open: boolean;
    anchorEl: HTMLButtonElement | null;
    onClose: () => void;
    title: string;
    month: number;
    year: number;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
    onApply: () => void;
    minYear: number;
    maxYear: number;
    effectiveMinMonth: number;
    effectiveMaxMonth: number;
    // Constraints for start date
    maxDate?: { year: number; month: number };
    // Constraints for end date
    minDate?: { year: number; month: number };
    isFullscreen?: boolean;
    anchorOrigin?: { vertical: 'bottom' | 'top'; horizontal: 'left' | 'right' };
};

export function DatePickerPopover({
    open,
    anchorEl,
    onClose,
    title,
    month,
    year,
    onMonthChange,
    onYearChange,
    onApply,
    minYear,
    maxYear,
    effectiveMinMonth,
    effectiveMaxMonth,
    maxDate,
    minDate,
    isFullscreen = false,
    anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
}: DatePickerPopoverProps) {
    const getMonthDisabled = (m: number) => {
        if (year === minYear && m < effectiveMinMonth) return true;
        if (year === maxYear && m > effectiveMaxMonth) return true;
        if (maxDate && year === maxDate.year && m > maxDate.month) return true;
        if (minDate && year === minDate.year && m < minDate.month) return true;
        return false;
    };

    const getYearDisabled = (y: number) => {
        if (y < minYear || y > maxYear) return true;
        if (maxDate && y > maxDate.year) return true;
        if (maxDate && y === maxDate.year && month > maxDate.month) return true;
        if (minDate && y < minDate.year) return true;
        if (minDate && y === minDate.year && month < minDate.month) return true;
        return false;
    };

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={anchorOrigin}
            disablePortal
            slotProps={{
                paper: {
                    style: {
                        zIndex: isFullscreen ? 10001 : 1300,
                    },
                },
                root: {
                    style: {
                        zIndex: isFullscreen ? 10001 : 1300,
                    },
                },
            }}
        >
            <Box p={2} width={200}>
                <Typography variant="subtitle2">{title}</Typography>
                <FormControl fullWidth size="small" margin="dense">
                    <InputLabel>Month</InputLabel>
                    <Select
                        value={month}
                        label="Month"
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        MenuProps={{
                            disablePortal: true,
                            slotProps: {
                                paper: {
                                    style: {
                                        zIndex: isFullscreen ? 10002 : 1301,
                                    },
                                },
                                root: {
                                    style: {
                                        zIndex: isFullscreen ? 10002 : 1301,
                                    },
                                },
                            },
                        }}
                    >
                        {MONTHS.map((m) => (
                            <MenuItem key={m.value} value={m.value} disabled={getMonthDisabled(m.value)}>
                                {m.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth size="small" margin="dense">
                    <InputLabel>Year</InputLabel>
                    <Select
                        value={year}
                        label="Year"
                        onChange={(e) => onYearChange(Number(e.target.value))}
                        MenuProps={{
                            disablePortal: true,
                            slotProps: {
                                paper: {
                                    style: {
                                        zIndex: isFullscreen ? 10002 : 1301,
                                    },
                                },
                                root: {
                                    style: {
                                        zIndex: isFullscreen ? 10002 : 1301,
                                    },
                                },
                            },
                        }}
                    >
                        {Array.from({ length: maxYear - minYear + 1 }).map((_, i) => {
                            const y = minYear + i;
                            return (
                                <MenuItem key={y} value={y} disabled={getYearDisabled(y)}>
                                    {y}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
                <Button onClick={onApply} variant="contained" size="small" fullWidth>
                    Apply
                </Button>
            </Box>
        </Popover>
    );
}

