import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Box, IconButton, styled } from "@mui/material";

import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";

type Props = {
  onChange?: (html: string) => void;
  content?: string;
  compact?: boolean;
};

// ✅ Moved outside — created once, never recreated on re-render
const EditorWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "compact",
})<{ compact?: boolean }>(({ compact }) => ({
  border: "1px solid #ddd",
  borderRadius: 8,
  overflow: "hidden",
  outline: "none",
  userSelect: "text",
  "&:focus": {
    outline: "none",
  },
  ".ProseMirror": {
    minHeight: compact ? 36 : 150,
    maxHeight: compact ? 180 : 400,
    padding: compact ? "5px 10px" : 12,
    fontFamily: "Arial, sans-serif",
    fontSize: 14,
    lineHeight: 1.5,
    backgroundColor: "#fdfdfd",
    overflowY: "auto",
    outline: "none",
  },
  "&:focus-within .ProseMirror": {
    borderColor: "#1976d2",
    boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)",
  },
  ".ProseMirror p": {
    margin: "0 0 8px 0",
    whiteSpace: "pre-wrap",
  },
}));

export default function TipTapEditor({ onChange, content = "", compact = false }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <EditorWrapper compact={compact} onClick={() => editor?.commands.focus()}>
      <Box
        sx={{
          display: "flex",
          gap: compact ? 0 : 1,
          p: compact ? "2px 6px" : 1,
          borderBottom: "1px solid #eee",
        }}
      >
        <IconButton
          size="small"
          color={editor.isActive("bold") ? "primary" : "default"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          sx={compact ? { padding: "2px" } : {}}
        >
          <FormatBoldIcon sx={{ fontSize: compact ? 14 : 20 }} />
        </IconButton>

        <IconButton
          size="small"
          color={editor.isActive("italic") ? "primary" : "default"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          sx={compact ? { padding: "2px" } : {}}
        >
          <FormatItalicIcon sx={{ fontSize: compact ? 14 : 20 }} />
        </IconButton>

        <IconButton
          size="small"
          color={editor.isActive("underline") ? "primary" : "default"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          sx={compact ? { padding: "2px" } : {}}
        >
          <FormatUnderlinedIcon sx={{ fontSize: compact ? 14 : 20 }} />
        </IconButton>

        <IconButton
          size="small"
          color={editor.isActive("bulletList") ? "primary" : "default"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          sx={compact ? { padding: "2px" } : {}}
        >
          <FormatListBulletedIcon sx={{ fontSize: compact ? 14 : 20 }} />
        </IconButton>

        <IconButton
          size="small"
          color={editor.isActive("orderedList") ? "primary" : "default"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          sx={compact ? { padding: "2px" } : {}}
        >
          <FormatListNumberedIcon sx={{ fontSize: compact ? 14 : 20 }} />
        </IconButton>

        {/* <IconButton
          size="small"
          onClick={() => {
            const url = prompt("Enter link URL");
            if (url) {
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }
          }}
          sx={compact ? { padding: "2px" } : {}}
        >
          <LinkIcon sx={{ fontSize: compact ? 14 : 20 }} />
        </IconButton> */}
      </Box>

      <EditorContent editor={editor} />
    </EditorWrapper>
  );
}