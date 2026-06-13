import {
  Box,
  Card,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { useGetAllCompanyQuery } from "./api/company.api";
import { PrimaryButton, PrimaryIconButton } from "../../components/atom/button";
import CompanyTable from "./components/CompanyTable";
import AddCompanyModal from "./components/AddCompanyModal";
import { Snackbar } from "../../components/atom/snackbar";
import AddIcon from "@mui/icons-material/Add";

function CompanyView() {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down("sm"));

  const { data, refetch, isLoading } = useGetAllCompanyQuery();

  const [openAddModal, setOpenAddModal] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const handleActionSuccess = (message: string) => {
    setSnackbar({ open: true, message, color: "success" });
    refetch();
  };

  return (
    <>
      <Card sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={{ xs: 2, sm: 0 }}
        >
          <Typography variant="subtitle1">Companies</Typography>

          <PrimaryIconButton
            onClick={() => setOpenAddModal(true)}
            icon={<AddIcon />}
            title="Add"
          />
        </Stack>

        <Box mt={1}>
          <CompanyTable  rows={data?.data || []} loading={isLoading} />
        </Box>
      </Card>

      <AddCompanyModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onSuccess={() => handleActionSuccess("Company created successfully!")}
      />

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
    </>
  );
}

export default CompanyView;
