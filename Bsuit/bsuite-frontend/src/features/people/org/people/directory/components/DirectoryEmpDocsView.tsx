import {
  Typography,
  Skeleton,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
} from "@mui/material";
import { alpha, Box, useTheme } from "@mui/system";
import { useState, useEffect } from "react";
import EmpDocsPanel from "./empDocs/directoryempdocspanel";
import { useGetEmployeeInfoQuery } from "../../../../api/people.api";
import { useGetEmployeeDocFoldersForMeQuery } from "../../../documents/emp-documents/api/employee-doc.api";

function DirectoryEmpDocsView({id}:{id:number}) {
  const theme = useTheme();
  const { data: info } = useGetEmployeeInfoQuery();

  // ─── API hooks ───
  const {
    data: folders = [],
    isLoading,
    isFetching,
  } = useGetEmployeeDocFoldersForMeQuery(id, {
    skip: !id
  });

  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    color: "success" as "success" | "error",
  });

  const selectedFolder =
    folders.find((folder) => folder.id === selectedFolderId) || null;

  useEffect(() => {
    if (folders.length > 0 && !selectedFolderId) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, selectedFolderId]);

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
              // py: 0.5,
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
          <EmpDocsPanel folder={selectedFolder ?? null} id={id} />
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

export default DirectoryEmpDocsView;
