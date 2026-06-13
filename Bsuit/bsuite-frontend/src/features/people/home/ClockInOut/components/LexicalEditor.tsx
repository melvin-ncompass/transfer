// import { useEffect, useState } from "react";
// import { LexicalComposer } from "@lexical/react/LexicalComposer";
// import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
// import { ContentEditable } from "@lexical/react/LexicalContentEditable";
// import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
// import { ListPlugin } from "@lexical/react/LexicalListPlugin";
// import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
// import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
// import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
// import ToolbarPlugin from "./ToolbarPlugin";
// import { Box } from "@mui/material";

// import { ListNode, ListItemNode } from "@lexical/list";
// import { LinkNode } from "@lexical/link";
// import { $getRoot, $getSelection, type EditorState } from "lexical";
// import { $generateHtmlFromNodes } from "@lexical/html";
// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// type Props = {
//   value?: string;
//   onChange?: (html: string) => void;
//   autoFocus?: boolean;
// };

// export default function LexicalEditor({
//   value = "",
//   onChange,
//   autoFocus = true,
// }: Props) {
//   const initialConfig = {
//     namespace: "ClockOutEditor",
//     theme: {},
//     nodes: [ListNode, ListItemNode, LinkNode],
//     onError(error: Error) {
//       console.error(error);
//     },
//   };

//   // Optional: store initial value
//   const [initialContent, setInitialContent] = useState(value);

//   return (
//     <LexicalComposer initialConfig={initialConfig}>
//       <Box
//         sx={{ border: "1px solid #ddd", borderRadius: 2, overflow: "hidden" }}
//       >
//         <ToolbarPlugin />

//         <Box sx={{ p: 2, minHeight: 140 }}>
//           <RichTextPlugin
//             contentEditable={
//               <ContentEditable
//                 style={{ outline: "none", minHeight: 100 }}
//                 autoFocus={autoFocus}
//               />
//             }
//             placeholder={
//               <div style={{ opacity: 0.5 }}>Enter clock out message...</div>
//             }
//             ErrorBoundary={LexicalErrorBoundary}
//           />

//           <HistoryPlugin />
//           <ListPlugin />
//           <LinkPlugin />
//           <HTMLExporterPlugin onChange={(html) => console.log("HTML:", html)} />
//         </Box>
//       </Box>
//     </LexicalComposer>
//   );
// }

// type HtmlProps = {
//   onChange: (html: string) => void;
// };
// export function HTMLExporterPlugin({ onChange }: HtmlProps) {
//   const [editor] = useLexicalComposerContext();

//   const cleanHTML = (html: string) => {
//     // Replace <strong><i> or <i><strong> with <b><i> for consistent styling
//     let cleaned = html
//       .replace(/<strong>(<i>.*?<\/i>)<\/strong>/g, "<b>$1</b>")
//       .replace(/<i><strong>(.*?)<\/strong><\/i>/g, "<b><i>$1</i></b>")
//       .replace(/<strong>(.*?)<\/strong>/g, "<b>$1</b>") // convert remaining strong to b
//       .replace(/<em>(.*?)<\/em>/g, "<i>$1</i>"); // convert em to i
//     return cleaned;
//   };

//   return (
//     <OnChangePlugin
//       onChange={() => {
//         editor.getEditorState().read(() => {
//           const html = $generateHtmlFromNodes(editor, null);
//           const cleanedHTML = cleanHTML(html);
//           onChange(cleanedHTML);
//         });
//       }}
//     />
//   );
// }
