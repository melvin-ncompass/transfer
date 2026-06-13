// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

// import {
//   FORMAT_TEXT_COMMAND,
//   $getSelection,
//   $isRangeSelection,
//   SELECTION_CHANGE_COMMAND,
//   $isParagraphNode,
//   $getRoot,
//   TextNode,
//   type LexicalCommand,
// } from "lexical";

// import {
//   INSERT_UNORDERED_LIST_COMMAND,
//   INSERT_ORDERED_LIST_COMMAND,
//   ListNode,
//   ListItemNode,
// } from "@lexical/list";

// import { TOGGLE_LINK_COMMAND, LinkNode } from "@lexical/link";

// import { useEffect, useState } from "react";
// import { Box, IconButton, Divider } from "@mui/material";

// import FormatBoldIcon from "@mui/icons-material/FormatBold";
// import FormatItalicIcon from "@mui/icons-material/FormatItalic";
// import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
// import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
// import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
// import LinkIcon from "@mui/icons-material/Link";

// export default function ToolbarPlugin() {
//   const [editor] = useLexicalComposerContext();

//   const [activeFormats, setActiveFormats] = useState({
//     bold: false,
//     italic: false,
//     underline: false,
//     bullet: false,
//     number: false,
//   });

//   useEffect(() => {
//     // Update toolbar state
    
// const updateToolbar = () => {
//   editor.update(() => {
//     const selection = $getSelection();

//     if ($isRangeSelection(selection)) {
//       const anchor = selection.anchor.getNode();

//       let isBold = false;
//       let isItalic = false;
//       let isUnderline = false;

//       if (anchor instanceof TextNode) {
//         const format = anchor.getFormat();
//         isBold = (format & 1) !== 0;      // FORMAT_BOLD = 1
//         isItalic = (format & 2) !== 0;    // FORMAT_ITALIC = 2
//         isUnderline = (format & 4) !== 0; // FORMAT_UNDERLINE = 4
//       }

//       // Check for lists (top-level parent)
//       const parent = anchor.getTopLevelElementOrThrow?.();
//       const type = parent?.getType?.() || "";

//       setActiveFormats({
//         bold: isBold,
//         italic: isItalic,
//         underline: isUnderline,
//         bullet: type === "bullet",
//         number: type === "number",
//       });
//     }
//   });
// };

//     const removeListener = editor.registerCommand(
//       SELECTION_CHANGE_COMMAND,
//       () => {
//         updateToolbar();
//         return false;
//       },
//       0,
//     );

//     updateToolbar();

//     return () => removeListener();
//   }, [editor]);

//   const applyCommand = (command: LexicalCommand<any>) => {
//     editor.focus();
//     editor.dispatchCommand(command, undefined);
//   };
//   type TextFormat = "bold" | "italic" | "underline";

//   const formatCommand = (format: TextFormat) => {
//     editor.focus();
//     editor.dispatchCommand(FORMAT_TEXT_COMMAND as LexicalCommand<TextFormat>, format);
//   };

//   const insertLink = () => {
//     const url = prompt("Enter URL");
//     if (url) {
//       editor.focus();
//       editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
//     }
//   };

//   return (
//     <Box
//       sx={{
//         display: "flex",
//         alignItems: "center",
//         borderBottom: "1px solid #eee",
//         px: 1,
//       }}
//     >
//       <IconButton
//         size="small"
//         color={activeFormats.bold ? "primary" : "default"}
//         onClick={() => formatCommand("bold")}
//       >
//         <FormatBoldIcon fontSize="small" />
//       </IconButton>
//       <IconButton
//         size="small"
//         color={activeFormats.italic ? "primary" : "default"}
//         onClick={() => formatCommand("italic")}
//       >
//         <FormatItalicIcon fontSize="small" />
//       </IconButton>
//       <IconButton
//         size="small"
//         color={activeFormats.underline ? "primary" : "default"}
//         onClick={() => formatCommand("underline")}
//       >
//         <FormatUnderlinedIcon fontSize="small" />
//       </IconButton>

//       <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

//       <IconButton
//         size="small"
//         color={activeFormats.bullet ? "primary" : "default"}
//         onClick={() => applyCommand(INSERT_UNORDERED_LIST_COMMAND)}
//       >
//         <FormatListBulletedIcon fontSize="small" />
//       </IconButton>
//       <IconButton
//         size="small"
//         color={activeFormats.number ? "primary" : "default"}
//         onClick={() => applyCommand(INSERT_ORDERED_LIST_COMMAND)}
//       >
//         <FormatListNumberedIcon fontSize="small" />
//       </IconButton>

//       <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

//       <IconButton size="small" onClick={insertLink}>
//         <LinkIcon fontSize="small" />
//       </IconButton>
//     </Box>
//   );
// }
