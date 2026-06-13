import { Box, IconButton, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { RadioButton } from "../../../components/atom/radio-button";
import MenuAtom from "../../../components/menuatom/MenuAtom";
import type { GridColDef } from "@mui/x-data-grid";
import type { ColumnParams } from "../types/company.types";

/** True when hostname has a subdomain before "bsuite-dev" (e.g. testnew.bsuite-dev.nclabs.tech) */
const isOnCompanyDomain = () => {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname;
  // true:  testnew.bsuite-dev.nclabs.tech  (something before bsuite-dev)
  // false: bsuite-dev.nclabs.tech           (bsuite-dev is at the start)
  return hostname.startsWith("bsuite-dev") === false && hostname.includes("bsuite-dev");
};

export const getCompanyTableColumns = ({
  setCompanyId,
  handleSetDefault,
  handleMenuOpen,
  anchorEl,
  selectedRow,
  handleMenuClose,
  handleEdit,
  setDeleteDialog,
  handleSetCompany,
  handleSetCompanyAndOpenInNewWindow,
}: ColumnParams & {
  handleSetCompany: (
    companyId: string,
    companyName: string,
    navigatePath: string,
    state?: any,
  ) => void;
  handleSetCompanyAndOpenInNewWindow: (
    companyId: string,
    companyName: string,
    domainUrl: string,
  ) => void;
}): GridColDef[] => [
  {
    field: "companyId",
    headerName: "Company ID",
    sortable: false,
    flex: 1,
    resizable: false,
  },
  {
    field: "companyName",
    headerName: "Company Name",
    flex: 1,
    sortable: false,
    resizable: false,
    renderCell: (params) => {
      const readOnly = isOnCompanyDomain();
      return (
        <Box>
          <Typography
            sx={{
              cursor: readOnly ? "default" : "pointer",
              color: readOnly ? "text.primary" : "info.main",
              display: "inline",
            }}
            onClick={
              readOnly
                ? undefined
                : () =>
                    handleSetCompany(
                      params.row.companyId,
                      params.row.companyName,
                      "/books/transact/home",
                    )
            }
          >
            {params.row.companyName}
          </Typography>
        </Box>
      );
    },
  },
  {
    field: "noOfUsers",
    headerName: "Users",
    flex: 1,
    sortable: false,
    resizable: false,
    renderCell: (params) => {
      const readOnly = isOnCompanyDomain();
      return (
        <Box>
          <Typography
            sx={{
              cursor: readOnly ? "default" : "pointer",
              color: readOnly ? "text.primary" : "info.main",
              display: "inline",
            }}
            onClick={
              readOnly
                ? undefined
                : () =>
                    handleSetCompany(
                      params.row.companyId,
                      params.row.companyName,
                      "/company/settings",
                      { scrollToUsers: true },
                    )
            }
          >
            {params.row.noOfUsers}
          </Typography>
        </Box>
      );
    },
  },
  {
    field: "companyProductDomain",
    headerName: "Product Domain",
    flex: 1,
    sortable: false,
    resizable: false,
    renderCell: (params) => (
      <Box>
        <Typography
          sx={{ cursor: "pointer", color: "info.main", display: "inline" }}
          onClick={() => {
            const domainUrl = `https://${params.row.companyProductDomain}.bsuite-dev.nclabs.tech`;
            handleSetCompanyAndOpenInNewWindow(
              params.row.companyId,
              params.row.companyName,
              `${domainUrl}/company/settings`,
            );
          }}
          
        >
          {`${params.row.companyProductDomain}.bsuite-dev.nclabs.tech`}
        </Typography>
      </Box>
    ),
  },
  {
    field: "companyCustomDomain",
    headerName: "Custom Domain",
    flex: 1,
    sortable: false,
    resizable: false,
    renderCell: (params) => {
      const customDomain = params.row.companyCustomDomain;
      const hasDomain = customDomain && String(customDomain).trim() !== "";
      const loginUrl = hasDomain
        ? (String(customDomain).match(/^https?:\/\//i)
            ? `${customDomain.replace(/\/+$/, "")}/login`
            : `https://${customDomain.replace(/\/+$/, "")}/login`)
        : null;
      return (
        <Box>
          <Typography
            sx={{
              cursor: hasDomain ? "pointer" : "default",
              color: hasDomain ? "info.main" : "text.primary",
              display: "inline",
            }}
            onClick={() => {
              if (loginUrl) window.open(loginUrl, "_blank");
            }}
          >
            {customDomain ?? "—"}
          </Typography>
        </Box>
      );
    },
  },
  {
    field: "default",
    headerName: "Default",
    flex: 0.5,
    sortable: false,
    align: "right",
    headerAlign: "center",
    resizable: false,
    renderCell: (params) => (
      <RadioButton
        checked={params.row.isDefault}
        onChange={(e) => {
          e.stopPropagation();
          handleSetDefault(params.row.companyId);
        }}
      />
    ),
  },
  {
    field: "actions",
    headerName: "Actions",
    flex: 0.5,
    sortable: false,
    resizable: false,
    renderCell: (params) => (
      <>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleMenuOpen(e, params.row.id);
          }}
        >
          <MoreVertIcon />
        </IconButton>

        {selectedRow === params.row.id && anchorEl && (
          <MenuAtom
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onCloseAll={handleMenuClose}
            items={[
              // { label: "Edit", onClick: handleEdit },
              { label: "Delete", onClick: () => setDeleteDialog(true) },
            ]}
          />
        )}
      </>
    ),
  },
];
