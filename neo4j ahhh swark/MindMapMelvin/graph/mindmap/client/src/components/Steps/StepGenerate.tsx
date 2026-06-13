import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import StepLayout from "../Atoms/StepLayout";
import FileEditor from "../GenerateMindmap/Editor";
import FilePreviewContainer from "../GenerateMindmap/PreviewContainer";

interface EraserResponse {
  data: {
    success: boolean;
    message: string;
    eraserCode: string;
    diagramPath: string;
  };
  message: string;
  statusCode: number;
}

const StepGenerate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [edCode, setEdCode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const repo = sessionStorage.getItem("selected_repo");
  const username = sessionStorage.getItem("username") || "saahithi-ncompass";

  const fetchEraserDiagram = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/flowchart/generateEraser?repo=${repo}&username=${username}`
      );
      const data: EraserResponse = await res.json();
      if (res.ok && data?.data?.eraserCode) {
        setEdCode(data.data.eraserCode);
      }
    } catch (err) {
      console.error("Error fetching Eraser diagram:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (edCode) {
      return (
        <Card sx={{ mt: 2, bgcolor: "#2A2A40", color: "#fff" }}>
          <CardContent>
            <Typography variant="h6">Generated Eraser Diagram</Typography>
            <Divider sx={{ my: 1, borderColor: "#555" }} />

            <Box sx={{ display: "flex", gap: 2 }}>
              <FileEditor
                filename="architecture.eraserdiagram"
                content={edCode}
                onChange={(val) => setEdCode(val)}
                onSave={() => console.log("Compile clicked")}
              />

              <FilePreviewContainer
                filename="architecture.eraserdiagram"
                content={edCode}
                zoom={zoom}
                onZoomIn={() => setZoom((z) => z + 0.1)}
                onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.1))}
                onResetZoom={() => setZoom(1)}
              />
            </Box>
          </CardContent>
        </Card>
      );
    }

    if (!loading) {
      return (
        <Typography sx={{ mt: 2, color: "#aaa", textAlign: "center" }}>
          Click <b>Generate Eraser Diagram</b> to fetch and preview the
          architecture.
        </Typography>
      );
    }

    return null;
  };

  return (
    <StepLayout
      isLoading={loading}
      hasResponse={!!edCode}
      onAction={edCode ? () => console.log("Go to next step") : fetchEraserDiagram}
      content={renderContent()}
    />
  );
};

export default StepGenerate;
