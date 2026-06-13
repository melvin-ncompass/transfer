import React, { useEffect, useState } from "react";
import { D2 } from "@terrastruct/d2";
import FilePreview from "./Preview";

interface FilePreviewContainerProps {
  filename: string;
  content: string;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const FilePreviewContainer: React.FC<FilePreviewContainerProps> = ({
  filename,
  content,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const [d2Svg, setD2Svg] = useState("");

  useEffect(() => {
    const d2 = new D2();
    const renderDiagram = async () => {
      if (filename.endsWith(".d2")) {
        try {
          const output = await d2.compile(content);
          const result = await d2.render(output.diagram, { themeID: 0 });
          setD2Svg(result);
        } catch (err) {
          console.error("D2 render error:", err);
          setD2Svg(`<p style="color:red">Error rendering D2 diagram</p>`);
        }
      }
    };
    renderDiagram();
  }, [filename, content]);

  return (
    <FilePreview
      filename={filename}
      content={content}
      d2Svg={d2Svg}
      zoom={zoom}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onResetZoom={onResetZoom}
    />
  );
};

export default FilePreviewContainer;
