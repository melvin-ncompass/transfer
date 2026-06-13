import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'dark',
  darkMode: true,
  securityLevel: 'loose',
  themeVariables: {
    primaryColor: '#1a2a3a',
    primaryTextColor: '#a8ffd8',
    primaryBorderColor: '#00ffaa33',
    lineColor: '#00ffaa88',
    secondaryColor: '#0d1f2d',
    tertiaryColor: '#0a1520',
    edgeLabelBackground: '#0d1f2d',
    fontFamily: 'inherit'
  }
});

interface MermaidBlockProps {
  content: string;
}

/** Lines models often put before the real diagram line (skip for directive detection). */
function isPrologueLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (t.startsWith("%%")) return true;
  // Markdown title / section before ```mermaid body — not the Mermaid diagram keyword
  if (t.startsWith("#")) return true;
  if (t === "---") return true;
  return false;
}

/** First line that is likely the diagram directive or first real statement. */
function firstMeaningfulLine(code: string): string | undefined {
  for (const line of code.split("\n")) {
    if (isPrologueLine(line)) continue;
    return line.trim();
  }
  return undefined;
}

/** Mermaid requires a diagram directive; models often emit only edges. */
const MERMAID_DIAGRAM_START =
  /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|gitgraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|block-beta|sankey|packet|xychart|kanban|gitGraph)\b/i;

/** If we prepended flowchart LR but the block already had flowchart TD (etc.), drop the duplicate. */
function dedupeStackedDiagramDirectives(code: string): string {
  const lines = code.split("\n");
  const nonempty: { lineIndex: number; t: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    nonempty.push({ lineIndex: i, t });
  }
  if (nonempty.length < 2) return code;
  const a = nonempty[0].t;
  const b = nonempty[1].t;
  if (MERMAID_DIAGRAM_START.test(a) && MERMAID_DIAGRAM_START.test(b)) {
    const dropAt = nonempty[0].lineIndex;
    return [...lines.slice(0, dropAt), ...lines.slice(dropAt + 1)]
      .join("\n")
      .replace(/^\n+/, "");
  }
  return code;
}

function ensureDiagramDirective(code: string): string {
  const first = firstMeaningfulLine(code);
  if (!first) return code;
  if (MERMAID_DIAGRAM_START.test(first)) return code;
  if (/^participant\b/i.test(first) || /^autonumber\b/i.test(first)) {
    return `sequenceDiagram\n${code}`;
  }
  return `flowchart LR\n${code}`;
}

/** Remove leading markdown `#` titles; Mermaid may reject them before `flowchart`. */
function stripLeadingMarkdownTitleLines(code: string): string {
  const lines = code.split("\n");
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) {
      i++;
      continue;
    }
    if (t.startsWith("#")) {
      i++;
      continue;
    }
    break;
  }
  return lines.slice(i).join("\n").trim();
}

const MERGE_NEXT_LINE_SKIP =
  /^(%|flowchart|graph|subgraph|end\b|direction|classDef|class|click|style|link|%%)/i;

/**
 * LLMs often wrap so the target node is on the next line, which Mermaid rejects:
 *   AppModule -->|uses|
 *   DatabaseModule
 */
function joinBrokenFlowchartEdges(code: string): string {
  const lines = code.split("\n");
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const t = raw.trimEnd().replace(/\r$/, "");
    const trimmed = t.trim();
    if (!trimmed) {
      out.push(raw);
      i++;
      continue;
    }
    const nextRaw = i + 1 < lines.length ? lines[i + 1] : "";
    const next = nextRaw.trim().replace(/\r$/, "");
    const canMergeNext =
      next &&
      !MERGE_NEXT_LINE_SKIP.test(next) &&
      !next.includes("-->") &&
      !next.includes("-.->");

    // ... -->|label|  \n  TargetNode
    if (
      canMergeNext &&
      trimmed.includes("-->") &&
      trimmed.endsWith("|") &&
      /-->\s*\|[^|]*\|\s*$/.test(trimmed)
    ) {
      out.push(`${trimmed} ${next}`);
      i += 2;
      continue;
    }
    // ... -->  \n  TargetNode
    if (canMergeNext && trimmed.includes("-->") && /-->\s*$/.test(trimmed)) {
      out.push(`${trimmed} ${next}`);
      i += 2;
      continue;
    }
    out.push(raw);
    i++;
  }
  return out.join("\n");
}

