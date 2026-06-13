import { Box, Typography, CircularProgress } from "@mui/material";
import { PrimaryButton, PrimaryIconButton } from "../../../../../components/atom/button";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Stack } from "@mui/system";
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ModalElement } from "../../../../../components/dialogs/modal-element";

import {
    useUpdateOrganizationDocumentAcknowledgementMutation,
    useLazyGetOrganizationDocumentViewQuery,
    useGetOrganizationDocumentByIdQuery,
    type OrganizationDocumentType,
    useLazyGetOrganizationDocumentDownloadQuery
} from "../../../org/documents/org-documents/api/organization.api";
import type { Document } from "../../../../company/api/company.api";
import { useGetEmployeeInfoQuery } from "../../../api/people.api";
import { useGetPendingDocumentsQuery } from "../../../../company/api/company.api";
import { Tooltip } from "../../../../../components/atom/tooltip";
import { useSnackbar } from "../../../../../context/SnackbarContext";
import CardAtom from "../../../../../components/atom/card/Card";


export default function AcknowledgeDocumentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const { data: empInfo } = useGetEmployeeInfoQuery();
    const isEmployee = empInfo?.data?.isEmployee;
    const isAdmin = empInfo?.data?.isAdmin;

    // admin outside company
    const isAdminOutsideCompany = isAdmin && !isEmployee;

    const returnState = location.state as { returnTab?: number; returnMainTab?: number; returnSubTab?: number }

    const { showSnackbar } = useSnackbar();

    // pending & block portal mode
    const isPendingMode = location.pathname.includes("pending");

    // const isMeMode = location.pathname.includes("/me/");

    const [preview, setPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewFile, setPreviewFile] = useState<{ type: string } | null>(null);

    const empID = empInfo?.data?.employeeId;

    const [updateOrganizationDocumentAcknowledgement] = useUpdateOrganizationDocumentAcknowledgementMutation();
    const [getOrganizationDocumentView] = useLazyGetOrganizationDocumentViewQuery();
    const [getOrganizationDocumentDownload] = useLazyGetOrganizationDocumentDownloadQuery();

    // For specific document
    const { data: fetchedDocument, isLoading: isDocumentLoading, refetch: refetchDocument } = useGetOrganizationDocumentByIdQuery(
        Number(id),
        { skip: isPendingMode || !id }
    );

    // For pending docs block portal
    const { data: pendingData, isLoading: isPendingLoading, refetch: refetchPending } = useGetPendingDocumentsQuery(empID!, {
        skip: !isPendingMode || !empID,
    });

    const activeData = isPendingMode ? pendingData?.data : fetchedDocument;

    // Type guard
    const isDocumentArray = (
        data: OrganizationDocumentType | Document[] | null | undefined
    ): data is Document[] => Array.isArray(data);

    const statuses: string[] = isDocumentArray(activeData)
        ? activeData.map((item) => item?.acknowledgementStatus)
        : [(activeData as OrganizationDocumentType)?.acknowledgementStatus ?? "not_acknowledged"];

    const allAcknowledged = statuses.every((s) => s === "acknowledged");
    const hasNotAcknowledged = statuses.some((s) => s === "not_acknowledged");

    const showPreview = async (documentId: number, path: string) => {
        try {
            const blob = await getOrganizationDocumentView({ id: documentId, empID: empID!, path }).unwrap();
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setPreviewFile({ type: blob.type });
            setPreview(true);
        } catch (error: any) {
            showSnackbar(error?.data?.message || "Failed to load document preview.", "error");
        } finally {
            if (isPendingMode) await refetchPending();
            else refetchDocument();
        }
    };

    const handlePreviewClose = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewFile(null);
        setPreview(false);
    };

    const handleDownload = async (documentId: number, path: string, filename: string) => {
        try {
            const blob = await getOrganizationDocumentDownload({ id: documentId, path }).unwrap();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");

            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showSnackbar("Document downloaded successfully", "success");
        } catch (error: any) {
            showSnackbar(error?.data?.message ?? error?.error ?? error?.message ?? "Failed to download document.", "error");
        }
    };

    const hasStatusKey = isDocumentArray(activeData)
        ? activeData.some((item) => item?.acknowledgementStatus !== undefined)
        : (activeData as OrganizationDocumentType)?.acknowledgementStatus !== undefined;

    const handleAcknowledge = async () => {
        if (!activeData) return;

        try {
            const ids = isDocumentArray(activeData)
                ? activeData.map((item) => item?.id)
                : [activeData.id];

            await Promise.all(
                ids.map((docId) => updateOrganizationDocumentAcknowledgement({ id: docId, empID: empID! }).unwrap())
            );

            showSnackbar("Document acknowledged successfully", "success");

            if (isPendingMode) {
                await refetchPending();
                navigate("/people/home?tab=1", { replace: true });
            } else {
                refetchDocument();
                handleGoBack();
            }

        } catch (error: any) {
            showSnackbar(error?.data?.message ?? error?.error ?? error?.message ?? "Failed to acknowledge document.", "error");
        }
    };

