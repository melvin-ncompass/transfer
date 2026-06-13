import { useState, useMemo, useEffect } from "react";
import { Badge, Box, Stack, Typography, useTheme } from "@mui/material";

import { CollapsibleRowsTableAtom } from "../../../../../../components/tables/standard-table/CollapsibleRowsTableAtom";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import { ModalElement } from "../../../../../../components/dialogs/modal-element";
import { TextFieldElement } from "../../../../../../components/atom/text-field";
import { Chip } from "../../../../../../components/atom/chips";

import {
  useGetVerificationPendingDocumentsQuery,
  useVerifyDocMutation,
  useRejectDocumentMutation,
  useBulkRejectDocumentsMutation,
  useBulkVerifyDocumentsMutation,
  type EmployeeDocumentDetails,
} from "../../../../me/documents/api/empdoc.api";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useLazyGetAttachmentFileQuery } from "../../../../../books/transact/transactHome/api/transact.api";
import { Check, Close } from "@mui/icons-material";
import { useNotificationHighlight } from "../../../../../../hooks/useNotificationHighlight";
import { useSearchParams } from "react-router-dom";

type TabOption = "byEmployee" | "byDocument";

export function PendingVerificationPage() {
  const [searchParams] = useSearchParams();
  const activeTabDocs = Number(searchParams.get("employeeDocsTab")) || 0;

  const theme = useTheme();
  // We extract both highlightId (employee ID) and documentTypeId
  const { highlightedValues, getHighlightSx, scrollToElement } = useNotificationHighlight(["highlightId", "documentTypeId"]);

  const [activeTab, setActiveTab] = useState<TabOption>("byEmployee");
  const [preview, setPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<Blob | null>(null);
  const previewUrl = useMemo(() => {
    if (!previewFile) return null;
    return URL.createObjectURL(previewFile);
  }, [previewFile]);
  
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const { data, isLoading, refetch } = useGetVerificationPendingDocumentsQuery();

  useEffect(() => {
    if (activeTabDocs === 1) {
      refetch();
    }
  }, [activeTabDocs, refetch]);
  const [verify, { isLoading: isVerifying }] = useVerifyDocMutation();
  const [reject] = useRejectDocumentMutation();
  const [bulkVerify] = useBulkVerifyDocumentsMutation();
  const [bulkReject] = useBulkRejectDocumentsMutation();
  const [getFile] = useLazyGetAttachmentFileQuery();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });
  const [rejectModal, setRejectModal] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [bulkRejectIds, setBulkRejectIds] = useState<number[]>([]);
  const [isBulkReject, setIsBulkReject] = useState(false);

  const showSnack = (message: string, color: "success" | "error") =>
    setSnackbar({ open: true, message, color });

  // Determine which row should be expanded by default based on the active tab
  const defaultOpenRow = useMemo(() => {
    if (activeTab === "byEmployee" && highlightedValues.highlightId) {
      return `verification-row-${highlightedValues.highlightId}`;
    }
    if (activeTab === "byDocument" && highlightedValues.documentTypeId) {
      return `verification-row-${highlightedValues.documentTypeId}`;
    }
    return null;
  }, [activeTab, highlightedValues]);

  // Handle scrolling when the highlighted item is available in data
  useEffect(() => {
    if (isLoading) return;

    if (highlightedValues.documentTypeId && highlightedValues.highlightId) {
      // Scroll to the specific child row (document)
      scrollToElement(`child-doc-${highlightedValues.documentTypeId}-emp-${highlightedValues.highlightId}`, "center", 400);
    } else if (defaultOpenRow) {
      // Fallback to scrolling to the parent row
      scrollToElement(defaultOpenRow, "center", 300);
    }
  }, [highlightedValues, defaultOpenRow, isLoading, scrollToElement]);

  /* ================= ROWS ================= */

  const rows = useMemo(() => {
    if (!data) return [];

    if (activeTab === "byEmployee") {
      return Object.entries(data.groupedByEmployee).map(([empIdKey, emp]: [string, any]) => {
        const empId = parseInt(empIdKey);
        const attachmentRows = emp.documents.flatMap(
          (doc: EmployeeDocumentDetails) =>
            (doc.attachments ?? []).map((att: any) => ({
              id: `child-doc-${doc.documentType?.id}-emp-${empId}`,
              detailId: att.detailsId,
              employeeId: empId,
              documentTypeId: doc.documentType?.id,
              employee: emp.employeeName,
              jobTitle: emp.employeeDesignation,
              document: doc.documentType?.documentTypeName,
              department: emp.employeeDepartment,
              fileName: att.filename,
              path: att.path,
              status: doc.status,
            })),
        );

        const customFieldRows = emp.documents.flatMap(
          (doc: EmployeeDocumentDetails) => {
            const cf = doc.customFields?.value;
            if (!cf) return [];
            const fieldValues: string[] = [];
            Object.entries(cf).forEach(([key, value]) => {
              if (
                !["value", "status", "detailId", "rejectedReason"].includes(key)
              ) {
                fieldValues.push(`${key}: ${value}`);
              }
            });
            return [
              {
                id: `child-doc-${doc.documentType?.id}-emp-${empId}-cf`,
                detailId: doc.customFields?.detailsId,
                employeeId: empId,
                documentTypeId: doc.documentType?.id,
                employee: emp.employeeName,
                jobTitle: emp.employeeDesignation,
                document: doc.documentType?.documentTypeName,
                department: emp.employeeDepartment,
                fileName: fieldValues.join(" | "),
                status: cf.status,
              },
            ];
          },
        );

        return {
          id: `verification-row-${empId}`,
          name: emp.employeeName,
          employeeId: empId,
          children: [...attachmentRows, ...customFieldRows],
        };
      }).filter((group) => group.children && group.children.length > 0);
    }
    
    // Group by document
    return Object.entries(data.groupedByDocuments).map(([docId, documents]) => {
      const docName =
        documents?.[0]?.documentType?.documentTypeName ?? "Document";

      const attachmentRows = documents.flatMap((doc: any) =>
        (doc.attachments ?? []).map((att: any) => ({
          id: `child-doc-${docId}-emp-${doc.employee.id}`,
          detailId: att.detailsId,
          employeeId: doc.employee.id,
          documentTypeId: parseInt(docId),
          employee: doc.employee.contact.name,
          jobTitle: doc.employee.designation.designationName,
          document: docName,
          department: doc.employee.department.departmentName,
          fileName: att.filename,
          path: att.path,
          status: doc.status,
        })),
      );

      const customFieldRows = documents.flatMap(
        (doc: EmployeeDocumentDetails) => {
          const cf = doc.customFields?.value;
          if (!cf) return [];
          const fieldValues: string[] = [];
          Object.entries(cf).forEach(([key, value]) => {
            if (
              !["value", "status", "detailId", "rejectedReason"].includes(key)
            ) {
              fieldValues.push(`${key}: ${value}`);
            }
          });
          return [
            {
              id: `child-doc-${docId}-emp-${doc.employee.id}-cf`,
              detailId: doc.customFields?.detailsId,
              employeeId: doc.employee.id,
              documentTypeId: parseInt(docId),
              employee: doc.employee.contact.name,
              jobTitle: doc.employee.designation.designationName,
              document: docName,
              department: doc.employee.department.departmentName,
              fileName: fieldValues.join(" | "),
              status: cf.status,
            },
          ];
        },
      );

      return {
        id: `verification-row-${docId}`,
        name: docName,
        documentTypeId: parseInt(docId),
        children: [...attachmentRows, ...customFieldRows],
      };
    }).filter((group) => group.children && group.children.length > 0);
  }, [data, activeTab]);

  /* ================= COLUMNS ================= */

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
                  cursor: "pointer"
                }
              }}
              onClick={async () => {
                const res = await getFile(row.path).unwrap();
                setPreview(true);
                setPreviewFile(res);
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
      label: "Actions",
      field: "actions",
      align: "right",
      render: (_v: any, row: any, ctx: any) =>
        ctx?.isChild ? (
          <Stack direction="row" gap={1} justifyContent="flex-end">
            <PrimaryIconButton
              icon={<Check sx={{ width: 18 }} />}
              title="Verify"
              color="success"
              variant="outlined"
              onClick={async () => {
                try {
                  await verify({ id: row.detailId }).unwrap();
                  showSnack("Document verified successfully!", "success");
                } catch {
                  showSnack("Failed to verify document", "error");
                }
              }}
            />
            <PrimaryIconButton
              icon={<Close sx={{ width: 18 }} />}
              title="Reject"
              color="error"
              variant="outlined"
              onClick={() => {
                setSelectedDocId(row.detailId);
                setIsBulkReject(false);
                setRejectModal(true);
              }}
            />
          </Stack>
        ) : null,
    },
  ];

  const getRowSx = (row: any) => {
    // If a specific document is targeted, don't highlight the parent row
    if (highlightedValues.documentTypeId) return {};

    // Otherwise, highlight the parent group based on employee or document ID
    if (activeTab === "byEmployee") {
      return getHighlightSx("highlightId", row.employeeId, theme);
    }
    return getHighlightSx("documentTypeId", row.documentTypeId, theme);
  };

  const getChildRowSx = (row: any) => {
    // If we're targeting a specific document for a specific employee
    if (highlightedValues.documentTypeId && highlightedValues.highlightId) {
      if (
        String(row.documentTypeId) === highlightedValues.documentTypeId &&
        String(row.employeeId) === highlightedValues.highlightId
      ) {
        // Force the highlight return using the matched documentTypeId
        return getHighlightSx("documentTypeId", row.documentTypeId, theme);
      }
      return {};
    }

    // Fallback: Highlight all children in the group
    return getHighlightSx("highlightId", row.employeeId, theme);
  };

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

      <Box mt={2} sx={{ flex: 1, minHeight: 0, width: "100%", overflowX: "auto" }}>
        <CollapsibleRowsTableAtom
          columns={columns}
          rows={rows}
          getRowSx={getRowSx}
          getChildRowSx={getChildRowSx}
          defaultOpenRow={defaultOpenRow}
          renderParentActions={(group) => (
            <Stack direction="row" gap={1.5} justifyContent="flex-end">
              <Box sx={{ mt: 0.2 }}>
                <Badge
                  badgeContent={group.children?.length ?? 0}
                  color="success"
                  overlap="circular"
                  max={99}
                >
                  <PrimaryIconButton
                    icon={<Check sx={{ width: 18 }} />}
                    title={`Verify All (${group.children?.length ?? 0})`}
                    color="success"
                    onClick={async () => {
                      try {
                        const ids = group.children.map((item: any) => item.detailId);
                        await bulkVerify({ detailsIds: ids }).unwrap();
                        showSnack("All documents verified!", "success");
                      } catch {
                        showSnack("Failed to verify documents", "error");
                      }
                    }}
                  />
                </Badge>
              </Box>

              <Box sx={{ mt: 0.2 }}>
                <Badge
                  badgeContent={group.children?.length ?? 0}
                  color="error"
                  overlap="circular"
                  max={99}
                >
                  <PrimaryIconButton
                    icon={<Close sx={{ width: 18 }} />}
                    title={`Reject All (${group.children?.length ?? 0})`}
                    color="error"
                    onClick={() => {
                      const ids = group.children.map((item: any) => item.detailId);
                      setBulkRejectIds(ids);
                      setIsBulkReject(true);
                      setRejectModal(true);
                    }}
                  />
                </Badge>
              </Box>
            </Stack>
          )}
          ariaLabel="Pending Verification Documents"
        />
      </Box>

      {/* ================= REJECT MODAL ================= */}
      <ModalElement
        open={rejectModal}
        title="Confirm Reject"
        onClose={() => {
          setRejectModal(false);
          setReason("");
          setSelectedDocId(null);
          setBulkRejectIds([]);
          setIsBulkReject(false);
        }}
      >
        <TextFieldElement
          fullWidth
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <Box display="flex" justifyContent="end" mt={2}>
          <PrimaryButton
            disabled={reason.trim() === ""}
            onClick={async () => {
              try {
                if (isBulkReject) {
                  await bulkReject({
                    detailsIds: bulkRejectIds,
                    rejectedReason: reason,
                  }).unwrap();
                  showSnack("Documents rejected successfully!", "success");
                } else if (selectedDocId) {
                  await reject({ id: selectedDocId, reason }).unwrap();
                  showSnack("Document rejected successfully!", "success");
                }
                // Reset and close only on success
                setRejectModal(false);
                setReason("");
                setSelectedDocId(null);
                setBulkRejectIds([]);
                setIsBulkReject(false);
              } catch {
                showSnack("Failed to reject document", "error");
              }
            }}
          >
            Reject
          </PrimaryButton>
        </Box>
      </ModalElement>

      {/* ================= SNACKBAR ================= */}
      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
      <ModalElement
        title="Preview"
        open={preview}
        onClose={() => {
          setPreviewFile(null);
          setPreview(false);
        }}
        maxWidth="md"
        height="80vh"
      >
        {previewUrl && (
          <Box display={"flex"} alignItems={"center"} justifyContent={"center"} sx={{ height: "70vh", width: "100%" }}>
            {/* PDF */}
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

            {/* Image */}
            {previewFile?.type.startsWith("image/") && (
              <img
                src={previewUrl}
                alt="preview"
                style={{ maxWidth: "100%", maxHeight: "65vh" }}
              />
            )}

            {/* Fallback */}
            {!previewFile?.type.startsWith("image/") &&
              previewFile?.type !== "application/pdf" && (
                <Typography>No preview available</Typography>
              )}
          </Box>
        )}
      </ModalElement>
    </Box>
  );
}
