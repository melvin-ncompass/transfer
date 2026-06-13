import {
  Card,
  Typography,
  Stack,
  Grid,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { ModalElement } from "../../../../components/dialogs/modal-element";
import EditIdentityModal from "./EditIdentityModal";
import { useState } from "react";
import { Snackbar } from "../../../../components/atom/snackbar/Snackbar";
import { Tooltip } from "../../../../components/atom/tooltip";
import { Edit } from "@mui/icons-material";
import { PrimaryIconButton } from "../../../../components/atom/button";
import { PermissionGuard } from "../../../../guards/ComponentGuard";
import { EditIdentityButton } from "../../BusinessSettingsPermission";
// import { useGetIdentityQuery } from "./identity.api";

interface IdentityCardProps {
  data?: {
    company?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
    metadata?: any[];
  };
  isLoading?: boolean;
}

export default function IdentityCard({ data, isLoading }: IdentityCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const company = data?.company;
  const meta = data?.metadata ?? [];

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const hasAddressData = Boolean(
    company &&
      [
        company.addressLine1,
        company.addressLine2,
        company.city,
        company.state,
        company.pincode,
        company.country,
      ].some((v) => v && v.trim() !== ""),
  );

  const hasMetaData = meta.length > 0;

  const hasIdentityData = hasAddressData || hasMetaData;

  return (
    <Card sx={{ padding: 2.5, height: "100%" }}>
      {/* Modal */}
      <ModalElement
        title="Edit Identity"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <EditIdentityModal
          onSuccess={() => {
            // close modal
            setIsModalOpen(false);

            // show success snackbar
            setSnackbar({
              open: true,
              message: "Identity updated successfully!",
              color: "success",
            });
          }}
          onError={(message) => {
            // DO NOT close modal
            setIsModalOpen(false);

            setSnackbar({
              open: true,
              message,
              color: "error",
            });
          }}
        />
      </ModalElement>

      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        width="100%"
        justifyContent="space-between"
        mb={isMobile ? 3 : 3}
        // mt={isMobile ? 1 : 2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        gap={2}
      >
        <Typography variant="h6">Identity</Typography>
        <EditIdentityButton onClick={(s)=>{setIsModalOpen(s)}}/>
      </Stack>

      {/* Responsive Grid */}
      <Grid container spacing={{ xs: 2, sm: 4 }}>
        {/* Column 1 – Company Address */}
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          <Typography variant="subtitle2" mb={1}>
            Company Address
          </Typography>

          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : hasIdentityData ? (
            <Typography variant="body2">
              {/* Address lines */}
              {[company?.addressLine1, company?.addressLine2]
                .filter((v) => v && v.trim() !== "")
                .join(", ")}

              {/* City / State / Pincode */}
              {[company?.city, company?.state, company?.pincode].some(
                (v) => v && v.trim() !== "",
              ) && (
                <>
                  <br />
                  {[company?.city, company?.state]
                    .filter((v) => v && v.trim() !== "")
                    .join(", ")}
                  {company?.pincode && ` - ${company.pincode}`}
                </>
              )}

              {/* Country */}
              {company?.country && (
                <>
                  <br />
                  {company.country}
                </>
              )}
            </Typography>
          ) : (
            <Typography>No identity data found.</Typography>
          )}
        </Grid>

        {/* Column 2 – Additional Info */}
        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
          {meta.length > 0 && (
            <>
              <Typography variant="subtitle1" mb={1}>
                Additional Identity Info
              </Typography>

              {meta.slice(0, 2).map((item: any) => (
                <Typography
                  key={item.id}
                  variant="body2"
                  color="text.secondary"
                >
                  <strong>{item.label}:</strong> {item.value}
                </Typography>
              ))}

              {meta.length > 2 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  mt={1}
                  display="block"
                >
                  +{meta.length - 2} more
                </Typography>
              )}
            </>
          )}
        </Grid>
      </Grid>
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </Card>
  );
}
