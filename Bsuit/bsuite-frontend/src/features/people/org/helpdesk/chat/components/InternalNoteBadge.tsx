import { Chip } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

export default function InternalNoteBadge() {
  return (
    <Chip
      size="small"
      icon={<LockOutlinedIcon sx={{ fontSize: 14 }} />}
      label="Internal"
      color="warning"
      variant="outlined"
      sx={{
        height: 22,
        fontSize: "0.7rem",
        fontWeight: 600,
        "& .MuiChip-icon": { ml: 0.5 },
      }}
    />
  );
}