const handleGoBack = () => {
  const targetTab = returnState?.returnTab;
  const targetMainTab = returnState?.returnMainTab;
  const targetSubTab = returnState?.returnSubTab;

  if (targetTab === 3) {
    navigate(
      `/people/home?tab=3&mainTab=${targetMainTab != null ? targetMainTab : 1}&subtab=${
        targetSubTab != null ? targetSubTab : 1
      }`,
      { replace: true },
    );
    return;
  }

  if (targetTab === 4) {
    navigate(
      `/people/home?tab=4&mainTab=1&documentsSubTab=${
        targetSubTab != null ? targetSubTab : 2
      }`,
      { replace: true },
    );
    return;
  }
}


    if (isDocumentLoading || isPendingLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
            </Box>
        );
    }

    if (!activeData || (isDocumentArray(activeData) && activeData.length === 0)) {
        return (
            <CardAtom sx={{
                height:"100%",
                display:"flex",
                justifyContent:"center",
                alignItems:"center",
                padding:2
            }}>
            <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center'>
                <Typography variant="h6" color="textSecondary">No Documents Found</Typography>
                {!isPendingMode && (
                    <Box mt={2}>
                        <PrimaryButton onClick={handleGoBack} size='small'><ArrowBackIcon fontSize="small"/>{" "}Back</PrimaryButton>
                    </Box>
                )}
            </Box>
            </CardAtom>
        );
    }

    const attachments = isDocumentArray(activeData)
        ? activeData.flatMap((item: Document) =>
            item?.attachments.map((att: any) => ({ ...att, documentId: item.id }))
        )
        : activeData?.attachments?.map((att: any) => ({ ...att, documentId: activeData.id })) ?? [];

    const downloadAccess = isDocumentArray(activeData)
        ? activeData.some((item) => item?.downloadAccess)
        : activeData?.downloadAccess ?? false;

    const acknowledgementRequired = isDocumentArray(activeData)
        ? activeData.some((item) => item?.acknowledgementRequired)
        : activeData?.acknowledgementRequired ?? false;

    const pageTitle = isPendingMode ? "Acknowledge Pending Documents" : (activeData as any)?.name || "Acknowledge Document";

    return (
        <CardAtom
            elevation={2}
            sx={{
                p: 1,
                height: "100%",
                overflow: "auto",
                display: "flex",
                flexDirection: "column"
            }}
        >
            <Box p={3} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <Box display="flex" alignItems="center" mb={3} gap={1}>
                    {!isPendingMode && (
                        <PrimaryIconButton
                            onClick={handleGoBack}
                            size="small"
                            variant="outlined"
                            sx={{
                                "&:hover": { bgcolor: "grey.100" },
                            }}
                            icon={<ArrowBackIcon />}
                        />
                    )}
                    <Typography variant="h6" fontWeight="bold">
                        {pageTitle}
                    </Typography>
                    {allAcknowledged 
                        ?      
                        <Box display="flex" alignItems="center" gap={1}>
                            <Tooltip title="Acknowledged" placement="top">
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <CheckCircleOutlineIcon color="success"/>
                                </Box>
                            </Tooltip>
                        </Box> 
                        : null
                    }
                </Box>
                <Stack spacing={2} mb={2}>
                    {isPendingMode ? (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            You have pending documents that require your acknowledgement before you can access the portal.
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Attachments
                        </Typography>
                    )}

                    <Box>
                        {attachments.length > 0 ? attachments.map((attachment: any, idx: number) => (
                            <Box
                                key={`${attachment.filename}-${idx}`}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                p={1.5}
                                mb={1.5}
                                gap={1}
                                sx={{ border: "1px solid", borderColor: "divider", borderRadius: '8px' }}
                            >
                                <Typography variant="subtitle2" fontWeight="medium">
                                    {attachment.filename}
                                </Typography>

                                <Box display="flex">
                                    <PrimaryIconButton
                                        icon={<VisibilityIcon fontSize="medium" />}
                                        variant="outlined"
                                        size="small"
                                        title="View"
                                        onClick={() => showPreview(attachment.documentId, attachment.path)}
                                    />
                                    {downloadAccess && (
                                        <PrimaryIconButton
                                            icon={<FileDownloadOutlinedIcon fontSize="medium" />}
                                            variant="outlined"
                                            size="small"
                                            title="Save"
                                            onClick={() => handleDownload(attachment.documentId, attachment.path, attachment.filename)}
                                        />
                                    )}
                                </Box>
                            </Box>
                        )) : (
                            <Typography>No attachments found.</Typography>
                        )}
                    </Box>
                </Stack>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 'auto' }}>
                    {acknowledgementRequired && !isAdminOutsideCompany ? (
                        allAcknowledged ? (
                            null
                        ) : (
                            <Tooltip 
                                title={hasNotAcknowledged 
                                    ? 'Preview document before acknowledging' 
                                    : 'Acknowledge document'} 
                                placement="top"
                            >
                                <PrimaryButton 
                                    color="primary"
                                    onClick={handleAcknowledge} 
                                    disabled={hasNotAcknowledged}
                                    sx={{ visibility: hasStatusKey ? 'visible' : 'hidden'}}
                                >
                                    Acknowledge
                                </PrimaryButton>
                            </Tooltip>
                        
                        )
                    ) : (
                        null
                    )}
                </Box>

                {/* Preview Modal */}
                <ModalElement
                    title="Preview"
                    open={preview}
                    onClose={handlePreviewClose}
                    maxWidth="md"
                    height={550}
                    contentSx={{}}
                    // height={800}
                    sx={{
                        "& .MuiDialog-paper": { width: { xs: "90vw" }, margin: 2 },
                        // height: "80vh"
                    }}
                >
                    <Box display="flex" flexDirection="column" height="100%">
                        {previewUrl && (
                            <Box display="flex" alignItems="center" justifyContent="center" flex={1} p={1}>
                                {previewFile?.type === "application/pdf" && (
                                    <iframe src={previewUrl} width="100%" height="100%" style={{ border: "none", minHeight: "60vh"}} title="Preview" />
                                )}
                                {previewFile?.type.startsWith("image/") && (
                                    <img src={previewUrl} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                )}
                                {!previewFile?.type.startsWith("image/") && previewFile?.type !== "application/pdf" && (
                                    <Typography>No preview available</Typography>
                                )}
                            </Box>
                        )}
                    </Box>
                </ModalElement>
            </Box>
        </CardAtom>
    );
}
