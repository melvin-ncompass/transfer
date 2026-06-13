// material-ui
import type { Theme } from '@mui/material/styles';

//  OVERRIDES - TIMELINE CONTENT //

export default function TimelineContent(theme: Theme) {
  return {
    MuiTimelineContent: {
      styleOverrides: {
        root: {
          color: theme.palette.text,
          fontSize: '16px'
        }
      }
    }
  };
}
