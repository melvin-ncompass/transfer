import {
  Box,
  Card,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { PrimaryButton } from "../../../../components/atom/button";
import {
  Delete,
  Check,
  ContentCopy,
} from "@mui/icons-material";
import { DataTable } from "../../../../components/tables/data-table";
import {  setModalState, setSessions } from "../profileSlice";
import type {
  GridColDef,
} from "@mui/x-data-grid";
import { useAppSelector, useAppDispatch } from "../../../../store/store";


import {
  useDeleteSessionMutation,
} from "../../api/profile.api";
import { useState } from "react";

function ManageSessions() {
  const pfp = useAppSelector((state:any) => state.profile);
  const dispatch = useAppDispatch();
  const [deleteSessionApi] = useDeleteSessionMutation();
  const theme = useTheme();
  function convertDateString(input: string): string {
    const date = new Date(input);

    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }
  const columns: GridColDef[] = [
    // 1. Session ID (UUID)
    {
      field: "sessionId",
      headerName: "Session ID",
      hideable:false,
      flex: 2,
      minWidth:220,
      renderCell: (params) => {
        const sessionId = params.value;
        const [copied, setCopied] = useState(false);

        const handleCopy = () => {
          navigator.clipboard.writeText(sessionId);
          setCopied(true);

          // Reset back to copy icon after 1.5 seconds
          setTimeout(() => setCopied(false), 1500);
        };

        return (
          <Stack direction="row" alignItems="center" spacing={1} height="100%">
            {/* Copy Button */}
            <Tooltip title={copied ? "Copied" : "Copy Session ID"}>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{ padding: "2px" }}
              >
                {copied ? (
                  <Check fontSize="small" color="success" />
                ) : (
                  <ContentCopy fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            {/* Session ID Text with Tooltip */}
            <Tooltip title={sessionId}>
              <Typography noWrap sx={{ maxWidth: 1, cursor: "pointer" }} >
                {sessionId}
              </Typography>
            </Tooltip>

            {/* Current Session Chip */}
            {pfp.sessionId === sessionId && (
              <Chip label="Current" color="success" size="small" />
            )}
          </Stack>
        );
      },
    },
    // 2. Created At (Timestamp)
    {
      field: "createdAt",
      headerName: "Created At",
      minWidth:220,
      flex: 1,
      // Note: You would typically use a valueFormatter or renderCell for date formatting
      // For simplicity, I'm showing the raw field, but you could re-use your convertDateString function:
      renderCell: (params) => (
        <Stack justifyContent="center" height="100%" alignItems={"start"}>
          <Typography>{convertDateString(params.value)}</Typography>
        </Stack>
      ),
    },
    // 3. Expires At (Timestamp)
    {
      field: "expiresAt",
      headerName: "Expires At",
      flex: 1,
      minWidth:220,

      renderCell: (params) => (
        <Stack justifyContent="center" height="100%" alignItems={"start"}>
          <Typography>{convertDateString(params.value)}</Typography>
        </Stack>
      ),
      // Same note as above for date formatting
    },
    // 4. Browser Name (Direct Field)

    // 5. Client IP (Nested Field: clientInfo.ip)
    {
      field: "clientInfo",
      headerName: "Client Info",
      flex: 1,
      sortable: false,
      minWidth:200,
      hideable:false,
      renderCell: (params) => {
  const clientInfo = params.row.clientInfo;

  if (!clientInfo) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  const { ip, os, browser } = clientInfo;

  return (
    <Stack spacing={0.3} height="100%" justifyContent="center">
      <Typography variant="body2">
        <b>IP:</b> {ip || "—"}
      </Typography>
      <Typography variant="body2">
        <b>OS:</b> {os || "—"}
      </Typography>
      <Typography variant="body2">
        <b>Browser:</b> {browser || "—"}
      </Typography>
    </Stack>
  );
},

    },
    // 6. Client OS (Nested Field: clientInfo.os)

    {
      field: "delete",
      headerName: "Delete",
      headerAlign: "center",
      disableColumnMenu: true,
      // flex: 1,
      align: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isCurrent = pfp.sessionId === params.row.sessionId;
        return (
          <Stack justifyContent="center" height="100%">
            <Tooltip
              title={isCurrent ? "Cannot delete current session" : ""}
              disableHoverListener={!isCurrent}
            >
              <span>
                <IconButton
                  aria-label="delete"
                  disabled={isCurrent}
                  sx={{
                    "&.Mui-disabled": { color: "grey" },
                    py: "4px",
                    color: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                  }}
                  onClick={async () => {
                    dispatch(
                      setSessions(
                        pfp.sessions.filter(
                          (row:any) => row.sessionId !== params.row.sessionId
                        )
                      )
                    );
                    const res = await deleteSessionApi({
                      sessionId: params.row.sessionId,
                    });
                    dispatch(
                      setModalState({ modal: "sessionDeleted", value: true })
                    );
                  }}
                >
                  <Delete />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <Card
      sx={{
        boxShadow: "0px 0px 4px grey",
      }}
    >
      {/* <Collapse id="sessions-table-panel" in={pfp.sessionsTable}> */}
      {/* rest unchanged */}

      <Box
        display={"flex"}
        justifyContent={"space-between"}
        px={"10px"}
        mt={"10px"}
        alignItems={"center"}
      >
        <Typography variant="h6">Manage Sessions ({pfp.sessions.length})</Typography>
        <PrimaryButton
          color="error"
          onClick={() =>
            dispatch(setModalState({ modal: "logoutAllModal", value: true }))
          }
          // sx={{ marginTop: "10px" }}
        >
          Sign out of all other sessions
        </PrimaryButton>
      </Box>
      <Box width={"100%"} overflow={"scroll"}>
        {pfp.sessions && <DataTable
          columns={columns}
          rows={pfp.sessions}
          getRowId={(row) => row.sessionId}
          // headerBgColor={theme.palette.grey[300]} // makes header blue
          // bodyBgColor="#ffffff" // white background for table body
          // tableHeight={100} // matches your screenshot height
          pagination={false} // removes footer — screenshot has no pagination
          disableRowClickSelection={true} // keeps row click clean
          sx={{
            ml: "5px",
            mr: "10px",
            //   backgrlundColor: resolvedBodyBg,
            "& .MuiDataGrid-columnHeaders": {
              position: "sticky",
              top: 0,
              zIndex: 2,
              backgroundColor: theme.palette.grey[300],
            },
            "& .MuiDataGrid-footerContainer": {
              position: "sticky",
              bottom: 0,
              zIndex: 1,
              // backgroundColor: resolvedHeaderBg,
              overflow: "hidden",
            },
            "& . MuiTablePagination-root": {
              overflow: "hidden",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: theme.palette.action.hover,
            },
            "& .MuiDataGrid-cell:focus": {
              outline: "none",
            },
            "& .MuiDataGrid-virtualScroller": {
              overflowX: "auto", // horizontal scroll for wide tables
            },
            "& .MuiTablePagination-root": {
              overflow: "hidden",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              color: "black",
              fontWeight: 700,
            },
          }}
        />}
      </Box>
      {/* </Collapse> */}
    </Card>
  );
}

export default ManageSessions;
