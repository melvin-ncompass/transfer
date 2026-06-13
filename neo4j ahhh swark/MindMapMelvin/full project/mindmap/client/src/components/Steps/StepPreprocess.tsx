import React from "react";
import {
  Card,
  Typography,
  Divider,
  Box,
  CardContent,
} from "@mui/material";
import StepLayout from "../Atoms/StepLayout";

interface FileItem {
  path: string;
  relativePath: string;
  size: number;
  estimatedTokens: number;
}

interface Props {
  loading: boolean;
  preprocessMessage: string | null;
  directoryStructure: string | null;
  filesList: FileItem[] | null;
  onPreprocess: () => void;
  onNext: () => void;
}

const StepPreprocess: React.FC<Props> = ({
  loading,
  preprocessMessage,
  directoryStructure,
  filesList,
  onPreprocess,
  onNext,
}) => {
  const hasResponse = !!preprocessMessage;

  const contentBoxStyle = {
    bgcolor: "#0f172a",
    color: "#E5E7EB",
    p: 2,
    borderRadius: "8px",
    fontSize: "0.85rem",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap" as const,
    maxHeight: "800px",
    overflow: "auto",
  };

  return (
    <StepLayout
      isLoading={loading}
      hasResponse={hasResponse}
      onAction={hasResponse ? onNext : onPreprocess}
      content={
        <Box
          sx={{
            display: "flex",
            // flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 4,
            mt: 2,
          }}
        >
          {directoryStructure && (
            <Card
              sx={{
                bgcolor: "#1E293B",
                color: "#fff",
                flex: "1 1 40%",
                minWidth: "400px",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Directory Structure
                </Typography>
                <Divider sx={{ mb: 2, borderColor: "#555" }} />
                <Box component="pre" sx={contentBoxStyle}>
                  {directoryStructure}
                </Box>
              </CardContent>
            </Card>
          )}

          {filesList && (
            <Card
              sx={{
                bgcolor: "#1E293B",
                color: "#fff",
                flex: "1 1 50%",
                minWidth: "400px",
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Files List ({filesList.length})
                </Typography>
                <Divider sx={{ mb: 2, borderColor: "#555" }} />
                <Box component="pre" sx={contentBoxStyle}>
                  {JSON.stringify(filesList, null, 2)}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      }
    />
  );
};

export default StepPreprocess;
