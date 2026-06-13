import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Label } from '../../../src/components/label';
import { Iconify } from '../../../src/components/iconify';
import { User } from '../../../src/store/slices/authSlice';
import { fDateTime } from '../../../src/utils/format-time';
import { useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type SessionProps = {
  id: string;
  userAgent: string;
  user: User;
  method: string;
  endpoint: string;
  createdAt: string;
};

type SessionTableRowProps = {
  row: SessionProps;
  selected: boolean;
  onSelectRow: () => void;
};

export function SessionTableRow({ row, selected, onSelectRow }: SessionTableRowProps) {
  const theme = useTheme();
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleRowClick = (event: React.MouseEvent) => {
    // Don't trigger row selection if clicking on the checkbox or menu button
    if (
      !(event.target instanceof HTMLInputElement) &&
      !(event.target instanceof SVGElement) &&
      !(event.currentTarget.contains(event.target as Node) && (event.target as HTMLElement).closest('button'))
    ) {
      onSelectRow();
    }
  };

  return (
    <>
      <TableRow hover
        role="checkbox"
        aria-checked={selected}
        selected={selected}
        tabIndex={-1}
        onClick={handleRowClick}
        sx={{
          '&:hover': {
            backgroundColor: 'action.hover',
            cursor: 'pointer',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '-2px',
          },
        }}>
        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
          <Checkbox disableRipple
            aria-label={`Select ${row.user.userInfo.name}`}
            checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell component="th" scope="row">
          <Box
            sx={{
              gap: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {row.user.userInfo.name}
          </Box>
        </TableCell>


        <TableCell align="center">
          {row.userAgent}
        </TableCell>

        <TableCell>{row.method}</TableCell>

        <TableCell>{row.endpoint}</TableCell>

        <TableCell align="center">
          {fDateTime(row.createdAt)}
        </TableCell>

        {/* <TableCell align="right"> */}
        {/* <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton> */}
        {/* </TableCell> */}
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          <MenuItem onClick={handleClosePopover}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          <MenuItem onClick={handleClosePopover} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
