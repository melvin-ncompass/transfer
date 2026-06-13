import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Menu,
  MenuItem,
  MenuList,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClearIcon from "@mui/icons-material/Clear";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import DOMPurify from "dompurify";
import { useDispatch, useSelector } from "react-redux";
import {
  saveHeader,
  setPreviewHtml,
  clearHeader,
  setPlaceholderPositions,
} from "../../slice/previewHtmlSlice";
import { PLACEHOLDER_CATEGORIES } from "../../utils/placeHolderCategories";
import { PrimaryButton } from "../../../../../components/atom/button";
import type { AppDispatch, RootState } from "../../../../../store/store";

interface IHeaderEditorProps {
  setOpenDialouge: (val: boolean) => void;
  initial?: string;
}

export default function HeaderEditor({
  setOpenDialouge,
  initial = "",
}: IHeaderEditorProps) {
  const dispatch: AppDispatch = useDispatch();
  const { html, placeholders } = useSelector(
    (state: RootState) => state.invoice.previewHtml
  );

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPlaceholders, setSelectedPlaceholders] =
    useState<string[]>(placeholders);
  const openMenu = Boolean(anchorEl);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({ types: ["paragraph"] }),
    ],
    content: html || initial,
  });

  useEffect(() => {
    setSelectedPlaceholders(placeholders);
  }, [placeholders]);

  // Insert placeholder
  const handlePlaceholderClick = (label: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(` %${label}% `).run();
    setSelectedPlaceholders((prev) => [...prev, label]);
    setAnchorEl(null);
  };

  // Track placeholder positions (multi-row, multi-column)
  const getPlaceholderPositions = (): Record<string, string[]> => {
    if (!editor) return {};
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return {};

    const range = document.createRange();
    const lines: number[] = [];
    const columns: Record<number, number> = {};
    const positions: Record<string, string[]> = {};

    editorEl.querySelectorAll("*").forEach((node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType !== Node.TEXT_NODE) return;

        const text = child.textContent ?? "";
        const matches = [...text.matchAll(/%([A-Za-z0-9_]+)%/g)];

        matches.forEach((match) => {
          const start = match.index!;
          const end = start + match[0].length;

          range.setStart(child, start);
          range.setEnd(child, end);

          Array.from(range.getClientRects()).forEach((rect) => {
            let lineIndex = lines.findIndex(
              (top) => Math.abs(top - rect.top) < 2
            );
            if (lineIndex === -1) {
              lines.push(rect.top);
              lineIndex = lines.length - 1;
              columns[lineIndex] = 0;
            }

            const colChar = String.fromCharCode(97 + columns[lineIndex]); // a,b,c
            if (!positions[match[1]]) positions[match[1]] = [];
            positions[match[1]].push(`${lineIndex + 1}${colChar}`);
            columns[lineIndex] += 1;
          });
        });
      });
    });

    return positions;
  };

  const handlePreview = () => {
    if (!editor) return;

    const positions = getPlaceholderPositions();

    dispatch(
      saveHeader({
        html: editor.getHTML(),
        placeholders: selectedPlaceholders,
      })
    );

    const replaced = editor
      .getHTML()
      .replace(/%([A-Za-z0-9_]+)%/g, (_, key) => key);
    dispatch(setPreviewHtml(DOMPurify.sanitize(replaced)));

    dispatch(setPlaceholderPositions(positions));

    setOpenDialouge(false);
  };

  const handleClose = () => {
    if (!editor) return;
    dispatch(
      saveHeader({
        html: editor.getHTML(),
        placeholders: selectedPlaceholders,
      })
    );
    setOpenDialouge(false);
  };

  const handleClear = () => {
    editor?.commands.clearContent();
    dispatch(clearHeader());
  };

  return (
    <Box
      sx={{
        width: 600,
        mx: "auto",
        backgroundColor: "background.paper",
        borderRadius: 2,
        boxShadow: 6,
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
          pb: 1,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Customize Header Content
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            variant="outlined"
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Insert Placeholders
          </Button>

          <ClearIcon
            onClick={handleClose}
            sx={{ cursor: "pointer", "&:hover": { color: "error.main" } }}
          />
        </Box>
      </Box>

      {/* PLACEHOLDER MENU */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 400,
              borderRadius: 1,
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, p: 1 }}>
          {PLACEHOLDER_CATEGORIES.map((cat) => (
            <Box key={cat.title} sx={{ width: 180 }}>
              <Typography variant="subtitle2">{cat.title}</Typography>
              <MenuList dense>
                {cat.items.map((item) => (
                  <MenuItem
                    key={item}
                    onClick={() => handlePlaceholderClick(item)}
                  >
                    {item}
                  </MenuItem>
                ))}
              </MenuList>
            </Box>
          ))}
        </Box>
      </Menu>

      {/* EDITOR */}
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          p: 1.5,
          height: 250,
          overflowY: "auto",
          "& .ProseMirror": { outline: "none", lineHeight: 1.6 },
        }}
      >
        <EditorContent editor={editor} />
      </Box>

      {/* ACTIONS */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid",
          borderColor: "divider",
          pt: 1,
        }}
      >
        <PrimaryButton variant="outlined" onClick={handleClear}>
          Clear
        </PrimaryButton>
        <PrimaryButton onClick={handlePreview}>Preview</PrimaryButton>
      </Box>
    </Box>
  );
}
