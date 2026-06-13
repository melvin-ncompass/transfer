import { Box, Stack, Grid } from "@mui/material";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import UserManagementView from "./usermanagement/UserManagementView";
import CompanyDetailsCard from "./companyDetails/components/CompanyDetailsCard";
import IdentityCard from "./companyIdentity/components/IdentityCard";
import ReportStructureCard from "./reportStructure/components/ReportStructureCard";
import { useAppDispatch } from "../../store/store";
import {
  setCompanyName,
  setCreatedOn,
  setShortName,
} from "./companyDetails/slice/companyBrandingSlice";
import CustomCircularProgress from "../../components/atom/circular-progress/CircularProgress";
import { useGetIdentityQuery } from "./companyIdentity/components/identity.api";
import { useGetCompanyDetailsQuery } from "./companyDetails/api/companyBranding.api";
import { useGetAllUsersQuery } from "./usermanagement/api/user.api";
import ActivityCard from "./activity/components/ActivityCard";
import EnablingAppsCard from "./enablingApps/components/enablingAppsCard";
import InvoiceCard from "./invoiceTemplate/components/InvoiceCard";
import RemindersCard from "./reminders/components/RemindersCard";
import GoogleDriveView from "./googleDrive/GoogleDriveView";
import CustomDomainCard from "./customDomain/components/customDomainCard";
import { useGetCustomDomainInfoQuery } from "./customDomain/api/customDomain.api";
import { PermissionGuard } from "../../guards/ComponentGuard";

function BusinessSettingsView() {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const { data, isLoading } = useGetCompanyDetailsQuery();
      const { data:cdData } = useGetCustomDomainInfoQuery();
  
  const { data: identityData, isLoading: identityLoading } =
    useGetIdentityQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });
  const { data: usersData } = useGetAllUsersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Sync query → redux slice
  useEffect(() => {
    if (data?.data?.company) {
      dispatch(setCompanyName(data.data.company.companyName || ""));
      dispatch(setShortName(data.data.company.companyShortName || ""));
      dispatch(setCreatedOn(data.data.company.createdAt || ""));
    }
  }, [data, dispatch]);

  // Scroll to Users section once
  useEffect(() => {
    if (location.state?.scrollToUsers && data) {
      const el = document.getElementById("user-management-section");

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      window.history.replaceState({}, document.title);
    }

    if (location.state?.scrollToInvoice && data) {
      const el = document.getElementById("invoice-card-section");

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      window.history.replaceState({}, document.title);
    }
  }, [location.state, data]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", height: "50vh" }}>
        <CustomCircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 200px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack spacing={2} marginBottom={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <CompanyDetailsCard />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <ReportStructureCard />
          </Grid>
        </Grid>
        <Grid container spacing={2}>
        {/* {cdData?.data?.dnsValid &&  */}
          {/* <PermissionGuard permission={"manage_custom_domain_mapping"}> */}
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <CustomDomainCard />
          </Grid>
          {/* </PermissionGuard> */}
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <EnablingAppsCard />
          </Grid>
        </Grid>
        {/* <ReportStructureCard /> */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <GoogleDriveView />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 6 }}>
            <IdentityCard data={identityData} isLoading={identityLoading} />
          </Grid>
        </Grid>
        <UserManagementView data={usersData} />
       <PermissionGuard permission={"view_export_activity"}>
        <ActivityCard />
       </PermissionGuard>
        <RemindersCard />
        <InvoiceCard />

        <Box />
        {/* This Box is  just added to provides bottom spacing between the AppCard and the footer dont remove it */}
      </Stack>
    </Box>
  );
}

export default BusinessSettingsView;
