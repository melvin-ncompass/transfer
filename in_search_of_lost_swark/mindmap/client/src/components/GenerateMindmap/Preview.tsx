import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface FilePreviewProps {
  filename: string;
  content: string;
  d2Svg: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({
  filename,
  content,
  d2Svg,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  return (
    <Box
      sx={{
        width: "800px",
        p: 2,
        borderRadius: "8px",
        border: "1px solid #ccc",
        bgcolor: "#ffffff",
        color: "#000000",
        overflow: "auto",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          gap: 1,
          zIndex: 2,
          bgcolor: "rgba(255,255,255,0.8)",
          borderRadius: 1,
          p: 0.5,
        }}
      >
        <IconButton size="small" onClick={onZoomOut}>
          <ZoomOutIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onResetZoom}>
          <RefreshIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={onZoomIn}>
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          minWidth: "100%",
        }}
      >
        {filename.endsWith(".md") ? (
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
        ) : filename.endsWith(".d2") ? (
          <div
            dangerouslySetInnerHTML={{ __html: d2Svg }}
            style={{ width: "100%", height: "100%" }}
          />
        ) : filename.match(/\.(json|txt|js|ts|jsx|tsx|html|css|yml|yaml)$/) ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {content}
          </pre>
        ) : (
          <Typography>Unsupported file type</Typography>
        )}
      </Box>
    </Box>
  );
};

export default FilePreview;
