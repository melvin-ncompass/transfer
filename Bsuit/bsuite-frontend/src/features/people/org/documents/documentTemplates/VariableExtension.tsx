import { Node, mergeAttributes } from "@tiptap/core";

export const Variable = Node.create({
  name: "variable",

  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      key: {
        default: null,
      },
      value: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-variable]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-variable": HTMLAttributes.key,
        style:
          "background:#e3f2fd;padding:3px 6px;border-radius:4px;font-weight:500;",
      }),
      `{{${HTMLAttributes.key}}}`,
    ];
  },
});