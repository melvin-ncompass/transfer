import { useState, useMemo } from "react";
import { Box, Avatar, Tooltip, Popover, Typography, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Apps } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useGetPeopleAccessQuery } from "../../../../features/setting/enablingApps/api/enablingapps.api";
import { useGetEmployeeInfoQuery } from "../../../../features/people/api/people.api";
import GroupsIcon from "@mui/icons-material/Groups";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { usePermission } from "../../../../context/PermissionContext";

export default function AppLauncher({ currentApp }: { currentApp: string | null }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const { data, isLoading } = useGetPeopleAccessQuery();
  const isPeopleEnabled = data?.data?.[0]?.isPeopleEnabled ?? false;
  const { data: employeeInfo } = useGetEmployeeInfoQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const isAdmin = employeeInfo?.data?.isAdmin === true;
  const permissionAbbreviations = [
    "view_business_settings",
    "update_business_settings",
    "view_export_activity",
    "import_export_business_settings",
    "manage_custom_domain_mapping",

    "view_reminders",
    "manage_reminders",

    "view_user_management",
    "manage_user_management",

    "view_insights",
    "manage_insights",
    "export_insights",

    "view_coa",
    "manage_coa",
    "export_coa",

    "view_transactions",
    "manage_transactions",
    "export_transactions",
    "manage_uncategorized_transactions",
    "view_opening_balance",
    "manage_opening_balance",
  ];
  const { permissions } = usePermission();
  const permAbbrSet = useMemo(() => new Set(permissionAbbreviations), []);
  const hasBooksPermission = useMemo(
    () => permissions.some((p) => permAbbrSet.has(p)),
    [permissions, permAbbrSet]
  );

  const apps = useMemo(() => {
    const all = [
      { key: "books", label: "Books", icon: <AccountBalanceIcon fontSize="medium" />, enabled: hasBooksPermission },
      { key: "people", label: "People", icon: <GroupsIcon fontSize="medium" />, enabled: isPeopleEnabled },
    ];
    return all.filter((a) => a.enabled);
  }, [hasBooksPermission, isPeopleEnabled]);

  if (!isAdmin && window.location.href.includes("people")) return null;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);

  const handleAppSelect = (key: string) => {
    handleClose();
    navigate(key === "books" ? "/books/transact/home" : "/people/home");
  };

  return (
    <Box sx={{ ml: 2 }}>
      <Tooltip title="Switch Apps">
        <Avatar
          variant="rounded"
          sx={{
            width: 34,
            height: 34,
            cursor: "pointer",
            color: theme.palette.primary.main,
            background: theme.palette.primary.light,
            transition: "all 0.2s ease",
            "&:hover": {
              color: theme.palette.primary.light,
              background: theme.palette.primary.main,
            },
          }}
          onClick={handleClick}
        >
          <Apps />
        </Avatar>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiPaper-root": {
            p: 2,
            borderRadius: 2,
            minWidth: 200,
          },
        }}
      >
        {isLoading ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            Loading apps...
          </Typography>
        ) : (
          <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
            {apps.map((app) => {
              const isCurrent = pathname.includes(app.key);
              return (
                <Box
                  key={app.key}
                  onClick={() => handleAppSelect(app.key)}
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: isCurrent ? theme.palette.primary.main : theme.palette.text.primary,
                    background: isCurrent ? `${theme.palette.primary.light}` : "transparent",
                    border: isCurrent
                      ? `2px solid ${theme.palette.primary.main}`
                      : "2px solid transparent",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.primary.main,
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  {app.icon}
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: isCurrent ? 600 : 500 }}>
                    {app.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </Popover>
    </Box>
  );
}
