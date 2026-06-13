import { Box, Typography, Divider, Tooltip } from "@mui/material";
import {
  PrimaryButton,
  PrimaryIconButton,
} from "../../../../../../../components/atom/button";
import { useState } from "react";
import CardAtom from "../../../../../../../components/atom/card/Card";
import { Snackbar } from "../../../../../../../components/atom/snackbar";
import { ModalElement } from "../../../../../../../components/dialogs/modal-element";
import { Stack } from "@mui/system";
import { Chip } from "../../../../../../../components/atom/chips";
import { useGetEmployeeInfoQuery } from "../../../../../api/people.api";
import { Download, Edit, Upload, Visibility } from "@mui/icons-material";

import DynamicModal from "./DynamicModal";
import CustomCircularProgress from "../../../../../../../components/atom/circular-progress/CircularProgress";
import {
  type EmployeeFolderType,
  useGetEmployeeDocFolderTypeByIdQuery,
  useGetEmployeeDocFolderTypesWithoutPermissionsQuery,
} from "../../../../documents/emp-documents/api/employee-doc.api";

type EmpDocumentPanelProps = {
  folder: EmployeeFolderType | null;
  id: number;
};

const EmpDocsPanel = ({ folder, id }: EmpDocumentPanelProps) => {
  console.log(folder, id);
  const { data: info } = useGetEmployeeInfoQuery();

  const [view, setView] = useState(false);
  const [openDynamicModal, setOpenDynamicModal] = useState(false);
  const [selectedDocumentForMe, setSelectedDocumentForMe] = useState<
    number | null
  >(null);
  const [customFields, setCustomFields] = useState<any>();
  const [rejected, setRejected] = useState(false);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<
    { path: string; filename: string }[]
  >([]);

  const { data: docData } = useGetEmployeeDocFolderTypeByIdQuery(
    selectedDocumentForMe!,
    {
      skip: !selectedDocumentForMe,
      refetchOnMountOrArgChange: true,
    },
  );

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const { data: documentTypesWithPermission, isLoading } =
    useGetEmployeeDocFolderTypesWithoutPermissionsQuery(
      {
        folderId: folder?.id || 0,
        employeeId: id,
      },
      { skip: !folder?.id || !info?.data },
    );

  const getPermissionMatrix = (data?: EmployeeFolderType) => {
    if (!data) return [];

    const result: { label: string; roles: string[] }[] = [];

    const permissionTypes = [
      { key: "view", label: "View" },
      { key: "download", label: "Download" },
      { key: "addUpdate", label: "Update" },
    ] as const;

    permissionTypes.forEach((perm) => {
      const roles: string[] = [];

      if (data.employeeSelfPermission?.[perm.key]) roles.push("Employee");
      if (data.reportingManagerPermission?.[perm.key])
        roles.push("Reporting Manager");
      if (data.globalAdminPermission?.[perm.key]) roles.push("Admin");

      if (roles.length > 0) {
        result.push({
          label: perm.label,
          roles,
        });
      }
    });

    return result;
  };

  const safeDocuments = Array.isArray(documentTypesWithPermission?.documents)
    ? documentTypesWithPermission.documents
    : [];

  return (
    <>
      <Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
          <Typography variant="h6">
            {folder?.documentFolderName || "Documents"}
          </Typography>
          {/* {getPermissionMatrix(folder!).map((perm) => (
            <Chip
              key={perm.label}
              label={`${perm.label} access (${perm.roles.length})`}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          ))} */}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {safeDocuments.length === 0 ? (
          <Box display="flex" justifyContent="center" mt={5}>
            <Typography variant="body1" color="textSecondary">
              No document types found
            </Typography>
          </Box>
        ) : !isLoading ? (
          <Box display="grid" gap={1}>
            {safeDocuments.map((doc: any) => {
              const rejectionReason = doc.documentDetails?.rejectedReason || 
                doc.documentDetails?.customFields?.rejectedReason || 
                doc.documentDetails?.attachments?.find((att: any) => att.status === "rejected")?.rejectedReason;
              return (
              <CardAtom
                key={doc.documentTypeId}
                sx={{
                  p: 0.5,
                  px: 1.5,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  boxShadow: "none",
                }}
              >
                <Box display="flex" justifyContent="space-between">
                  <Box display="flex" flexDirection="column">
                    <Box display="flex" gap={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {doc.documentTypeName}
                      </Typography>
                      {(doc.isMandatory ||
                        doc.documentDetails?.documentType?.isMandatory) && (
                          <Chip label="Mandatory" color="warning" size="small" />
                        )}
                    </Box>
                    {doc.isRejected && rejectionReason && (
                      <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
                        Reason: {rejectionReason}
                      </Typography>
                    )}
                  </Box>

                  <Box display="flex" gap={1} alignItems="center">
                    {doc.isUploaded &&
                      (doc.isVerified ? (
                        <Chip label="Verified" color="success" />
                      ) : doc.isRejected ? (
                        <Tooltip title={rejectionReason ? `Reason: ${rejectionReason}` : "Rejected by admin"} placement="top">
                          <span>
                            <Chip label="Rejected" color="error" />
                          </span>
                        </Tooltip>
                      ) : (
                        <Chip label="Pending verification" color="warning" />
                      ))}

                  

                    {doc.documentDetails &&
                      ((info?.data.isAdmin &&
                        folder?.globalAdminPermission.view) ||
                        (id === info?.data.employeeId &&
                          folder?.employeeSelfPermission.view)) && (
                      <PrimaryIconButton
                        icon={<Visibility />}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          console.log("`1`,", doc.documentTypeId);
                          if (!doc.documentTypeId) return;

                          setSelectedDocumentForMe(doc.documentTypeId);
                          setRejected(
                            doc.isUploaded &&
                              (doc.isRejected || !doc.isVerified),
                          );
                          setDetailsId(
                            doc.documentDetails?.customFields?.detailsId ??
                              null,
                          );
                          setCustomFields(doc?.documentDetails?.customFields);

                          setAttachments(
                            doc.documentDetails?.attachments || [],
                          );

                          setView(true);
                          setOpenDynamicModal(true);
                        }}
                      />
                    )}
                    {!doc.isVerified &&
                      ((info?.data.isAdmin &&
                        folder?.globalAdminPermission.addUpdate) ||
                        (id === info?.data.employeeId &&
                          folder?.employeeSelfPermission.addUpdate) ||
                        folder?.reportingManagerPermission.addUpdate) && (
                      <PrimaryIconButton
                         icon={doc.isUploaded ? <Edit /> : <Upload />}
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          if (!doc.documentTypeId) return;

                          setSelectedDocumentForMe(doc.documentTypeId);
                          setRejected(
                            doc.isUploaded &&
                              (doc.isRejected || !doc.isVerified),
                          );
                          setDetailsId(
                            doc.documentDetails?.customFields?.detailsId ??
                              null,
                          );
                          setCustomFields(doc?.documentDetails?.customFields);

                          setAttachments(
                            doc.documentDetails?.attachments || [],
                          );

                          setOpenDynamicModal(true);
                        }}
                      />
                    )}
                    {/* {folder?.globalAdminPermission.view && (
                      <PrimaryButton
                        size="small"
                        sx={{
                          height: "75%",
                          width: "100%",
                        }}
                        onClick={() => {
                          if (!doc.documentTypeId) return;

                          setSelectedDocumentForMe(doc.documentTypeId);
                          setRejected(
                            doc.isUploaded &&
                              (doc.isRejected || !doc.isVerified),
                          );
                          setDetailsId(
                            doc.documentDetails?.customFields?.detailsId ??
                              null,
                          );
                          setCustomFields(doc?.documentDetails?.customFields);

                          setAttachments(
                            doc.documentDetails?.attachments || [],
                          );

                          setOpenDynamicModal(true);
                        }}
                        endIcon={doc.isUploaded ? <Visibility /> : <Upload />}
                      >
                        {doc.isUploaded ? "Update" : "Upload"}
                      </PrimaryButton>
                    )} */}
                  </Box>
                </Box>
              </CardAtom>
            );
            })}
          </Box>
        ) : (
          <CustomCircularProgress />
        )}
      </Box>

      <ModalElement
        title="Manage Document"
        open={openDynamicModal}
        onClose={() => {
          setOpenDynamicModal(false);
          setView(false);
          setSelectedDocumentForMe(null);
        }}
        height={"80vh"}
        maxWidth="lg"
        contentSx={{ height: "100%" }}  
      >
        {selectedDocumentForMe && docData && (
          <DynamicModal
            folder={folder!}
            docData={docData}
            employeeId={String(id!)}
            customFields={customFields}
            attachments={attachments}
            onClose={() => {
              setOpenDynamicModal(false);
              setSelectedDocumentForMe(null);
            }}
            rejected={rejected}
            detailsId={detailsId}
            view={view}
          />
        )}
      </ModalElement>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  );
};

export default EmpDocsPanel;
