import { Card, Grid, Stack, Typography, useTheme, useMediaQuery } from "@mui/material";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import { useEffect, useState } from "react";
import EditCompanyDetailsModal from "./EditCompanyDetailsModal";
import { useGetCompanyDetailsQuery } from "../api/companyBranding.api";
import { useAppDispatch, useAppSelector } from "../../../../store/store";
import {
  setCompanyName,
  setShortName,
  setCreatedOn,
} from "../slice/companyBrandingSlice";
import { Snackbar } from "../../../../components/atom/snackbar/Snackbar";
import  { EditCompanyBrandingButton } from "../../BusinessSettingsPermission";
export default function CompanyDetailsCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const branding = useAppSelector((state) => state.branding);
  const dispatch = useAppDispatch();

  // Correct RTK Query hook
  const { data, refetch } = useGetCompanyDetailsQuery();

  useEffect(() => {
    if (data?.data?.company) {
      dispatch(setCompanyName(data.data.company.companyName || ""));
      dispatch(setShortName(data.data.company.companyShortName || ""));
      dispatch(setCreatedOn(data.data.company.createdAt || ""));
    }
  }, [data, dispatch]);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

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

  return (
    <Card
      sx={{
        padding: 2.5,
        // height: "100%",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        width="100%"
        justifyContent="space-between"
        mb={isMobile ? 3 : 3}
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
      >
        <Typography variant="h6">Company Details</Typography>
        <EditCompanyBrandingButton onClick={(s)=>setIsModalOpen(s)}/>
      </Stack>

      {/* Company Info */}
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {/* Company Name */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.primary">
              Company Name
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {branding.companyName || "N/A"}
            </Typography>
          </Stack>
        </Grid>

        {/* Company Short Name */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.primary">
              Company Short Name
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {branding.shortName || "N/A"}
            </Typography>
          </Stack>
        </Grid>

        {/* Created On */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" color="text.primary">
              Created On
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {branding.createdOn
                ? convertDateString(branding.createdOn)
                : "N/A"}
            </Typography>
          </Stack>
        </Grid>
      </Grid>

      {/* Edit Modal */}
      <ModalElement
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Company Details/ Branding"
      >
        <EditCompanyDetailsModal
          onSave={async () => {
            // Refetch company details after saving
            await refetch();

            setSnackbar({
              open: true,
              message: "Company details updated successfully!",
              color: "success",
            });
            setIsModalOpen(false);
          }}
        />
      </ModalElement>

      {/* Snackbar */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </Card>
  );
}
