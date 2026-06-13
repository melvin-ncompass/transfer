import { Card, Typography, Box, IconButton } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ActivityTable from "./ActivityTable";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../components/atom/button";
import PreviewIcon from "@mui/icons-material/Preview";
import { Tooltip } from "../../../../components/atom/tooltip";
export default function ActivityCard() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    page: number;
    limit: number;
    _refresh?: number;
  }>({ page: 1, limit: 50 });
  const refreshKeyRef = useRef(0);

  const handleViewFull = () => {
    navigate("/company/settings/activity");
  };

  const handleRefresh = () => {
    // Update refresh key to trigger new API call with unique query parameter
    refreshKeyRef.current += 1;
    setFilters({ page: 1, limit: 50, _refresh: refreshKeyRef.current });
  };

  return (
    <Card sx={{ p: 2}}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
        mb={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="h6"
            sx={{padding:1}}
          >
            User Activity
          </Typography>
          <IconButton
            onClick={handleRefresh}
            title="Refresh data"
            size="small"
            color="primary"
          >
            <Refresh />
          </IconButton>
        </Box>

        <Tooltip title="View Full Activity">
          <PrimaryIconButton
            icon={<PreviewIcon fontSize="small" />}
            onClick={handleViewFull}
          />
        </Tooltip>
      </Box>
      <ActivityTable type={"card"} filters={filters} />
    </Card>
  );
}
