import { Navigate, Outlet } from "react-router-dom";
import { useGetDetailsQuery } from "../features/auth/api/profile.api";
import { Box } from "@mui/material";
import CustomCircularProgress from "../components/atom/circular-progress/CircularProgress";
import { usePermission } from "../context/PermissionContext";
import EmployeePortalGuard from "../guards/EmployeePortalGuard";

const ProtectedRoute = ({ redirectTo = "/login", permission = "" }) => {
  const { data, isLoading, isError } = useGetDetailsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const { permissions } = usePermission(); // ← read from context

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CustomCircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Navigate to={redirectTo} replace />;
  }

  //  Permission check — from context, not from data
  if (
    permission &&
    permissions.length > 0 &&
    !permissions.includes(permission)
  ) {
    console.log(permissions);
    console.log("it is invalid", permission);
    return <Navigate to="/no-access" replace />;
  }
  console.log("permission is valid", permission);
  return (
    <EmployeePortalGuard>
      <Outlet />
    </EmployeePortalGuard>
  );
};

export default ProtectedRoute;
