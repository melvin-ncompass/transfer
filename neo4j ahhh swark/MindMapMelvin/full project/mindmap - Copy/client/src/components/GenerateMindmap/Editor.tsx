import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { Box, Typography, Button } from "@mui/material";

interface FileEditorProps {
  filename: string;
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

const FileEditor: React.FC<FileEditorProps> = ({ filename, content, onChange, onSave }) => {
  return (
    <Box sx={{ width: "520px" }}>

      <Box sx={{ display:"flex", mt: 1,justifyContent: "space-between" }}>
      <Typography variant="h6" gutterBottom>
        Editing: {filename}
      </Typography>
        <Button variant="contained" onClick={onSave}>
          Compile
        </Button>
      </Box>

      <CodeMirror
        value={content}
        extensions={[
          filename.endsWith(".json") ? json() : javascript({ jsx: true }),
        ]}
        theme="dark"
        onChange={(value) => onChange(value)}
        style={{
          border: "1px solid #555",
          borderRadius: "8px",
          fontSize: "14px",
          width: "100%",
          marginTop: "16px",
        }}
      />
    </Box>
  );
};

export default FileEditor;
