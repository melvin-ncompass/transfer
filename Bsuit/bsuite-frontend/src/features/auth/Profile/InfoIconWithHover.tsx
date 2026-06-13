import { useState } from "react";
import { Info } from "@mui/icons-material";
import {
  IconButton,
  Typography,
  Popper,
  Paper,
  Stack,
} from "@mui/material";

const InfoIconWithHover = ({ ip, os, browser }: any) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleEnter = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLeave = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      {/* Inline IP + Info Icon */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2">
          <b>IP:</b> {ip || "-"}
        </Typography>

        <IconButton
          size="small"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          sx={{ p: 0.5 }}
        >
          <Info fontSize="small" color="primary" />
        </IconButton>
      </Stack>

      {/* Hover Popper (Only OS + Browser) */}
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="top"
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
        ]}
        style={{ zIndex: 1500 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 2,
            minWidth: 200,
            borderRadius: 2,
          }}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <Typography variant="body2">
            <b>OS:</b> {os || "-"}
          </Typography>
          <Typography variant="body2">
            <b>Browser:</b> {browser || "-"}
          </Typography>
        </Paper>
      </Popper>
    </>
  );
};

export default InfoIconWithHover;
