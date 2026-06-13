import { Box, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
  Outlet,
} from "react-router-dom";
import PremiumSidebar from "./sidebar/SideBarPeople";
import CustomCircularProgress from "../../components/atom/circular-progress/CircularProgress";
import { useGetPendingDocumentsQuery } from "../company/api/company.api";
import { Snackbar } from "../../components/atom/snackbar";
import { useGetEmployeeInfoQuery } from "./api/people.api";
import { useGetPeopleAccessQuery } from "../setting/enablingApps/api/enablingapps.api";

const SIDEBAR_BREAKPOINT = "md";

/** Derive sidebar activeItem from current path (and ?tab= when on home). */

function getActiveItemFromPath(pathname: string, tabParam: number): number {
  if (pathname.includes("/people/directory")) return 4; // Organization
  if (pathname.includes("/people/salary/payrun")) return 71; // Salary > PayRun (includes details route)
  if (pathname.includes("/people/configs")) return 71; // PayRun
  if (pathname.includes("/people/salary/template")) return 72;
  if (pathname.includes("/people/approvals/poi")) return 10; // Approvals – POI review
  if (pathname.includes("/people/investment")) return 3; // Me – IT declaration add/edit routes
  if (pathname.includes("/people/projects")) return 9; // Projects & Timesheets
  if (pathname.includes("/people/me/document/acknowledge")) return 3;
  if (pathname.includes("/people/org/document/acknowledge")) return 4;
  return tabParam;
}

export default function PeopleLayout() {
  const { data: enabled } = useGetPeopleAccessQuery();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(
    theme.breakpoints.down(SIDEBAR_BREAKPOINT),
  );
  const [collapsed, setCollapsed] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", color: "" });


  const { data: employeeInfo, isSuccess: employeeInfoLoaded, isLoading: employeeInfoLoading } =
    useGetEmployeeInfoQuery();

  const empId = employeeInfo?.data?.employeeId;
  const useRestrictedPeopleMenu =
    employeeInfo?.data?.isAdmin !== true &&
    (employeeInfo?.data?.isEmployee === true ||
      employeeInfo?.data?.isManager === true);
  const hideHomeAndMeTabs =
    employeeInfoLoaded && employeeInfo?.data?.isEmployee !== true;
  const { data: pendingData, isLoading: isPendingLoading } = useGetPendingDocumentsQuery(empId!, {
    skip: !empId,
  });

  const hasBlockingDocument = pendingData?.data?.some((doc) => doc?.blockPortal) ?? false;

  const isAdminNotEmployee =
    employeeInfo?.data?.isAdmin === true &&
    employeeInfo?.data?.isEmployee !== true;

  const shouldBlockPortal = hasBlockingDocument && !isAdminNotEmployee;
  const isPeopleHome = location.pathname.startsWith("/people/home");

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const tabParam = Number(searchParams.get("tab")) || 1;
  const activeItem = getActiveItemFromPath(location.pathname, tabParam);

  const handleSetCurrentComponent = (value: React.SetStateAction<number>) => {
    const id = typeof value === "function" ? value(tabParam) : value;
    navigate(`/people/home?tab=${id}`, { replace: true });
  };

  const effectiveCollapsed = isSmallScreen ? true : collapsed;

  useEffect(() => {
    if (shouldBlockPortal && !location.pathname.includes("/people/document/acknowledge/pending")) {
      navigate("/people/document/acknowledge/pending", { replace: true });
    }
  }, [shouldBlockPortal, location.pathname, navigate]);

  useEffect(() => {
    if (!isPeopleHome) return;
    if (useRestrictedPeopleMenu) {
      navigate("/people/home?tab=2", { replace: true });
    }
  }, [useRestrictedPeopleMenu, isPeopleHome, navigate]);


  useEffect(() => {
    if (!isPeopleHome) return;
    if (!hideHomeAndMeTabs) return;
    if (tabParam === 2 || tabParam === 3) {
      navigate("/people/home?tab=1", { replace: true });
    }
  }, [hideHomeAndMeTabs, tabParam, isPeopleHome, navigate]);

  /** Approvals (tab 10): managers, or admin + employee (admin queue); others deep-link to Home. */
  useEffect(() => {
    const onPeopleHome = /\/people\/home\/?$/.test(location.pathname);
    if (!onPeopleHome || tabParam !== 10) return;
    if (employeeInfoLoading) return;
    const d = employeeInfo?.data;
    const canSeeApprovals =
      d?.isManager === true || (d?.isAdmin === true && d?.isEmployee === true);
    if (employeeInfoLoaded && canSeeApprovals) return;
    navigate("/people/home?tab=2", { replace: true });
  }, [
    location.pathname,
    tabParam,
    employeeInfoLoading,
    employeeInfoLoaded,
    employeeInfo?.data?.isManager,
    employeeInfo?.data?.isAdmin,
    employeeInfo?.data?.isEmployee,
    navigate,
  ]);

  if (isPendingLoading) {
    return (
      <Box sx={{ display: "flex", width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
        <CustomCircularProgress />
      </Box>
    );
  }
  if (enabled?.data[0].isPeopleEnabled === false) {
    navigate("/no-access");
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          height: "100%",
          width: "100%",
          gap: 3,
          flex: "1 1 auto",
        }}
      >
        {!isMobile && !shouldBlockPortal && (
          <PremiumSidebar
            collapsed={effectiveCollapsed}
            setCollapsed={setCollapsed}
            setCurrentComponent={handleSetCurrentComponent}
            activeItem={activeItem}
          />
        )}
        <Box
          sx={{
            flexGrow: 1,
            transition: "margin-left 0.3s ease, width 0.3s ease",
            width: effectiveCollapsed
              ? "calc(100% - 60px)"
              : "calc(100% - 220px)",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color as "success" | "error" | "warning" | "info"}
          onClose={() => setSnackbar({ open: false, message: "", color: "" })} />
      )}
    </>
  );
}
