import { useState, useMemo, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import { CollapsibleRowsTableAtom } from "../../../../../../components/tables/standard-table/CollapsibleRowsTableAtom";
import { Chip } from "../../../../../../components/atom/chips";
import {
  useGetVerifiedDocumentsQuery,
  useDeleteEmployeeDocumentMutation,
  type EmployeeDocumentDetails,
} from "../../../../me/documents/api/empdoc.api";
import { useLazyGetAttachmentFileQuery } from "../../../../../books/transact/transactHome/api/transact.api";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { ConfirmDialog } from "../../../../../../components/dialogs/confirm-dialog";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useSearchParams } from "react-router-dom";

type TabOption = "byEmployee" | "byDocument";

export function VerifiedDocumentsPage() {
  const [searchParams] = useSearchParams();
  const activeTabDocs = Number(searchParams.get("employeeDocsTab")) || 0;

  const [activeTab, setActiveTab] = useState<TabOption>("byEmployee");
  const { data, isLoading, refetch } = useGetVerifiedDocumentsQuery();
  const [deleteDocument] = useDeleteEmployeeDocumentMutation();

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; recordIds: number[] }>({ open: false, recordIds: [] });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", color: "success" as "success" | "error" });

  useEffect(() => {
    if (activeTabDocs === 2) {
      refetch();
    }
  }, [activeTabDocs, refetch]);
  const [getFile] = useLazyGetAttachmentFileQuery();
  const [preview, setPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<Blob | null>(null);
  const previewUrl = useMemo(() => {
    if (!previewFile) return null;
    return URL.createObjectURL(previewFile);
  }, [previewFile]);

  const [previewName, setPreviewName] = useState<string>("");
  const handleDownload = () => {
    if (!previewUrl) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = previewName || "download";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const rows = useMemo(() => {
    if (!data) return [];

    if (activeTab === "byEmployee") {
      return Object.values(data.groupedByEmployee).map((documents) => {
        if (!documents.documents.length)
          return { id: "no-employee", name: "No Employee", children: [] };

        const employee = documents.documents[0].employee;
        const employeeName = employee.contact.name;
        const employeeDesignation = employee.designation.designationName;
        const employeeDepartment = employee.department.departmentName;

        return {
          id: employeeName,
          name: employeeName,
          children: documents.documents.flatMap(
            (doc: EmployeeDocumentDetails) => {
              const cf = doc.customFields;
              const customFieldsDisplay = cf
                ? Object.entries(cf)
                    .map(([key, value]) =>
                      Array.isArray(value)
                        ? `${key}: ${value.join(", ")}`
                        : `${key}: ${value}`
                    )
                    .join(" | ")
                : null;

              return (doc.attachments?.length ? doc.attachments : [{}]).map(
                (att: any, index: number) => ({
                  id: `${doc.id}-att-${index}`,
                  employee: employeeName,
                  jobTitle: employeeDesignation,
                  document: doc.documentType.documentTypeName,
                  department: employeeDepartment,
                  status: doc.status,
                  fileName: att?.filename ?? "No File",
                  path: att?.path,
                  customFields: customFieldsDisplay,
                  recordIds: doc.recordIds ?? [doc.id],
                }),
              );
            }
          ),
        };
      });
    }

    return Object.entries(data.groupedByDocuments).map(([_, documents]) => {
      const documentName =
        documents?.[0]?.documentType?.documentTypeName ?? "Document";

      return {
        id: documentName,
        name: documentName,
        children: documents.flatMap((doc: EmployeeDocumentDetails) => {
          const cf = doc.customFields;
          const customFieldsDisplay = cf
            ? Object.entries(cf)
                .map(([key, value]) =>
                  Array.isArray(value)
                    ? `${key}: ${value.join(", ")}`
                    : `${key}: ${value}`
                )
                .join(" | ")
            : null;

          return (doc.attachments?.length ? doc.attachments : [{}]).map(
            (att: any, index: number) => ({
              id: `${doc.id}-att-${index}`,
              employee: doc.employee.contact.name,
              jobTitle: doc.employee.designation.designationName,
              document: documentName,
              department: doc.employee.department.departmentName,
              status: doc.status,
              fileName: att?.filename ?? "No File",
              path: att?.path,
              customFields: customFieldsDisplay,
              recordIds: doc.recordIds ?? [doc.id],
            }),
          );
        }),
      };
    });
  }, [data, activeTab]);

  const columns = [
    {
      label: "Employee / Document",
      field: "employee",
      render: (_v: any, row: any, ctx: any) =>
        ctx?.isChild ? row.employee : row.name,
    },
    {
      label: "Attachment",
      field: "fileName",
      render: (_v: any, row: any, ctx: any) => {
        if (row.path && row.fileName) {
          return (
            <Typography
              color="primary"
              sx={{
                ":hover": {
                  textDecorationLine: "underline",
                  cursor: "pointer",
                },
              }}
              onClick={async () => {
                const res = await getFile(row.path).unwrap();
                setPreview(true);
                setPreviewFile(res);
                setPreviewName(row.fileName || "download");
              }}
            >
              {row.fileName}
            </Typography>
          );
        } else {
          return <Typography color="text.secondary">{row.fileName}</Typography>;
        }
      },
    },
    { label: "Document", field: "document" },
    {
      label: "Custom Fields",
      field: "customFields",
      render: (_v: any, row: any) => {
        if (!row.customFields) return <Typography variant="body2" color="text.secondary">—</Typography>;
        return (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", maxWidth: 300 }}>
            {row.customFields}
          </Typography>
        );
      },
    },
    {
      label: "Actions",
      field: "actions",
      render: (_v: any, row: any, ctx: any) => {
        if (!ctx?.isChild) return null;
        return (
         <Stack direction={"row"} display={"flex"} alignItems={"center"} justifyContent={"center"} gap={1} width={"100%"}>
           <PrimaryIconButton
            icon={<DeleteIcon fontSize="small" />}
            title="Delete"
            color="error"
            variant="outlined"
            size="small"
            onClick={() => setDeleteConfirm({ open: true, recordIds: row.recordIds ?? [] })}
          />
         </Stack>
        );
      },
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ flexShrink: 0, pb: 1 }}>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <Chip
            label="Group by Employee"
            size="small"
            onClick={() => setActiveTab("byEmployee")}
            color={activeTab === "byEmployee" ? "primary" : "secondary"}
          />
          <Chip
            label="Group by Document"
            size="small"
            onClick={() => setActiveTab("byDocument")}
            color={activeTab === "byDocument" ? "primary" : "secondary"}
          />
        </Stack>
      </Box>

      <Box mt={2} sx={{ width: "100%", overflowX: "auto", overflowY: "auto", height: "40vh" }}>
        <Box sx={{ minWidth: 1100 }}>
          <CollapsibleRowsTableAtom
            columns={columns}
            rows={rows}
            ariaLabel="Verified Documents"
          />
        </Box>
      </Box>
      <ModalElement
        title="Preview"
        open={preview}
        onClose={() => {
          setPreviewFile(null);
          setPreview(false);
          setPreviewName("");
        }}
        maxWidth="md"
        height="80vh"
      >
        <Box display="flex" flexDirection="column" height="100%">
          {/* 🔽 Download Button */}
          <Box display="flex" justifyContent="flex-end" mb={1}>
            <PrimaryIconButton
              icon={<DownloadIcon />}
              title="Download"
              onClick={handleDownload}
            />
          </Box>

          {/* 🔍 Preview */}
          {previewUrl && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              sx={{ height: "70vh", width: "100%" }}
            >
              {previewFile?.type === "application/pdf" && (
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <iframe
                    src={previewUrl}
                    width="90%"
                    height="68vh"
                    style={{ border: "none", minHeight: "60vh", maxWidth: '900px', background: '#fff' }}
                  />
                </Box>
              )}

              {previewFile?.type.startsWith("image/") && (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{ maxWidth: "100%", maxHeight: "65vh" }}
                />
              )}

              {!previewFile?.type.startsWith("image/") &&
                previewFile?.type !== "application/pdf" && (
                  <Typography>No preview available</Typography>
                )}
            </Box>
          )}
        </Box>
      </ModalElement>

      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, recordIds: [] })}
        onConfirm={async () => {
          try {
            await Promise.all(deleteConfirm.recordIds.map((id) => deleteDocument(id).unwrap()));
            setSnackbar({ open: true, message: "Document deleted successfully", color: "success" });
          } catch (err: any) {
            const msg = err?.data?.message || "Failed to delete document";
            setSnackbar({ open: true, message: msg, color: "error" });
          }
          setDeleteConfirm({ open: false, recordIds: [] });
        }}
        title="Delete Document"
        confirmColor="error"
        confirmText="Delete"
        message="Are you sure you want to delete this document? This action cannot be undone."
      />

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
