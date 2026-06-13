import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Handle,
  Position,
  Background,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { Avatar, Typography, IconButton, Box } from "@mui/material";
import { useGetOrgChartQuery } from "../api/orgChart.api";

/* =======================
   Helper: extract first name
======================= */

function getFirstName(displayName: string): string {
  return displayName?.trim().split(/\s+/)[0] ?? displayName;
}

/* =======================
   Card Node Component
   
   nodeTypes object is defined once at module level (never recreated),
   so ReactFlow never unmounts/remounts nodes — fixing avatar image reloads.

   toggleCollapse and collapsedIds are passed via a module-level ref so
   CardNode can always read the latest values without needing new props
   (which would cause nodeTypes to change).
======================= */

const nodeHandlers = {
  toggleCollapse: (_id: string) => { },
  collapsedIds: new Set<string>(),
};

function CardNode({ data }: any) {
  const collapsed = nodeHandlers.collapsedIds.has(data.id);

  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: "#fff",
        borderRadius: 2,
        p: 2,
        minWidth: 260,
        boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        border: "1px solid #f0f0f0",
      }}
    >
      <Box
        sx={{
          height: 6,
          background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
          borderRadius: 1,
          mb: 1.5,
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar
          src={data.profileImageUrl || "https://via.placeholder.com/50"}
          sx={{ width: 50, height: 50 }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={600} fontSize={16}>
            {data.displayName}
          </Typography>
          <Typography fontSize={13} color="text.secondary">
            {data.designation}
          </Typography>
          <Typography fontSize={12} color="text.disabled">
            {data.department}
            {data.subdepartment ? ` - ${data.subdepartment}` : ""}
          </Typography>
        </Box>
      </Box>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />

      {data.hasChildren && (
        <IconButton
          onClick={() => nodeHandlers.toggleCollapse(data.id)}
          sx={{
            position: "absolute",
            bottom: -12,
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: collapsed ? "success.main" : "error.main",
            color: "#fff",
            "&:hover": {
              backgroundColor: collapsed ? "success.dark" : "error.dark",
            },
          }}
          size="small"
        >
          {collapsed ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      )}
    </Box>
  );
}

// Defined once — never changes reference — ReactFlow never remounts nodes.
const nodeTypes = { card: CardNode };

/* =======================
   Build Hierarchy (Safe)
======================= */

function buildHierarchy(flatList: any[]) {
  const map = new Map();

  flatList.forEach((emp) => {
    map.set(emp.id, { ...emp, children: [] });
  });

  flatList.forEach((emp) => {
    const parent = map.get(emp.reportingManagerId);
    if (parent && emp.id !== emp.reportingManagerId) {
      parent.children.push(map.get(emp.id));
    }
  });

  const roots: any[] = [];
  map.forEach((node) => {
    node.hasChildren = node.children.length > 0;
    if (
      !node.reportingManagerId ||
      node.reportingManagerId === node.id ||
      !map.has(node.reportingManagerId)
    ) {
      roots.push(node);
    }
  });

  return roots;
}

/* =======================
   Flatten Tree
   collapsedIds drives which children are rendered.
======================= */

function flattenTree(
  node: any,
  x: number,
  y: number,
  nodes: any[],
  edges: any[],
  collapsedIds: Set<string>,
  visited: Set<string>
) {
  if (visited.has(node.id)) return;
  visited.add(node.id);

  nodes.push({
    id: String(node.id),
    type: "card",
    data: node,
    position: { x, y },
  });

  if (collapsedIds.has(node.id)) return; // children hidden

  const childCount = node.children?.length || 0;
  let childX = x - ((childCount - 1) * 300) / 2;

  node.children?.forEach((child: any) => {
    edges.push({
      id: `${node.id}-${child.id}`,
      source: String(node.id),
      target: String(child.id),
      animated: true,
    });
    flattenTree(child, childX, y + 180, nodes, edges, collapsedIds, visited);
    childX += 300;
  });
}

/* =======================
   Main Component
======================= */

export default function OrgChartView() {
  const { data: apiData, isLoading } = useGetOrgChartQuery();
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  // collapsedIds is the single source of truth for collapse state.
  // Stored separately so toggling it never touches the tree structure
  // and never causes nodeTypes to change.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (apiData?.data?.length) {
      setHierarchy(buildHierarchy(apiData.data));
    } else {
      setHierarchy([]);
    }
  }, [apiData]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Keep module-level handlers in sync each render.
  // CardNode reads from nodeHandlers directly — no prop changes needed.
  nodeHandlers.toggleCollapse = toggleCollapse;
  nodeHandlers.collapsedIds = collapsedIds;

  const { nodes, edges } = useMemo(() => {
    const allNodes: any[] = [];
    const allEdges: any[] = [];

    hierarchy.forEach((root, index) => {
      flattenTree(
        root,
        500 + index * 800,
        100,
        allNodes,
        allEdges,
        collapsedIds,
        new Set()
      );
    });

    return { nodes: allNodes, edges: allEdges };
  }, [hierarchy, collapsedIds]);

  if (isLoading) return <Typography>Loading org chart...</Typography>;
  if (!hierarchy.length) return <Typography>No data found</Typography>;

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
}