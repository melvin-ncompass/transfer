import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { Node, mergeAttributes } from "@tiptap/core";
import { Box, IconButton, styled, Typography } from "@mui/material";

import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LinkIcon from "@mui/icons-material/Link";
import { TextFieldElement } from "../../../../../components/atom/text-field";
import { useMemo, useState } from "react";

// --------------------- Variable Node ---------------------
const Variable = Node.create({
  name: "variable",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      key: { default: null },
      value: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-variable": HTMLAttributes.key,
        style:
          "background:#e3f2fd;padding:3px 6px;border-radius:4px;font-weight:500;cursor:default;",
      }),
      `{{${HTMLAttributes.value}}}`,
    ];
  },
});

// --------------------- Editor Wrapper ---------------------
const EditorWrapper = styled(Box)({
  border: "1px solid #ddd",
  borderRadius: 8,
  overflow: "hidden",
  outline: "none",
  userSelect: "text",
  "&:focus": {
    outline: "none",
  },
  ".ProseMirror": {
    minHeight: 150,
    maxHeight: 400,
    padding: 12,
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
});
type Field = { key: string; value: string };

// Use index signature for dynamic grouping
const groupedFields: Record<string, Field[]> = {
  "Personal Info": [
    { key: "a1", value: "Employee Name" },
    { key: "a2", value: "Department" },
  ],
  Compensation: [
    { key: "a3", value: "Salary" },
    { key: "a4", value: "Bonus" },
  ],
  Other: [
    { key: "a5", value: "Joining Date" },
    { key: "a6", value: "Manager" },
  ],
};

export function FieldsPanel() {
  const [search, setSearch] = useState("");

  // Filtered groups based on search
  const filteredGroups: Record<string, Field[]> = useMemo(() => {
    const result: Record<string, Field[]> = {};
    for (const group in groupedFields) {
      const fields = groupedFields[group].filter(
        (f) =>
          f.key.toLowerCase().includes(search.toLowerCase()) ||
          f.value.toLowerCase().includes(search.toLowerCase()),
      );
      if (fields.length > 0) result[group] = fields;
    }
    return result;
  }, [search]);

  return (
    <Box sx={{ width: 200, border: "1px solid #ddd", borderRadius: 1, p: 1 }}>
      {/* Search box */}
      <TextFieldElement
        label="Search fields"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 1 }}
      />

      {/* Grouped vertical fields */}
      {Object.entries(filteredGroups).map(([group, fields]) => (
        <Box key={group} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {group}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {fields.map((f) => (
              <Box
                key={f.key}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/json", JSON.stringify(f))
                }
                sx={{
                  px: 1.5,
                  py: 0.5,
                  background: "#eee",
                  borderRadius: 1,
                  cursor: "grab",
                  userSelect: "none",
                  fontSize: 13,
                }}
              >
                {f.value}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
type Props = {
  onChange?: (html: string) => void;
  content?: string;
};

export default function TipTapEditorForTemplates({
  onChange,
  content = "",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Variable,
    ],
    content,
    editorProps: {
      handleDrop(view, event) {
        const data = event.dataTransfer?.getData("application/json");
        if (!data) return false;

        const parsed = JSON.parse(data);
        view.dispatch(
          view.state.tr.replaceSelectionWith(
            view.state.schema.nodes.variable.create({
              key: parsed.key,
              value: parsed.value,
            }),
          ),
        );
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <Box display={"flex"} width={"100%"} gap={1}>
      {/* Draggable Fields */}
      {/* Draggable Fields */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 1 ,flex:0.4}}>
        {Object.entries(groupedFields).map(([groupName, fields]) => (
          <Box key={groupName} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {groupName}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 ,}}>
              {fields.map((f) => (
                <Box
                  key={f.key}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify(f),
                    )
                  }
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    background: "#eee",
                    borderRadius: 1,
                    cursor: "grab",
                    userSelect: "none",
                    fontSize: 13,
                  }}
                >
                  {f.value}
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Editor Toolbar */}
      <EditorWrapper onClick={() => editor.chain().focus().run()} flex={1}>
        <Box
          sx={{ display: "flex", gap: 1, p: 1, borderBottom: "1px solid #eee" }}
        >
          <IconButton
            size="small"
            color={editor.isActive("bold") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color={editor.isActive("italic") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color={editor.isActive("underline") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color={editor.isActive("bulletList") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color={editor.isActive("orderedList") ? "primary" : "default"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => {
              const url = prompt("Enter link URL");
              if (url)
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: url })
                  .run();
            }}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Box>

        <EditorContent editor={editor} />
      </EditorWrapper>
    </Box>
  );
}
