import { Box, Typography } from "@mui/material";
import { useState, useCallback, useEffect } from "react";
import RoleHeader from "./RoleHeader";
import RoleList from "./RoleList";
import { SearchBoxAtom } from "../../../../components/searchbar/SearchBoxAtom";
import { useGetRolesQuery } from "../../api/rba.api";
import type { IRoleDetails } from "../../types/rba.types";
import CustomCircularProgress from "../../../../components/atom/circular-progress/CircularProgress";

const RoleDetailPanel = () => {
  const { data: rolesResponse, isLoading, isFetching } = useGetRolesQuery();

  const [roles, setRoles] = useState<IRoleDetails[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<IRoleDetails[] | null>(null);

  useEffect(() => {
    if (!rolesResponse?.data) return;

    setRoles(rolesResponse.data);
    setFilteredRoles(rolesResponse.data);
  }, [rolesResponse]);

  const handleFilteredRoles = useCallback((filtered: IRoleDetails[]) => {
    setFilteredRoles(filtered);
  }, []);

  const isInitialLoading = isLoading || isFetching;

  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        borderRadius: 2,
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <RoleHeader
        searchSlot={
          <SearchBoxAtom
            data={roles}
            size="small"
            searchKeys={["roleName"]}
            onFilteredData={handleFilteredRoles}
            placeholder="Search roles..."
          />
        }
      />

      {/* Filtered Content */}
      {isInitialLoading || filteredRoles === null ? (
        <Box
          sx={{
            mt: 6,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <CustomCircularProgress size={28} />
        </Box>
      ) : filteredRoles.length === 0 ? (
        <Box
          sx={{
            mt: 6,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <Typography variant="h6">No roles found</Typography>
          <Typography variant="body2">Try adjusting your search.</Typography>
        </Box>
      ) : (
        <RoleList roles={filteredRoles} />
      )}
    </Box>
  );
};

export default RoleDetailPanel;
