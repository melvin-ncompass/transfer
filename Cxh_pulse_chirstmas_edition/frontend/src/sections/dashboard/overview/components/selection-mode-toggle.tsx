import { Typography, ToggleButton, ToggleButtonGroup, Paper } from '@mui/material';
import { selectionModeToggleStyles } from '../../../../styles/components/selection-mode-toggle.styles';
import type { SelectionModeToggleProps } from '../../../../types/component.types';

/**
 * Selection Mode Toggle Component
 * Allows switching between subcounty and ward selection modes
 */
export function SelectionModeToggle({ mode, onChange }: SelectionModeToggleProps) {
    return (
        <Paper sx={selectionModeToggleStyles.paper}>
            <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_, newMode) => {
                    if (newMode !== null) {
                        onChange(newMode);
                    }
                }}
                size="small"
                aria-label="selection mode"
            >
                <ToggleButton value="subcounty" aria-label="subcounty mode">
                    <Typography variant="caption" sx={selectionModeToggleStyles.toggleText}>
                        Subcounty
                    </Typography>
                </ToggleButton>
                <ToggleButton value="ward" aria-label="ward mode">
                    <Typography variant="caption" sx={selectionModeToggleStyles.toggleText}>
                        Ward
                    </Typography>
                </ToggleButton>
            </ToggleButtonGroup>
        </Paper>
    );
}

