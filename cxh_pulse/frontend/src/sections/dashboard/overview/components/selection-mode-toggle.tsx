import { Typography, ToggleButton, ToggleButtonGroup, Paper } from '@mui/material';
import { selectionModeToggleStyles } from '../../../../styles/components/selection-mode-toggle.styles';
import type { SelectionModeToggleProps } from '../../../../types/component.types';
import { SelectionMode } from '../overview-view';

export function SelectionModeToggle({ mode, onChange }: SelectionModeToggleProps) {
  return (
    <Paper sx={selectionModeToggleStyles.paper} data-export-ignore="true">
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={(_, newMode) => {
          if (
            newMode === SelectionMode.SUBCOUNTY ||
            newMode === SelectionMode.WARD
          ) {
            onChange(newMode);
          }
        }}
        size="small"
        aria-label="selection mode"
      >
        <ToggleButton value={SelectionMode.SUBCOUNTY} aria-label="subcounty mode">
          <Typography variant="caption" sx={selectionModeToggleStyles.toggleText}>
            Subcounty
          </Typography>
        </ToggleButton>

        <ToggleButton value={SelectionMode.WARD} aria-label="ward mode">
          <Typography variant="caption" sx={selectionModeToggleStyles.toggleText}>
            Ward
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}

