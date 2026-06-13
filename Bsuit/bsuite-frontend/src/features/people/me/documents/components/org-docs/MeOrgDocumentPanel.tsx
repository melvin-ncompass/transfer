import { Box, Typography, Divider, useTheme, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { formatDateShort } from "../../../../../../utils/numberFormatter";
import { useNavigate } from "react-router-dom";

import {
  useUpdateOrganizationDocumentAcknowledgementMutation,
} from "../../../../org/documents/org-documents/api/organization.api";
import { useGetEmployeeInfoQuery } from "../../../../api/people.api";
import type { EmployeeFolder } from "../../api/orgDocs.api";
import CardAtom from "../../../../../../components/atom/card/Card";
import { PrimaryButton, PrimaryIconButton } from "../../../../../../components/atom/button";
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Tooltip } from "../../../../../../components/atom/tooltip";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { ArrowForward } from "@mui/icons-material";
import { Chip } from "../../../../../../components/atom/chips";
import { useNotificationHighlight } from "../../../../../../hooks/useNotificationHighlight";


interface DocumentPanelProps {
  folder: EmployeeFolder | null;
  onEditFolder?: (folder: EmployeeFolder) => void;
  onDeleteFolder?: (folderId: number) => void;
  highlightDocumentId?: number | null;
}

export const MeOrgDocumentsPanel = ({ folder, highlightDocumentId = null }: DocumentPanelProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Use the highlight hook for card highlights and scrolling
  const { getHighlightSx, scrollToElement } = useNotificationHighlight(["documentId"]);

  const { data: employeeInfo } = useGetEmployeeInfoQuery();
  const empID = employeeInfo?.data?.employeeId;
  const [updateOrganizationDocumentAcknowledgement] = useUpdateOrganizationDocumentAcknowledgementMutation();

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  function formatBytes(bytes: number, decimals = 2) {
    if (bytes == null) return '-';
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  const documents = folder?.documentTypes || [];

  // Scroll to document if highlighted
  useEffect(() => {
    if (highlightDocumentId && documents.length > 0) {
      if (documents.some(d => d.id === highlightDocumentId)) {
        scrollToElement(`me-org-doc-card-${highlightDocumentId}`, "center", 400);
      }
    }
  }, [highlightDocumentId, documents, scrollToElement]);

  const handleAcknowledge = async (documentId: number) => {
    try {
      if (empID) {
        await updateOrganizationDocumentAcknowledgement({ id: documentId, empID }).unwrap();
        setSnackbar({ open: true, message: "Document acknowledged successfully", color: "success" });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.data?.message || "Failed to acknowledge document", color: "error" });
    }
  };

  if (!folder) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary">Select a folder to view documents</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: '100%',
            minWidth: 0,
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            gap={0.7}
            alignItems='flex-start'
            sx={{ width: '100%', minWidth: 0 }}
          >
            <Tooltip title={folder.folderName} placement="top-start" arrow>
              <Typography variant="h6" sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                // maxWidth: "60%",
                width: "fit-content",
              }}
              >
                {folder.folderName}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="textSecondary">{folder.description}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Box
          sx={{
            overflowX: "hidden",
            overflowY: "auto",
            flex: 1,
          }}
        >
          <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} pb={2}>
            {documents.length > 0 ? documents.map((row) => (
              <CardAtom
                variant="secondary"
                key={row.id}
                id={`me-org-doc-card-${row.id}`}
                elevation={1}
                sx={{
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  // Apply pulse highlight if matching
                  ...getHighlightSx("documentId", row.id, theme),
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box sx={{ maxWidth: '50%', minWidth: 0, mr: 2 }}>
                    <Tooltip title={row.name} placement="top-start">
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        noWrap
                      >
                        {row.name}
                      </Typography>
                    </Tooltip>

                    <Tooltip title={row.description}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                        sx={{ mt: 0.5 }}
                      >
                        {row.description || ''}
                      </Typography>
                    </Tooltip>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems='center' justifyContent='center'>
                    {row.acknowledgementStatus === 'acknowledged' && (
                      <Tooltip title="Acknowledged" placement="top">
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <CheckCircleOutlineIcon color="success" />
                        </Box>
                      </Tooltip>
                    )}
                    {(row.acknowledgementStatus === 'not_acknowledged' ||
                      row.acknowledgementStatus === 'viewed_not_acknowledged') && (
                        <Tooltip title="Acknowledgement required" placement="top">
                          <Box display="flex" alignItems="center" justifyContent="center">
                            <Chip
                              color="error"
                              label="Acknowledgement required"
                            />
                          </Box>
                        </Tooltip>
                      )}
                    <PrimaryIconButton
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => {
                        navigate(`/people/me/document/acknowledge/${row.id}`, {
                          state: { returnTab: 3, returnMainTab: 1, returnSubTab: 1 }
                        });
                      }}
                      icon={<ArrowForward />}
                    />

                  </Stack>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mt="auto">
                  <Stack direction="row" spacing={3} justifyContent='space-between' width='100%'>
                    <Box display='flex' flexDirection='row' gap={2}>

                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Size
                        </Typography>
                        <Typography variant="body2">
                          {formatBytes(row.totalAttachmentSize)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Last Updated
                        </Typography>
                        <Typography variant="body2">
                          {formatDateShort(row.updatedAt)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      {row.acknowledgementStatus === 'viewed_not_acknowledged' && row.acknowledgementRequired && (
                        <PrimaryButton
                          size="small"
                          onClick={() => handleAcknowledge(row.id)}
                        >
                          Acknowledge
                        </PrimaryButton>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </CardAtom>
            )) : (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="body2" color="text.secondary">No documents found in this folder.</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {snackbar.open && (
        <Snackbar
          message={snackbar.message}
          color={snackbar.color}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  )
};
