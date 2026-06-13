import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { SecondaryButton } from "../../../../components/atom/button";
import { useGetPermissionsQuery } from "../../api/rba.api";
import { Permission } from "./Permission";
import { Snackbar } from "../../../../components/atom/snackbar";
import CustomCircularProgress from "../../../../components/atom/circular-progress/CircularProgress";
import type { IModulePermissionList } from "../../types/rba.types";

interface PermissionPanelProps {
  selectedPermissions: string[];
  onChange: (permissions: string[]) => void;
}

export const PermissionPanel: React.FC<PermissionPanelProps> = ({
  selectedPermissions,
  onChange,
}) => {
  const theme = useTheme();
  const {
    data: permissionsData,
    isLoading,
    isError,
  } = useGetPermissionsQuery();

  const modules = useMemo(() => permissionsData?.data ?? [], [permissionsData]);

  // Explicitly type the `apps` array as `string[]`
  const apps: string[] = useMemo(
    () => Array.from(new Set(modules.map((m: IModulePermissionList) => m.app))),
    [modules]
  );

  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(selectedPermissions || []);
  const [openMap, setOpenMap] = useState<Record<string, string | null>>({});

  // Initialize from props (edit)
  useEffect(() => {
    setSelected(selectedPermissions || []);
  }, [selectedPermissions]);

  // Notify parent
  useEffect(() => {
    onChange(selected);
  }, [selected, onChange]);

  const filterPermissionData = useMemo(
    () => modules.filter((m: IModulePermissionList) => m.app === activeApp),
    [modules, activeApp]
  );

  // Set the first app as active if it's not already set
  useEffect(() => {
    if (!activeApp && apps.length > 0) setActiveApp(apps[0]);
  }, [apps, activeApp]);

  if (isLoading) return <CustomCircularProgress />;
  if (isError)
    return <Snackbar message="Error loading permissions" color="error" />;

  return (
    <Box display="flex" flexDirection="column" gap={1}>
      <Typography fontWeight={600}>Permissions</Typography>

      <Box display="flex" gap={4} flexDirection={{ xs: "column", md: "row" }}>
        {/* Apps */}
        <Box flex={0.5} display="flex" flexDirection="column" gap={2}>
          {apps.map((app) => (
            <SecondaryButton
              key={app}
              onClick={() => {
                setActiveApp(app);
                setOpenMap({});
              }}
              sx={{
                width: "100%",
                bgcolor:
                  activeApp === app ? "primary.main" : theme.palette.grey[100],
                color:
                  activeApp === app
                    ? theme.palette.common.white
                    : theme.palette.text.primary,
              }}
            >
              {app}
            </SecondaryButton>
          ))}
        </Box>

        {/* Permissions */}
        <Box flex={2} sx={{ maxHeight: 360, overflowY: "auto", pr: 1 }}>
          {filterPermissionData.map((module: IModulePermissionList) => (
            <Permission
              key={module.moduleName}
              module={module}
              selected={selected}
              setSelected={setSelected}
              openMap={openMap}
              setOpenMap={setOpenMap}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};
