import {
  Typography,
  Skeleton,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
} from "@mui/material";
import { alpha, Box, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import { useGetEmployeeDocFoldersForMeQuery } from "../../../../org/documents/emp-documents/api/employee-doc.api";
import EmpDocsPanel from "./empdocspanel";
import { useGetEmployeeInfoQuery } from "../../../../api/people.api";
import { useNotificationHighlight } from "../../../../../../hooks/useNotificationHighlight";

function EmpDocsView() {
  const theme = useTheme();
  
  // Use the central highlight hook
  const { highlightedValues, getHighlightSx, scrollToElement } = useNotificationHighlight(["folderId", "documentTypeId"]);

  const { data: info } = useGetEmployeeInfoQuery();

  // ─── API hooks ───
  const {
    data: folders = [],
    isLoading,
    isFetching,
  } = useGetEmployeeDocFoldersForMeQuery(info?.data?.employeeId!, {
    skip: !info?.data.employeeId,
  });

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [highlightDocumentPulse, setHighlightDocumentPulse] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const selectedFolder =
    folders.find((folder) => folder.id === selectedFolderId) || null;

  // Initial auto-select
  useEffect(() => {
    if (folders.length > 0 && !selectedFolderId && !highlightedValues.folderId) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, selectedFolderId, highlightedValues.folderId]);

  // Handle deep linking from highlight hook
  useEffect(() => {
    if (isLoading || isFetching || folders.length === 0) return;

    if (highlightedValues.folderId) {
      const folderId = Number(highlightedValues.folderId);
      if (Number.isFinite(folderId) && folders.some(f => f.id === folderId)) {
        setSelectedFolderId(folderId);
        scrollToElement(`emp-doc-folder-${folderId}`, "nearest", 200);

        // If there's also a document type ID, trigger a pulse refresh for the child component
        if (highlightedValues.documentTypeId) {
           setHighlightDocumentPulse(prev => prev + 1);
        }
      }
    }
  }, [highlightedValues.folderId, highlightedValues.documentTypeId, folders, isLoading, isFetching, scrollToElement]);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          height: "51vh",
          overflow: "hidden",
          pb: 0,
        }}
      >
        <Box
          sx={{
            flex: "0 0 20%",
            borderRight: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          {/* Folder Panel */}
          <Box
            sx={{
              px: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2">Folders</Typography>
          </Box>

          <Box sx={{ flex: 1, overflowY: "scroll", maxHeight: "300px" }}>
            {isLoading || isFetching ? (
              <Box
                sx={{
                  px: 1,
                  pt: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} height={48} />
                ))}
              </Box>
            ) : (
              <List
                className="folder-list"
                sx={{
                  borderRadius: 1,
                  flex: 1,
                  minHeight: 0,
                  pr: 1,
                }}
              >
                {!folders || folders.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No folders available
                    </Typography>
                  </Box>
                ) : (
                  folders.map((folder) => {
                    const isSelected = selectedFolderId === folder.id;
                    return (
                      <ListItemButton
                        key={folder.id}
                        id={`emp-doc-folder-${folder.id}`}
                        selected={isSelected}
                        onClick={() => setSelectedFolderId(folder.id)}
                        sx={{
                          px: 1,
                          py: 0,
                          borderRadius: 1,
                          mb: 0.5,
                          bgcolor: isSelected
                            ? alpha(theme.palette.primary.main, 0.16)
                            : "transparent",
                          color: isSelected ? "primary.main" : "text.primary",
                          "&:hover": {
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, 0.24)
                              : "action.hover",
                          },
                          // Apply dynamic highlight pulse
                          ...getHighlightSx("folderId", folder.id, theme),
                        }}
                      >
                        <ListItemText
                          primary={folder.documentFolderName}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItemButton>
                    );
                  })
                )}
              </List>
            )}
          </Box>
        </Box>

        {/* Document Panel */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pl: 3,
          }}
        >
          <EmpDocsPanel
            folder={selectedFolder ?? null}
            highlightDocumentTypeId={highlightedValues.documentTypeId ? Number(highlightedValues.documentTypeId) : null}
            highlightDocumentPulse={highlightDocumentPulse}
          />
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
  );
}

export default EmpDocsView;
