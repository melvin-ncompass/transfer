import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Tab,
  Tabs,
} from "@mui/material";
import StepLayout from "../Atoms/StepLayout";
import FileEditor from "../GenerateMindmap/Editor";
import FilePreviewContainer from "../GenerateMindmap/PreviewContainer";
import InteractiveMindmap from "../Mindmap/InteractiveMindmap";

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
  const [activeTab, setActiveTab] = useState(0);
  const [showMindmap, setShowMindmap] = useState(false);

  const repo = sessionStorage.getItem("selected_repo");
  const username = sessionStorage.getItem("username") || "melvin-ncompass";

  const generateMindmap = async () => {
    setLoading(true);
    setShowMindmap(true);
    setLoading(false);
  };

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
    if (showMindmap) {
      return (
        <Card sx={{ mt: 2, bgcolor: "#0f0f23", color: "#fff" }}>
          <CardContent sx={{ p: 1 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeTab} 
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ 
                  '& .MuiTab-root': { color: '#aaa' },
                  '& .Mui-selected': { color: '#fff' },
                  '& .MuiTabs-indicator': { backgroundColor: '#4ade80' }
                }}
              >
                <Tab label="🧠 Interactive Mindmap" />
                <Tab label="📊 Eraser Diagram" />
              </Tabs>
            </Box>

            {activeTab === 0 && (
              <Box sx={{ height: '80vh' }}>
                <InteractiveMindmap 
                  repo={repo || ""} 
                  username={username}
                />
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                {!edCode ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Button 
                      variant="contained" 
                      onClick={fetchEraserDiagram}
                      sx={{ bgcolor: '#4ade80', '&:hover': { bgcolor: '#22c55e' } }}
                    >
                      Generate Eraser Diagram
                    </Button>
                  </Box>
                ) : (
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
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      );
    }

    if (!loading) {
      return (
        <Typography sx={{ mt: 2, color: "#aaa", textAlign: "center" }}>
          Click <b>Generate Interactive Mindmap</b> to visualize your codebase
          relationships in an interactive Neo4j-style graph.
        </Typography>
      );
    }

    return null;
  };

  return (
    <StepLayout
      isLoading={loading}
      hasResponse={showMindmap}
      onAction={showMindmap ? () => console.log("Go to next step") : generateMindmap}
      content={renderContent()}
    />
  );
};

export default StepGenerate;