function joinBrokenFlowchartEdgesUntilStable(code: string): string {
  let prev = "";
  let out = code;
  let n = 0;
  while (prev !== out && n < 24) {
    prev = out;
    out = joinBrokenFlowchartEdges(out);
    n++;
  }
  return out;
}

/** Normalize common LLM mistakes so mermaid.parse/render succeed. */
function normalizeMermaidBody(code: string): string {
  let out = code
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
  out = stripLeadingMarkdownTitleLines(out);
  if (!out) return out;

  out = joinBrokenFlowchartEdgesUntilStable(out);

  // Fix trailing > on edge labels: -->|label|> -> -->|label|
  out = out.replace(/-->\|([^|]+)\|>/g, "-->|$1|");

  // LLMs often use "A -> B" (spaces); Mermaid requires "-->". Do not match "->" inside "-->".
  out = out.replace(/\s+->\s+/g, " --> ");

  // Markdown-style backticks around ids — strip before arrow fixes (`App` -> App)
  out = out.replace(/`([A-Za-z_][\w.]*)`/g, "$1");

  // Tight chains: AppModule->DatabaseModule->X (repeat until stable)
  let prev = "";
  while (prev !== out) {
    prev = out;
    out = out.replace(
      /([A-Za-z_][\w.]*)\s*->\s*([A-Za-z_][\w.]*)/g,
      "$1 --> $2"
    );
  }

  // Unicode arrow (common in pasted text)
  out = out.replace(/\s*→\s*/g, " --> ");

  out = ensureDiagramDirective(out);
  out = dedupeStackedDiagramDirectives(out);
  return out;
}

export function MermaidBlock({ content }: MermaidBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Robust extraction of Mermaid syntax from the provided content
  const extractSyntax = (raw: string) => {
    const match = raw.match(/```mermaid\s*([\s\S]*?)\s*```/);
    const code = match ? match[1] : raw;
    return normalizeMermaidBody(code);
  };

  const syntax = extractSyntax(content);

  useEffect(() => {
    if (!ref.current || !syntax) return;

    const id = "mg-" + Date.now() + Math.floor(Math.random() * 100);
    const host = ref.current;
    let cancelled = false;

    (async () => {
      try {
        await mermaid.parse(syntax);
        const { svg, bindFunctions } = await mermaid.render(id, syntax);
        if (cancelled || !host) return;
        host.innerHTML = svg;
        bindFunctions?.(host);
        const svgEl = host.querySelector("svg");
        if (svgEl) {
          svgEl.style.background = "transparent";
          svgEl.style.maxWidth = "100%";
        }
      } catch (err) {
        console.error("Mermaid Render Error:", err, "Syntax:", syntax);
        if (!cancelled && host) {
          host.innerHTML = `<div style="border: 2px solid #ef4444; border-radius: 12px; padding: 16px; background: rgba(239, 68, 68, 0.1); color: #fca5a5; font-family: monospace; font-size: 14px; white-space: pre-wrap; width: 100%; overflow-x: auto;"><strong>Diagram Compilation Failed</strong><br/><br/>${syntax.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [syntax]);

  return (
    <div
      ref={ref}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,255,170,0.03) 100%)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        border: '1px solid rgba(0,255,170,0.12)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        padding: '24px',
        overflowX: 'auto',
        overflowY: 'auto',
        minHeight: '300px',
        width: '100%',
      }}
    />
  );
}
