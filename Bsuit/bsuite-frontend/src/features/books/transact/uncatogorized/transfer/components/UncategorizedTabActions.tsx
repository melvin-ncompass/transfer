import { useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";

import { Badge, Box, Popover, useMediaQuery } from "@mui/material";
import { Replay, FilterList, MoreVert } from "@mui/icons-material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useTheme } from "@mui/material/styles";

import { PrimaryIconButton } from "../../../../../../components/atom/button";

type Props = {
  filterAccountIds: string[];
  setFilterAccountIds: Dispatch<SetStateAction<string[]>>;
  setIsFilterOpen: Dispatch<SetStateAction<boolean>>;
};

export const UncategorizedTabActions = ({
  filterAccountIds,
  setFilterAccountIds,
  setIsFilterOpen,
}: Props) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isTab = useMediaQuery("(max-width:960px)");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleImport = () => {
    navigate("/books/transact/bank-statements-import");
    handleClose();
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const ActionButtons = (
    <Box display="flex" p={1} gap={1} flexDirection={isTab ? "column" : "row"}>
      {filterAccountIds.length > 0 && (
        <PrimaryIconButton
          title="Reset"
          onClick={() => {
            setFilterAccountIds([]);
            handleClose();
          }}
          sx={{
            width: { xs: 40, md: 35 },
            height: { xs: 40, md: 35 },
            backgroundColor: theme.palette.primary.main,
            color: "white",
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          }}
          icon={<Replay />}
        />
      )}

      <Badge
        badgeContent={filterAccountIds.length}
        color={filterAccountIds.length > 0 ? "primary" : "default"}
      >
        <PrimaryIconButton
          title="Filter Accounts"
          onClick={() => {
            setIsFilterOpen(true);
            handleClose();
          }}
          sx={{
            width: { xs: 40, md: 35 },
            height: { xs: 40, md: 35 },
            backgroundColor: theme.palette.primary.main,
            color: "white",
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          }}
          icon={<FilterList sx={{ width: 20 }} />}
        />
      </Badge>

      <PrimaryIconButton
        title="Import Bank Account Statements"
        onClick={handleImport}
        sx={{
          width: { xs: 40, md: 35 },
          height: { xs: 40, md: 35 },
          backgroundColor: theme.palette.primary.main,
          color: "white",
          "&:hover": { backgroundColor: theme.palette.primary.dark },
        }}
        icon={<FileDownloadIcon sx={{ width: 20 }} />}
      />
    </Box>
  );

  if (!isTab) {
    return ActionButtons;
  }

  return (
    <>
      <PrimaryIconButton
        onClick={handleOpen}
        sx={{
          width: { xs: 40, md: 35 },
          height: { xs: 40, md: 35 },
          backgroundColor: theme.palette.primary.main,
          color: "white",
          "&:hover": { backgroundColor: theme.palette.primary.dark },
        }}
        icon={<MoreVert sx={{ width: {xs: 24, lg: 18} }} />}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Box p={2}>{ActionButtons}</Box>
      </Popover>
    </>
  );
};