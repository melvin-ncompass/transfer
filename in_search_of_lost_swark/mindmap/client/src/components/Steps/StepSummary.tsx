import React from "react";
import { Card, CardContent, Typography, Divider } from "@mui/material";
import StepLayout from "../Atoms/StepLayout";

interface Summary {
  summaryContent: string;
}

interface Props {
  loading: boolean;
  summary: Summary | null;
  onGenerate: () => void;
  onNext: () => void;
}

const StepSummary: React.FC<Props> = ({ loading, summary, onGenerate, onNext }) => {
  const hasResponse = !!summary;
  const handleAction = hasResponse ? onNext : onGenerate;

  return (
    <StepLayout
      isLoading={loading}
      hasResponse={hasResponse}
      onAction={handleAction}
      content={
        summary ? (
          <Card sx={{ mt: 2, bgcolor: "#2A2A40", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6">Batch Summary</Typography>
              <Divider sx={{ my: 1, borderColor: "#555" }} />

              {summary.summaryContent
                .split(/===\s*batch[-]?\d+\s*===/gi)
                .filter(Boolean)
                .map((batch, idx) => {
                  const trimmed = batch.trim();
                  let parsed: any = null;
                  let isJson = false;

                  try {
                    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                      parsed = JSON.parse(trimmed);
                      isJson = true;
                    }
                  } catch {
                    isJson = false;
                  }

                  return (
                    <Card
                      key={idx}
                      sx={{ bgcolor: "#1E293B", color: "#E5E7EB", my: 2 }}
                    >
                      <CardContent>
                        <Typography
                          variant="subtitle1"
                          sx={{ color: "#fff", mb: 1 }}
                        >
                          Batch {idx + 1}
                        </Typography>
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
                          {isJson ? JSON.stringify(parsed, null, 2) : trimmed}
                        </pre>
                      </CardContent>
                    </Card>
                  );
                })}
            </CardContent>
          </Card>
        ) : (
          !loading && (
            <Typography sx={{ mt: 2, color: "#aaa", textAlign: "center" }}>
              Click <b>Initiate</b> to fetch the batch summary from the LLM.
            </Typography>
          )
        )
      }
    />
  );
};

export default StepSummary;
