import { useState } from "react";

// material-ui
import {
  Box,
  Card,
  CardContent,
  CardHeader,

  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Check, ContentCopy, Delete } from "@mui/icons-material";

// project imports
import { PrimaryIconButton } from "../../../components/atom/button";
import { DataTable } from "../../../components/tables/data-table";
import { useAppSelector, useAppDispatch } from "../../../store/store";
import { setModalState, setSessions } from "../profilePage/profileSlice";
import { useDeleteSessionMutation } from "../api/profile.api";
import type { GridColDef } from "@mui/x-data-grid";
import { Tooltip } from "../../../components/atom/tooltip";
import InfoIconWithHover from "./InfoIconWithHover";
import { Chip } from "../../../components/atom/chips";

// ==============================|| PROFILE 3 - SESSIONS MANAGEMENT ||============================== //

export default function Sessions() {
  const pfp = useAppSelector((state: any) => state.profile);
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [deleteSessionApi] = useDeleteSessionMutation();

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
    // 1. Session ID
    {
      field: "sessionId",
      headerName: "Session ID",
      flex: 2,
      minWidth: 280,
      renderCell: (params) => {
        const sessionId = params.value;
        const [copied, setCopied] = useState(false);

        const handleCopy = () => {
          navigator.clipboard.writeText(sessionId);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        };

        return (
          <Stack direction="row" alignItems="center" spacing={1} height="100%">
            <Tooltip title={copied ? "Copied" : "Copy Session ID"}>
              <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25 }}>
                {copied ? (
                  <Check fontSize="small" color="success" />
                ) : (
                  <ContentCopy fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title={sessionId}>
              <Typography noWrap sx={{ maxWidth: 1, cursor: "pointer" }}>
                {sessionId}
              </Typography>
            </Tooltip>
            {pfp.sessionId === sessionId && (
              <Chip label="Current" color="success" size="small" />
            )}
          </Stack>
        );
      },
    },

    // 2. Created At
    {
      field: "createdAt",
      headerName: "Created At",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Stack justifyContent="center" height="100%" alignItems="start">
          <Typography>{convertDateString(params.value)}</Typography>
        </Stack>
      ),
    },

    // 3. Expires At
    {
      field: "expiresAt",
      headerName: "Expires At",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Stack justifyContent="center" height="100%" alignItems="start">
          <Typography>{convertDateString(params.value)}</Typography>
        </Stack>
      ),
    },

    // 4. Client Info with Info Icon
    {
      field: "clientInfo",
      headerName: "Client Info",
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: (params) => {
        const { ip, os, browser } = params.row.clientInfo ?? {};
        return <InfoIconWithHover ip={ip} os={os} browser={browser} />;
      },
    },

    // 5. Delete Action
    {
      field: "delete",
      headerName: "Delete",
      headerAlign: "center",
      disableColumnMenu: true,
      minWidth: 80,
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
                          (row: any) => row.sessionId !== params.row.sessionId
                        )
                      )
                    );
                    await deleteSessionApi({ sessionId: params.row.sessionId });
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
        p: 0,
        height: "calc(100vh - 220px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardHeader
        sx={{ p: 2 }}
        title="Manage Sessions"
        action={
          <Tooltip
            title={
              pfp.sessions.length <= 1 ? "No other sessions to sign out " : ""
            }
          >
            <PrimaryIconButton
              title="Sign out of all other sessions"
              onClick={() =>
                dispatch(
                  setModalState({ modal: "logoutAllModal", value: true })
                )
              }
              icon={<Delete sx={{ width: 19 }} />}
            />
          </Tooltip>
        }
      />
      <CardContent
        sx={{
          p: 0,
          flex: 1,
          minHeight: 0, // VERY IMPORTANT for flex scroll
        }}
      >
        {/* ===== FIX: Removed maxHeight & overflow */}
        <DataTable
          columns={columns}
          rows={pfp.sessions}
          getRowId={(row) => row.sessionId}
          pagination={false}
          disableRowClickSelection={true}
          sx={{
            height: "100%", // <- KEY CHANGE
            "& .MuiDataGrid-columnHeaders": {
              position: "sticky",
              top: 0,
              zIndex: 2,
              backgroundColor: theme.palette.grey[300],
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
