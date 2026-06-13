import React from "react";
import { Card, Typography, CardContent, Box } from "@mui/material";
import StepLayout from "../Atoms/StepLayout";

interface Props {
  loading: boolean;
  promptData: any;
  onBuildPrompt: () => void;
  onNext: () => void;
}

const StepBuildPrompt: React.FC<Props> = ({
  loading,
  promptData,
  onBuildPrompt,
  onNext,
}) => {
  const hasPrompt = !!promptData;

  return (
    <StepLayout
      isLoading={loading}
      hasResponse={hasPrompt}
      onAction={hasPrompt ? onNext : onBuildPrompt}
      content={
        <>
          {hasPrompt && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Card sx={{ bgcolor: "#2A2A40", color: "#fff" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Instructions
                  </Typography>
                  {promptData.instructions?.map(
                    (inst: string, idx: number) => (
                      <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                        {inst}
                      </Typography>
                    )
                  )}
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: "#2A2A40", color: "#fff" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Repository Analysis
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#1E293B",
                      color: "#E5E7EB",
                      p: 2,
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {JSON.stringify(promptData.repositoryAnalysis, null, 2)}
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: "#2A2A40", color: "#fff" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Response Format
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      bgcolor: "#1E293B",
                      color: "#E5E7EB",
                      p: 2,
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {JSON.stringify(promptData.responseFormat, null, 2)}
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: "#2A2A40", color: "#fff" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Final Instructions
                  </Typography>
                  {promptData.finalInstructions?.map(
                    (inst: string, idx: number) => (
                      <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                        {inst}
                      </Typography>
                    )
                  )}
                </CardContent>
              </Card>

              <Card sx={{ bgcolor: "#2A2A40", color: "#fff" }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Output Requirement
                  </Typography>
                  <Typography variant="body2">
                    {promptData.outputRequirement}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </>
      }
    />
  );
};

export default StepBuildPrompt;
