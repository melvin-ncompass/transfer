import { IconButton, Stack, Typography } from "@mui/material";
import { StandardTable } from "../../../../../../components/tables/standard-table";
import {
  useDeleteSalaryTemplateMutation,
  useGetAllSalaryTemplatesQuery,
  type SalaryTemplate,
} from "../api/salaryTemplate.api";
import { MoreVert } from "@mui/icons-material";
import { useState } from "react";
import MenuAtom, {
  type MenuAtomItem,
} from "../../../../../../components/menuatom/MenuAtom";
import { Box } from "@mui/system";
import { formatCurrencyByCommaSeparation } from "../../../../../../utils/numberFormatter";
import { useGetHeaderDataQuery } from "../../../../../company/api/company.api";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useNavigate } from "react-router-dom";

/* ---------- Row Type ---------- */
type SalaryTemplateRow = {
  id: string;
  templateName: string;
  description: string;
  annualGross: number;
  monthlyGross: number;
};

export default function SalaryTemplateTable() {
  const navigate = useNavigate();
  // helper functions
  const mapSalaryTemplatesToRows = (
    templates: SalaryTemplate[],
  ): SalaryTemplateRow[] => {
    return templates.map((template) => ({
      id: template.id,
      templateName: template.templateName,
      description: template.description,
      annualGross: template.annualGross,
      monthlyGross: Math.round(template.annualGross / 12),
    }));
  };
  // state variables
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedRow, setSelectedRow] = useState<SalaryTemplateRow | null>(
    null,
  );
  const [openModal, setOpenModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  // api calls and related variables
  const { data, isLoading } = useGetAllSalaryTemplatesQuery(undefined, {
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });
  // const { data: templateData, isLoading: isTemplateLoading } =
  //   useGetSalaryTemplateByIdQuery(selectedRow?.id || "", {
  //     skip: !selectedRow,
  //   });
  const [deleteSalaryTemplate] = useDeleteSalaryTemplateMutation();
  const { data: headerData } = useGetHeaderDataQuery();
  const commaseperation =
    headerData?.data.commaSeparation === "IN" ? "IN" : "US";
  const currency = headerData?.data.reportingCurrency?.split(" - ")[0];
  // menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };
  const handleMenuClose = () => setMenuAnchor(null);
  /* Action Menu Functions */
  const handleEdit = (row: SalaryTemplateRow) => {
    console.log("Edit:", row);
    setSelectedRow(row);
    setOpenModal(true);
    navigate(`/people/salary/template/edit/${row.id}`);
  };

  const handleDuplicate = (row: SalaryTemplateRow) => {
    console.log("Duplicate:", row);
    setSelectedRow(row);
    setDuplicate(true);
    navigate(`/people/salary/template/duplicate/${row.id}`);
    setOpenModal(true);
  };

  const handleDelete = (row: SalaryTemplateRow) => {
    console.log("Delete:", row);
    setDeleteModalOpen(true);
  };
  const handleConfirmDelete = async (id: string) => {
    console.log("Confirm Delete:", id);
    try {
      await deleteSalaryTemplate(id).unwrap();
      setDeleteModalOpen(false);
      setSelectedRow(null);
      showSnack("Template deleted successfully", "success");
    } catch (error: any) {
      showSnack(error.data?.message || "Failed to delete template", "error");
      // keep delete modal open so the user can retry or cancel
    }
  };

  // Menu items
  const menuItems: MenuAtomItem[] = [
    {
      label: "Edit",
      onClick: () => {
        handleEdit(selectedRow!);
      },
    },
    {
      label: "Duplicate",
      onClick: () => {
        setDuplicate(true);
        handleDuplicate(selectedRow!);
      },
    },
    {
      label: "Delete",
      onClick: () => {
        handleDelete(selectedRow!);
      },
    },
  ];
  /* Columns */

  const columns = [
    {
      id: "templateName",
      label: "Template Name",
      render: (row: SalaryTemplateRow) => (
        <Typography fontWeight={500}>{row.templateName}</Typography>
      ),
    },
    {
      id: "description",
      label: "Description",
      render: (row: SalaryTemplateRow) => row.description || "-",
    },
    {
      id: "annualGross",
      label: "Annual Gross",
      align: "right" as const,
      render: (row: SalaryTemplateRow) =>
        formatCurrencyByCommaSeparation(
          row.annualGross,
          commaseperation,
          currency,
        ),
    },
    {
      id: "monthlyGross",
      label: "Monthly Gross",
      align: "right" as const,
      render: (row: SalaryTemplateRow) =>
        formatCurrencyByCommaSeparation(
          row.monthlyGross,
          commaseperation,
          currency,
        ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "center" as const, headingAlign: "center" as const,

      render: (row: SalaryTemplateRow) => (
        <Stack
          direction="row"
          justifyContent="center"
          spacing={1}
          alignItems={"center"}
        >
          <IconButton
            size="small"
            onClick={(event) => {
              setSelectedRow(row);
              handleMenuOpen(event);
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];
  // rows
  const rows: SalaryTemplateRow[] = data?.data
    ? mapSalaryTemplatesToRows(data.data)
    : [];
  return (
    <Box
      sx={{
        overflow: "scroll",
        height: "100%",
      }}
    >
      <StandardTable
        loading={isLoading}
        columns={columns}
        rows={rows}
        sticky
      />

      <MenuAtom
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        items={menuItems}
        onCloseAll={handleMenuClose}
      />

      {/* salary template edit/duplicate modal */}
      {/* {openModal && selectedRow && templateData && (
        <SalaryTemplateModal
          open={openModal}
          onClose={() => {setOpenModal(false);setDuplicate(false);}}
          title={duplicate ? "Duplicate Template" : "Edit Template"}
          data={templateData?.data || null}
          duplicate={duplicate}
          onSuccess={(data:string) => {
          showSnack(data, "success");
        }}
        onError={(data:string) => {
          showSnack(data, "error");
        }}
        />
      )} */}
      {deleteModalOpen && selectedRow && (
        <ConfirmDialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={() => handleConfirmDelete(selectedRow!.id)}
          confirmColor="error"
          confirmText="Delete"
          title="Delete Salary Template"
          message="Are you sure you want to delete this salary template?"
          maxWidth="md"
        />
      )}

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </Box>
  );
}
