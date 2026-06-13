import { Box, IconButton, Typography } from "@mui/material";
import { PrimaryButton } from "../../../../components/atom/button";
import { useNavigate } from "react-router-dom";
import { ArrowBack } from "@mui/icons-material";
import { useGetUserPermissionsQuery } from "../../../../api/permission.api";

interface RoleHeaderProps {
  searchSlot?: React.ReactNode;
}

const RoleHeader: React.FC<RoleHeaderProps> = ({ searchSlot }) => {
  const navigate = useNavigate();
const {data:userpermissionData} = useGetUserPermissionsQuery();
  return (
    <Box
      sx={{
        px: 2,
        py: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: { xs: "wrap", lg: "nowrap" },
      }}
    >
      {/* Left: Title */}
      {/* Left: Back + Title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          onClick={() => navigate("/company/settings")}
          sx={{
            p: 1,
            borderRadius: 1.5,
            "&:hover": { backgroundColor: "action.hover" },
          }}
        >
          <ArrowBack fontSize="small" sx={{ color: "text.primary" }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, color: "text.primary", fontSize: "1.5rem" }}
        >
          User Roles
        </Typography>
      </Box>

      {/* Right Section */}
      <Box
        sx={{
          ml: "auto",
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: { xs: "wrap", sm: "nowrap" },
          width: { xs: "100%", lg: "auto" },
        }}
      >
        {/* Search */}
        <Box
          sx={{
            minWidth: { xs: "100%", sm: 260 },
            flexGrow: 1,
          }}
        >
          {searchSlot}
        </Box>

        {/* Button */}
       {userpermissionData?.data?.roles.includes("Global Admin") && 
          <PrimaryButton
            sx={{
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onClick={() => navigate("/role/create")}
          >
            New Role
          </PrimaryButton>}
      </Box>
    </Box>
  );
};

export default RoleHeader;
