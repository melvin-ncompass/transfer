import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import TextField from '@mui/material/TextField';
import { tableStyles } from '../../styles/components/table.styles';
import { InputAdornment } from '@mui/material';
import { Iconify } from '../iconify';

export function TableToolbarSkeleton() {
  return (
    <Box sx={tableStyles.container}>
      <Toolbar disableGutters sx={tableStyles.toolbar}>
        {/* Left section */}
        <Box sx={tableStyles.leftActionContainer}>
          {/* TextField skeleton */}
          <TextField
            disabled
            value=""
            placeholder="Search..."
            label="Search"
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Iconify width={18} icon="eva:search-fill" sx={tableStyles.searchIcon} />
                </InputAdornment>
              ),
            }}
            sx={tableStyles.searchField}
          />
        </Box>
      </Toolbar>
    </Box>
  );
}