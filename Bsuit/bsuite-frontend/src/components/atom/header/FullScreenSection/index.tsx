import { useCallback, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Avatar, Tooltip, Box } from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';

// ==============================|| HEADER CONTENT - FULLSCREEN ||============================== //

export default function FullScreen() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleToggle = useCallback(() => {
    if (document && !document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setOpen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Box sx={{ ml: 2 }}>
      <Tooltip title={open ? 'Exit Fullscreen' : 'Fullscreen'}>
        <Avatar
          variant="rounded"
          sx={{
            width: 40,
            height: 40,
            transition: 'all .2s ease-in-out',
            color: theme.palette.primary.main,
            background: theme.palette.primary.light,
            cursor: 'pointer',
            '&:hover': {
              color: theme.palette.primary.light,
              background: theme.palette.primary.main
            }
          }}
          onClick={handleToggle}
        >
          {open ? <FullscreenExit /> : <Fullscreen />}
        </Avatar>
      </Tooltip>
    </Box>
  );
}
