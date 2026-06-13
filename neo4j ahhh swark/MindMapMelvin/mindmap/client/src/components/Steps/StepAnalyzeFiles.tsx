import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import StepLayout from "../Atoms/StepLayout";

interface Props {
  loading: boolean;
  jsonResponse: string | object | null;
  onAnalyze: () => void;
  onNext: () => void;
}

const StepAnalyzeFiles: React.FC<Props> = ({
  loading,
  jsonResponse,
  onAnalyze,
  onNext,
}) => {
  const hasResponse = !!jsonResponse;
  const handleAction = hasResponse ? onNext : onAnalyze;

  return (
    <StepLayout
      isLoading={loading}
      hasResponse={hasResponse}
      onAction={handleAction}
      content={
        jsonResponse ? (
          <Card sx={{ bgcolor: "#2A2A40", color: "#fff", mt: 2 }}>
            <CardContent>
              <Typography variant="h6">Analyzed Files</Typography>
              <Divider sx={{ my: 1, borderColor: "#555" }} />
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  background: "#0f172a",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                }}
              >
                {typeof jsonResponse === "string"
                  ? jsonResponse
                  : JSON.stringify(jsonResponse, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : (
          !loading && (
            <Typography sx={{ color: "#aaa", textAlign: "center", mt: 2 }}>
              Click <b>Initiate</b> to analyze with LLM.
            </Typography>
          )
        )
      }
    />
  );
};

export default StepAnalyzeFiles;
