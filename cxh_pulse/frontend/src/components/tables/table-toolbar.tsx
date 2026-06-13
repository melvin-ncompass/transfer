import Toolbar from '@mui/material/Toolbar';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import { Iconify } from '../iconify';
import { useMediaQuery } from '@mui/material';
import { tableStyles } from '../../styles/components/table.styles';
import type { TableToolbarProps } from '../../types/component.types';

// ----------------------------------------------------------------------

export function TableToolbar({
  filterName,
  onFilterName,
  rightAction,
  leftAction,
  middleAction,
  placeholder = 'Search user...',
  hideSearch = false,
}: TableToolbarProps) {
  const isSmallScreen = useMediaQuery('(max-width: 830px)');

  return (
    <Box sx={tableStyles.container}>
      <Toolbar disableGutters sx={tableStyles.toolbar}>
        <Box sx={tableStyles.leftActionContainer}>
          {leftAction}
          {!hideSearch && (
            <TextField
              value={filterName}
              onChange={onFilterName}
              placeholder={placeholder}
              label="Search"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Iconify width={18} icon="eva:search-fill" sx={tableStyles.searchIcon} />
                  </InputAdornment>
                ),
              }}
              slotProps={{
                  htmlInput: {
                  maxLength: 50,
                },
              }}
              sx={tableStyles.searchField}
            />
          )}
        </Box>
        {!isSmallScreen ? (
          <>
            {middleAction && (
              <Box sx={tableStyles.middleActionContainer}>
                {middleAction}
              </Box>
            )}
            <Box sx={tableStyles.rightActionContainer}>
              {rightAction}
            </Box>
          </>
        ) : (
          <>
            <Box sx={tableStyles.rightActionContainer}>
              {rightAction}
            </Box>
            {middleAction && (
              <Box sx={tableStyles.middleActionContainerSmall}>
                {middleAction}
              </Box>
            )}
          </>
        )}
      </Toolbar>
    </Box>
  );
}
