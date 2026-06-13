import React, { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ConnectionMode,
  MarkerType,
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Alert, 
  CircularProgress, 
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import FunctionNode from './FunctionNode';
import { getModuleColor } from '../utils';
import { API_BASE_URL } from '../../config/api';

// Custom node types
const nodeTypes = {
  functionNode: FunctionNode,
};

interface MindmapNode {
  id: string;
  name: string;
  module: string;
  language: string;
  functionType: string;
  complexity: number;
  isEntryPoint: boolean;
  executionLayer: number;
  dependsOnCount: number;
  usedByCount: number;
  totalConnections: number;
  isCritical: boolean;
  isTerminal: boolean;
}

interface MindmapRelationship {
  source: string;
  target: string;
  sourceName: string;
  targetName: string;
  sourceModule: string;
  targetModule: string;
  type: string;
  isCrossModule: boolean;
}

interface MindmapData {
  success: boolean;
  project: {
    name: string;
    username: string;
  };
  mindmap: {
    nodes: MindmapNode[];
    relationships: MindmapRelationship[];
    moduleGroups: Record<string, any>;
  };
  statistics: {
    totalNodes: number;
    totalRelationships: number;
    entryPoints: number;
    executionLayers: number;
    modules: string[];
    criticalFunctions: number;
  };
}

interface InteractiveMindmapProps {
  repo: string;
  username: string;
}

const InteractiveMindmap: React.FC<InteractiveMindmapProps> = ({ repo, username }) => {
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch mindmap data
  const fetchMindmapData = useCallback(async () => {
    if (!repo || !username) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/preprocess/getMindmapData?repo=${repo}&username=${username}&detailLevel=all`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: MindmapData = await response.json();
      setMindmapData(data);
    } catch (err) {
      console.error('Error fetching mindmap data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch mindmap data');
    } finally {
      setLoading(false);
    }
  }, [repo, username]);

  // Convert mindmap data to ReactFlow format
  const convertToReactFlowData = useMemo(() => {
    if (!mindmapData) return { nodes: [], edges: [] };

    const { mindmap } = mindmapData;
    
    // Calculate positions using a radial layout for better visualization
    const centerX = 400;
    const centerY = 300;
    const layerRadius = 150;
    
    // Group nodes by layer
    const nodesByLayer = new Map<number, MindmapNode[]>();
    mindmap.nodes.forEach(node => {
      const layer = node.executionLayer;
      if (!nodesByLayer.has(layer)) {
        nodesByLayer.set(layer, []);
      }
      nodesByLayer.get(layer)!.push(node);
    });
    
    const reactFlowNodes: Node[] = mindmap.nodes.map((node) => {
      const layer = node.executionLayer;
      const nodesInLayer = nodesByLayer.get(layer)?.length || 1;
      const nodeIndex = nodesByLayer.get(layer)?.indexOf(node) || 0;
      
      let x, y;
      
      if (layer === 0 && node.isEntryPoint) {
        // Entry points at center
        const entryNodes = nodesByLayer.get(0)?.filter(n => n.isEntryPoint) || [];
        const entryIndex = entryNodes.indexOf(node);
        const angle = (entryIndex * 2 * Math.PI) / Math.max(entryNodes.length, 1);
        x = centerX + Math.cos(angle) * 50;
        y = centerY + Math.sin(angle) * 50;
      } else {
        // Other nodes in radial layers
        const radius = layerRadius * (layer + 1);
        const angle = (nodeIndex * 2 * Math.PI) / nodesInLayer;
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      
      return {
        id: node.id,
        type: 'functionNode',
        position: { x, y },
        data: {
          name: node.name,
          module: node.module,
          language: node.language,
          functionType: node.functionType,
          complexity: node.complexity,
          isEntryPoint: node.isEntryPoint,
          executionLayer: node.executionLayer,
          dependsOnCount: node.dependsOnCount,
          usedByCount: node.usedByCount,
          isCritical: node.isCritical,
          isTerminal: node.isTerminal,
          isMatching: selectedNode === node.id || 
            (searchTerm && node.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (filterModule && node.module === filterModule),
        },
        draggable: true,
        selectable: true,
      };
    });

    const reactFlowEdges: Edge[] = mindmap.relationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.source,
      target: rel.target,
      type: 'smoothstep',
      animated: rel.isCrossModule,
      style: {
        stroke: rel.isCrossModule ? '#f59e0b' : '#64748b',
        strokeWidth: rel.isCrossModule ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: rel.isCrossModule ? '#f59e0b' : '#64748b',
      },
      label: rel.isCrossModule ? '🔗' : undefined,
      labelStyle: { fontSize: '12px' },
    }));

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
  }, [mindmapData, selectedNode]);

  // Update React Flow nodes and edges when data changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertToReactFlowData;
    setNodes(newNodes);
    setEdges(newEdges);
  }, [convertToReactFlowData, setNodes, setEdges, searchTerm, filterModule]);

  // Load data on mount
  useEffect(() => {
    fetchMindmapData();
  }, [fetchMindmapData]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(selectedNode === node.id ? null : node.id);
  }, [selectedNode]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="600px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading mindmap data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!mindmapData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No mindmap data available. Make sure you've completed the previous steps.
      </Alert>
    );
  }

  const { statistics } = mindmapData;

  return (
    <Box sx={{ height: '80vh', width: '100%' }}>
      {/* Statistics Header */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: '#1a1a2e', color: 'white' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            🧠 Interactive Mindmap: {mindmapData.project.name}
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search functions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#aaa' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#555' },
                  '&:hover fieldset': { borderColor: '#777' },
                  '&.Mui-focused fieldset': { borderColor: '#4ade80' },
                },
                width: '200px'
              }}
            />
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchMindmapData} sx={{ color: '#4ade80' }}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            label={`${statistics.totalNodes} Functions`}
            size="small"
            sx={{ bgcolor: '#4ade80', color: 'black' }}
          />
          <Chip
            label={`${statistics.totalRelationships} Dependencies`}
            size="small"
            sx={{ bgcolor: '#60a5fa', color: 'black' }}
          />
          <Chip
            label={`${statistics.entryPoints} Entry Points`}
            size="small"
            sx={{ bgcolor: '#f59e0b', color: 'black' }}
          />
          <Chip
            label={`${statistics.executionLayers} Layers`}
            size="small"
            sx={{ bgcolor: '#ec4899', color: 'black' }}
          />
          <Chip
            label={`${statistics.criticalFunctions} Critical`}
            size="small"
            sx={{ bgcolor: '#ef4444', color: 'white' }}
          />
          {statistics.modules.map((module) => (
            <Chip
              key={module}
              label={module}
              size="small"
              onClick={() => setFilterModule(filterModule === module ? '' : module)}
              sx={{ 
                bgcolor: filterModule === module ? '#fff' : getModuleColor(module),
                color: filterModule === module ? 'black' : 'white',
                fontSize: '0.7rem',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* Interactive Graph */}
      <Paper sx={{ height: 'calc(100% - 100px)', bgcolor: '#0f0f23' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          attributionPosition="bottom-left"
          style={{ background: '#0f0f23' }}
        >
          <Controls />
          <MiniMap 
            style={{ 
              backgroundColor: '#1a1a2e',
              border: '1px solid #333'
            }}
            nodeColor={(node) => {
              const module = node.data?.module || 'unknown';
              return getModuleColor(module);
            }}
          />
          <Background 
            gap={20} 
            size={1} 
            color="#333"
          />
        </ReactFlow>
      </Paper>
    </Box>
  );
};

export default InteractiveMindmap;