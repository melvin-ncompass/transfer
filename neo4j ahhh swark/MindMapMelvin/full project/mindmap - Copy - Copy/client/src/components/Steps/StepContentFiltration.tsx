import React from "react";
import { Card, Typography, Divider, Box } from "@mui/material";
import StepLayout from "../Atoms/StepLayout";

interface RepoDiff {
  extractedRepoStructure: string | object;
  filteredRepoStructure: string | object;
  totalExtractedFiles?: number;
  totalFilteredFiles?: number;
  removedFiles?: string[];
}

interface Props {
  loading: boolean;
  repoDiff: RepoDiff | null;
  onFilter: () => void;
  onNext: () => void;
}

const CodeBlock: React.FC<{
  title: string;
  count?: number;
  data: string | object;
}> = ({ title, count, data }) => (
  <Card
    sx={{
      bgcolor: "#1E293B",
      color: "#fff",
      p: 2,
      flex: 1,
      minWidth: "320px",
    }}
  >
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    {count !== undefined && (
      <Typography variant="subtitle1" gutterBottom>
        File count: {count}
      </Typography>
    )}
    <Divider sx={{ mb: 2, borderColor: "#555" }} />
    <Box
      component="pre"
      sx={{
        bgcolor: "#0f172a",
        color: "#E5E7EB",
        p: 2,
        borderRadius: "8px",
        fontSize: "0.85rem",
        overflowX: "auto",
        maxHeight: "400px",
      }}
    >
      {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </Box>
  </Card>
);

const StepContentFiltration: React.FC<Props> = ({
  loading,
  repoDiff,
  onFilter,
  onNext,
}) => {
  const hasResponse = !!repoDiff;
  const handleAction = hasResponse ? onNext : onFilter;

  return (
    <StepLayout
      isLoading={loading}
      hasResponse={hasResponse}
      onAction={handleAction}
      content={
        repoDiff ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="stretch"
            gap={3}
            mt={2}
          >
            <CodeBlock
              title="Extracted Repo Structure"
              count={repoDiff.totalExtractedFiles}
              data={repoDiff.extractedRepoStructure}
            />
            <CodeBlock
              title="Filtered Batched Repo Structure"
              count={repoDiff.totalFilteredFiles}
              data={repoDiff.filteredRepoStructure}
            />
          </Box>
        ) : (
          !loading && (
            <Typography sx={{ color: "#aaa", mt: 2, textAlign: "center" }}>
              Click <b>Initiate</b> to run content filtration and generate the
              repo diff.
            </Typography>
          )
        )
      }
    />
  );
};

export default StepContentFiltration;
