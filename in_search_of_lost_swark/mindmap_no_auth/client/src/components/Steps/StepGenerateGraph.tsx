import React, { useState, useRef } from "react";
import { type ForceGraphMethods } from "react-force-graph-2d";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ForceGraph2D from "react-force-graph-2d";
import StepLayout from "../Atoms/StepLayout";
import { useSessionStorage } from "../../hooks";
import FitScreenIcon from '@mui/icons-material/FitScreen';
import IconButton from '@mui/material/IconButton';
import { API_BASE_URL } from "../../config/api";


interface GraphNode {
  id: string;
  type: string;
  [key: string]: any;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  [key: string]: any;
}

const StepGenerateGraph: React.FC = () => {
  const [jsonData, setJsonData] = useState<any | null>(null);
  const [functionDetails, setFunctionDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [selectedGraphData, setSelectedGraphData] = useState<any | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<any | null>(null); // track selected function
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const { sessionUser } = useSessionStorage();
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);

  // fetch list of files
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/preprocess/listJsonFiles?repo=mindmap&username=${sessionUser()}`
      );
      const data = await res.json();
      setJsonData(data);
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  // build graph data for one function
  const buildGraphData = (details: any) => {
    const fnName = details.data.content.functionName;
    const nodes = [
      { id: fnName, type: "function" },
      ...details.data.content.dependsOn.map((dep: any) => ({ id: dep.name, type: "dependsOn" })),
      ...details.data.content.usedBy.map((u: any) => ({ id: u.name, type: "usedBy" })),
    ];

    const links = [
      ...details.data.content.dependsOn.map((dep: any) => ({ source: fnName, target: dep.name, type: "dependsOn" })),
      ...details.data.content.usedBy.map((u: any) => ({ source: u.name, target: fnName, type: "usedBy" })),
    ];

    return { nodes, links };
  };

  const handleNodeClick = (node: GraphNode) => {
  if (!graphRef.current) return;

  graphRef.current.centerAt(node.x!, node.y!, 1000);
  graphRef.current.zoom(4, 1000);

  // Toggle collapse/expand
  const newCollapsed = new Set(collapsedNodes);
  if (newCollapsed.has(node.id)) {
    newCollapsed.delete(node.id); // expand
  } else {
    newCollapsed.add(node.id); // collapse
  }
  setCollapsedNodes(newCollapsed);

  // Update selected function details
  const fn = Object.values(functionDetails).find(
    (f: any) => f.data.content.functionName === node.id
  );
  if (fn) setSelectedFunction(fn.data.content);
};

// Filter graph data dynamically based on collapsedNodes
const filteredGraphData = selectedGraphData
  ? {
      nodes: selectedGraphData.nodes,
      links: selectedGraphData.links.filter(
        (link: GraphLink) =>
          !collapsedNodes.has(link.source as string) && !collapsedNodes.has(link.target as string)
      ),
    }
  : null;

  // fetch single function details
  const fetchFunctionDetails = async (relativePath: string) => {
    if (functionDetails[relativePath]) {
      setSelectedGraphData(buildGraphData(functionDetails[relativePath]));
      setSelectedFunction(functionDetails[relativePath].data.content); // set selected function
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/preprocess/getJsonFile?repo=mindmap&username=${sessionUser()}&relativePath=${encodeURIComponent(
          relativePath
        )}`
      );
      const data = await res.json();
      setFunctionDetails((prev) => ({ ...prev, [relativePath]: data }));
      setSelectedGraphData(buildGraphData(data));
      setSelectedFunction(data.data.content);
    } catch (err) {
      console.error("Failed to fetch function details:", err);
    }
  };

  // build merged graph of all functions
  const generateFullGraph = async () => {
    if (!jsonData?.data?.files) return;
    const files = jsonData.data.files;

    const allDetails: any[] = [];
    for (const f of files) {
      if (!functionDetails[f.relativePath]) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/preprocess/getJsonFile?repo=mindmap&username=${sessionUser()}&relativePath=${encodeURIComponent(f.relativePath)}`
          );
          const data = await res.json();
          setFunctionDetails((prev) => ({ ...prev, [f.relativePath]: data }));
          allDetails.push(data);
        } catch (err) {
          console.error("Failed to fetch function details:", err);
        }
      } else {
        allDetails.push(functionDetails[f.relativePath]);
      }
    }

    const nodes: any[] = [];
    const links: any[] = [];
    const seen = new Set<string>();

    allDetails.forEach((d) => {
      const fnName = d.data.content.functionName;
      if (!seen.has(fnName)) {
        nodes.push({ id: fnName, type: "function" });
        seen.add(fnName);
      }

      d.data.content.dependsOn.forEach((dep: any) => {
        if (!seen.has(dep.name)) {
          nodes.push({ id: dep.name, type: "dependsOn" });
          seen.add(dep.name);
        }
        links.push({ source: fnName, target: dep.name, type: "dependsOn" });
      });

      d.data.content.usedBy.forEach((u: any) => {
        if (!seen.has(u.name)) {
          nodes.push({ id: u.name, type: "usedBy" });
          seen.add(u.name);
        }
        links.push({ source: u.name, target: fnName, type: "usedBy" });
      });
    });

    setSelectedGraphData({ nodes, links });
  };

  const renderContent = () => {
    if (!jsonData) return <Typography sx={{ mt: 2, color: "#aaa", textAlign: "center" }}>Click <b>Generate Diagram</b> to fetch data from API.</Typography>;

    const files = jsonData?.data?.success ? jsonData.data.files : [];

    return (
      <Card sx={{ mt: 2, bgcolor: "#2A2A40", color: "#fff", width: "100%", height: "850px" }}>
        <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6">Generated Diagram</Typography>
            <Button variant="contained" size="small" onClick={generateFullGraph}>Generate Full Graph</Button>
            <IconButton
      color="primary"
      sx={{ bgcolor: "#fff" }}
      onClick={() => {
        if (graphRef.current) graphRef.current.zoomToFit(400, 50);
      }}
    >
      <FitScreenIcon />
    </IconButton>
          </Box>
          <Divider sx={{ my: 1, borderColor: "#555" }} />

          <Box sx={{ display: "flex", gap: 2, flex: 1, height: "100%" }}>
            {/* Accordion Section */}
            {/* <Box sx={{ flex: 1, bgcolor: "#1E1E2F", p: 1, overflowY: "auto", borderRadius: 1, minWidth: "250px" }}>
              <TextField
                variant="outlined"
                size="small"
                fullWidth
                placeholder="Search function..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2, bgcolor: "#fff", borderRadius: 1, "& .MuiOutlinedInput-root": { height: "36px", fontSize: "0.85rem" } }}
              />

              {files
                .filter((f: any) => f.functionName.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((f: any, idx: number) => {
                  const details = functionDetails[f.relativePath];
                  return (
                    <Accordion key={idx} onChange={() => fetchFunctionDetails(f.relativePath)} sx={{ bgcolor: "#2A2A40", color: "#fff", mb: 1, "&:before": { display: "none" } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}>
                        <Typography sx={{ fontWeight: "bold" }}>{details ? details.data.content.functionName : f.functionName}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {details ? (
                          <>
                            <Typography variant="subtitle2" sx={{ mt: 1, color: "#90caf9" }}>Depends On: {details.data.content.dependsOn.length}</Typography>
                            <Typography variant="subtitle2" sx={{ mt: 1, color: "#90caf9" }}>Used By: {details.data.content.usedBy.length}</Typography>
                          </>
                        ) : (
                          <Typography>Loading details...</Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
            </Box> */}

            {/* Graph Viewer */}
            <Box sx={{ flex: 1.5, bgcolor: "#eff0f1ff", borderRadius: 1, p: 1, display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
              {selectedGraphData ? (
                <ForceGraph2D
                  ref={graphRef}
                  graphData={selectedGraphData}
                  nodeAutoColorBy="type"
                  nodeLabel={(node: GraphNode) => node.type === "function" ? `Function: ${node.id}` : `${node.type}: ${node.id}`}
                  linkLabel={(link: GraphLink) => link.type}
                  linkDirectionalArrowLength={6}
                  linkDirectionalArrowRelPos={1}
                  nodeRelSize={10}
                  width={500}
                  height={700}
                  onNodeClick={(node) => {
                    if (!graphRef.current) return;
                    graphRef.current.centerAt(node.x!, node.y!, 1000);
                    graphRef.current.zoom(4, 1000);

                    // Set selected function by node id
                    const fn = Object.values(functionDetails).find((f: any) => f.data.content.functionName === node.id);
                    if (fn) setSelectedFunction(fn.data.content);
                  }}
                  // onNodeClick={handleNodeClick}
                />
              ) : (
                <Typography sx={{ color: "#bbb", textAlign: "center" }}>Select a function or click "Generate Full Graph"</Typography>
              )}
            </Box>

            {/* Function Details */}
            <Box sx={{ flex: 1, bgcolor: "#1E1E2F", borderRadius: 1, p: 1, overflowY: "auto", minWidth: "250px" }}>
              {selectedFunction && (
                <>
                  <Typography variant="subtitle2"><b>Function Name:</b> {selectedFunction.functionName}</Typography>
                  <Typography variant="subtitle2"><b>Relative Path:</b> {selectedFunction.relativePath}</Typography>
                  <details>
                    <summary>🔍 View Source Code</summary>
                    <Box sx={{ mt: 1, bgcolor: "#2A2A40", p: 1, borderRadius: 1, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                      {selectedFunction.codeBlock}
                    </Box>
                  </details>
                </>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <StepLayout
      isLoading={loading}
      hasResponse={!!jsonData}
      onAction={jsonData ? () => console.log("Go to next step") : fetchData}
      content={renderContent()}
    />
  );
};

export default StepGenerateGraph;

