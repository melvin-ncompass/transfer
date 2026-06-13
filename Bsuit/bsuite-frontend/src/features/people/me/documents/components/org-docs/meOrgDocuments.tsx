import { Box, Typography, useTheme, Skeleton, List, ListItemButton, ListItemText, alpha } from "@mui/material";
import { useEffect, useState } from "react";
import { Snackbar } from "../../../../../../components/atom/snackbar";
import { useGetMeOrganizationDocumentsQuery } from '../../api/orgDocs.api';
import { MeOrgDocumentsPanel } from "./MeOrgDocumentPanel";
import { useGetEmployeeInfoQuery } from "../../../../api/people.api";
import { useNotificationHighlight } from "../../../../../../hooks/useNotificationHighlight";
import { Tooltip } from "../../../../../../components/atom/tooltip";


export const MeOrgDocumentLayout = () => {

  const theme = useTheme();
  
  // Handle notification deep links and highlights
  const { highlightedValues, getHighlightSx, scrollToElement } = useNotificationHighlight(["folderId", "documentId"]);

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const { data: employeeInfo } = useGetEmployeeInfoQuery(undefined);
  const empID = employeeInfo?.data?.employeeId;

  const { data: folders = [], isLoading, isFetching } = useGetMeOrganizationDocumentsQuery(empID ?? undefined, {refetchOnMountOrArgChange: true});

  useEffect(() => {
    if (isLoading || isFetching || !folders.length) return;

    if (highlightedValues.folderId) {
      const fId = Number(highlightedValues.folderId);
      if (folders.some(f => f.id === fId)) {
        setSelectedFolderId(fId);
        scrollToElement(`me-org-folder-${fId}`, "nearest", 200);
        return;
      }
    }

    if (!selectedFolderId || !folders.some(f => f.id === selectedFolderId)) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, isLoading, isFetching, highlightedValues.folderId, scrollToElement]);

  const selectedIndex = folders.findIndex(
    (f) => f.id === selectedFolderId
  );

  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const selectedFolder = folders[safeIndex] ?? null;

  const handleChangeIndex = (index: number) => {
    const folder = folders[index];
    if (folder) {
      setSelectedFolderId(folder.id);
    }
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          height: "51vh",
          overflow: "hidden",
          pb: 0
        }}
      >
        <Box
          sx={{
            flex: "0 0 18%",
            borderRight: `1px solid ${theme.palette.divider}`,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden", 
            width: 0,
          }}
        >
          <Box
            sx={{
              px: 1,
              py: 0.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="subtitle2">
              Folders
            </Typography>
          </Box>


          <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
            {isLoading ? (
              <Box p={2}>
                <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} />
              </Box>
            ) : (
              <List className="folder-list" sx={{
                borderRadius: 1,
                flex: 1,
                minHeight: 0,
                pr: 1
              }}>
                {!folders || folders.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No folders available
                    </Typography>
                  </Box>
                ) : (
                  folders.map((folder, index) => {
                    const isSelected = safeIndex === index;
                    return (
                      <Tooltip title={folder.folderName} placement="top-start" arrow>
                        
                      <ListItemButton
                        key={folder.id}
                        id={`me-org-folder-${folder.id}`}
                        selected={isSelected}
                        onClick={() => handleChangeIndex(index)}
                        sx={{
                          borderRadius: 1,
                          mb: 0.5,
                          pl: 3,
                          py: 0.25,
                          minWidth: 0, 
                          overflow: 'hidden',
                          minHeight: 20,
                          bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.16) : "transparent",
                          color: isSelected ? "primary.main" : "text.primary",
                          "&:hover": {
                            bgcolor: isSelected
                              ? alpha(theme.palette.primary.main, 0.24)
                              : "action.hover",
                          },
                          // Highlight if folderId matches
                          ...getHighlightSx("folderId", folder.id, theme),
                        }}
                      >
                        <ListItemText
                          primary={folder.folderName}
                          slotProps={{
                            primary: {
                              noWrap: true,
                              variant: "body2",
                                sx: {
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }
                            }
                          }}
                          sx={{
                            overflow: "hidden", minWidth: 0 
                          }}
                        />
                      </ListItemButton>
                      </Tooltip>
                    );
                  }))}
              </List>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            pl: 3,
          }}
        >
          <MeOrgDocumentsPanel
            folder={selectedFolder}
            highlightDocumentId={highlightedValues.documentId ? Number(highlightedValues.documentId) : null}
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
};
