import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useGetEmployeeInfoQuery } from "../features/people/api/people.api";
import { Box } from "@mui/material";
import CustomCircularProgress from "../components/atom/circular-progress/CircularProgress";
import { logout, closeSecurity, goToLogin } from "../features/auth/authSlice";
import { resetProfileState } from "../features/auth/profilePage/profileSlice";
import { baseApi } from "../api/base.api";
import { useLogoutMutation } from "../features/auth/api/auth.api";
import { isUnauthorizedError } from "../features/auth/utils/rtkQueryAuthError";

/**
 * Paths that non-admin employees are allowed to access.
 * All other app routes (books, company settings, role, etc.) redirect to People.
 * `/profile` is always allowed — account/settings (not Books vs People module access).
 */
const EMPLOYEE_ALLOWED_PATHS = ["/people", "/company/home", "/profile"];

function isPathAllowed(pathname: string): boolean {
  return EMPLOYEE_ALLOWED_PATHS.some(
    (allowed) => pathname === allowed || pathname.startsWith(allowed + "/")
  );
}

/**
 * When user is an employee and NOT admin, restrict access to People and Companies list only.
 * Redirects from Books, Company settings, and other areas to /people/home.
 *
 * If GET /employee/info fails or returns an unusable payload, the user is signed out so we
 * never render Books (or other modules) without a verified employee role from the backend.
 */
export default function EmployeePortalGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [logoutApi] = useLogoutMutation();
  const [signOutStarted, setSignOutStarted] = useState(false);
  const { data, isLoading, isError, error } = useGetEmployeeInfoQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (!isError) return;
    // Broad invalidateTags (e.g. company switch) refetches this query for every tab. Only treat
    // auth failures as fatal — transient 5xx / shape races should not sign everyone out.
    if (isUnauthorizedError(error)) {
      setSignOutStarted(true);
    }
  }, [isError, error]);

  useEffect(() => {
    if (!signOutStarted) return;

    dispatch(resetProfileState());
    dispatch(logout());
    dispatch(goToLogin());
    dispatch(closeSecurity());
    navigate("/login", { replace: true });
    queueMicrotask(() => {
      dispatch(baseApi.util.resetApiState());
    });
    void logoutApi()
      .unwrap()
      .catch(() => {
        /* session may already be invalid */
      });
  }, [signOutStarted, dispatch, navigate, logoutApi]);

  const fatalEmployeeInfoError = isError && isUnauthorizedError(error);

  if (isLoading || fatalEmployeeInfoError || signOutStarted) {
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

  const isEmployee = data?.data?.isEmployee === true;
  const isAdmin = data?.data?.isAdmin === true;

  // Temporary fetch failure (after invalidation storm): avoid treating as non-employee and redirecting to Books
  if (isError && !fatalEmployeeInfoError) {
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

  // Apply guard only for employees who are not admins
  if (isEmployee && !isAdmin && !isPathAllowed(pathname)) {
    return <Navigate to="/people/home" replace />;
  }

  return <>{children}</>;
}
