import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useReactFlow,
    BackgroundVariant,
    MarkerType,
    ReactFlowProvider,
} from 'reactflow';
import type { Node, Edge, NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';
import FunctionNode from '../Mindmap/FunctionNode';
import './ExecutionSequenceVisualization.css';

interface ExecutionSequenceData {
    id: string;
    name: string;
    filePath: string;
    module: string;
    language: string;
    starts: number;
    ends: number;
    functionType: string;
    complexity: number;
    isEntryPoint: boolean;
    dependsOnCount: number;
    usedByCount: number;
    totalConnections: number;
    executionLevel: number;
    callDepth: number;
    isLeafFunction: boolean;
    executionPath: string[];
    hierarchyId: string;
}

interface MindmapData {
    nodes: ExecutionSequenceData[];
    relationships: Array<{
        source: string;
        target: string;
        sourceName: string;
        targetName: string;
        sourceModule: string;
        targetModule: string;
        calledAtLine: number;
        targetStarts: number;
        targetEnds: number;
        type: string;
        isCrossModule: boolean;
    }>;
}

const nodeTypes: NodeTypes = {
    functionNode: FunctionNode,
};

// Inner component that uses React Flow hooks
const ExecutionSequenceFlow: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<ExecutionSequenceData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredNodes, setFilteredNodes] = useState<Node[]>([]);
    const [showOnlyEntryPoints, setShowOnlyEntryPoints] = useState(false);
    const [groupByLevel, setGroupByLevel] = useState(true);
    const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
    const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<string[]>([]);
    // const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set()); // TODO: Implement expand/collapse
    const [searchDebounce, setSearchDebounce] = useState<number | null>(null);

    const { fitView } = useReactFlow();


    // Transform backend data to React Flow format
    const transformDataToReactFlow = (data: MindmapData, groupByLevelValue: boolean) => {
        const flowNodes: Node[] = data.nodes.map((node, index) => {
            // Calculate position based on execution level and index
            const level = node.executionLevel || 0;
            const levelNodes = data.nodes.filter(n => (n.executionLevel || 0) === level);
            const nodeIndex = levelNodes.findIndex(n => n.id === node.id);

            // Better tree-like spacing
            const levelWidth = 350; // Increased spacing between levels
            const nodeSpacing = 120; // Vertical spacing between nodes
            const maxNodesPerLevel = 4; // Max nodes per level before wrapping

            const x = groupByLevelValue ? level * levelWidth : index * 200;
            const y = groupByLevelValue ? (nodeIndex % maxNodesPerLevel) * nodeSpacing : level * nodeSpacing;

            return {
                id: node.id,
                type: 'functionNode',
                position: { x, y },
                data: {
                    ...node,
                    // Add visual indicators based on execution sequence
                    isEntryPoint: node.isEntryPoint,
                    executionLevel: node.executionLevel,
                    callDepth: node.callDepth,
                    isLeafFunction: node.isLeafFunction,
                    executionPath: node.executionPath,
                    hierarchyId: node.hierarchyId,
                },
            };
        });

        const flowEdges: Edge[] = data.relationships.map((rel, index) => ({
            id: `edge-${index}`,
            source: rel.source,
            target: rel.target,
            type: 'smoothstep',
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 12,
                height: 12,
                color: '#6b7280',
            },
            style: {
                strokeWidth: 1.5,
                stroke: '#6b7280',
                opacity: 0.7,
            },
        }));

        return { nodes: flowNodes, edges: flowEdges };
    };

    // Fetch data from backend
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(
                'http://localhost:3000/preprocess/getMindmapData?project=test&repo=test&username=praveen-ncompass'
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.data?.mindmap) {
                throw new Error('Invalid data format received');
            }

            const data: MindmapData = result.data.mindmap;
            console.log('📊 Execution sequence data:', data);

            // Transform data to React Flow format
            const { nodes: flowNodes, edges: flowEdges } = transformDataToReactFlow(data, groupByLevel);
            setNodes(flowNodes);
            setEdges(flowEdges);
            setFilteredNodes(flowNodes);

        } catch (err) {
            console.error('Error fetching execution sequence data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }, [groupByLevel]);

    // Debounced search with connected node highlighting
    useEffect(() => {
        if (searchDebounce) {
            clearTimeout(searchDebounce);
        }

        const timeout = setTimeout(() => {
            let filtered = nodes;
            // let searchHighlightedNodes: string[] = []; // TODO: Use for search highlighting

            // Filter by search term
            if (searchTerm) {
                const matchingNodes = nodes.filter(node =>
                    node.data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    node.data.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    node.data.module.toLowerCase().includes(searchTerm.toLowerCase())
                );

                // Get all connected nodes
                const connectedNodeIds = new Set<string>();
                matchingNodes.forEach(node => {
                    connectedNodeIds.add(node.id);
                    // Add nodes that connect to this node
                    edges.forEach(edge => {
                        if (edge.source === node.id) connectedNodeIds.add(edge.target);
                        if (edge.target === node.id) connectedNodeIds.add(edge.source);
                    });
                });

                // searchHighlightedNodes = Array.from(connectedNodeIds);
                filtered = nodes.filter(node => connectedNodeIds.has(node.id));
            }

            // Filter by entry points only
            if (showOnlyEntryPoints) {
                filtered = filtered.filter(node => node.data.isEntryPoint);
            }

            setFilteredNodes(filtered);

            // Update search highlighting
            if (searchTerm) {
                setHighlightedNodeId(null); // Clear previous selection
                setHighlightedEdgeIds([]);
            }
        }, 300); // 300ms debounce

        setSearchDebounce(timeout);

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [nodes, searchTerm, showOnlyEntryPoints, edges, searchDebounce]);

    // Handle node click with highlighting
    const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNode(node.data as ExecutionSequenceData);
        setHighlightedNodeId(node.id);

        // Find connected edges
        const connectedEdges = edges.filter(edge =>
            edge.source === node.id || edge.target === node.id
        );
        setHighlightedEdgeIds(connectedEdges.map(edge => edge.id));
    }, [edges]);

    // Handle background click to clear selection
    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
        setHighlightedNodeId(null);
        setHighlightedEdgeIds([]);
    }, []);

    // Handle mini map click (removed unused function)

    // Auto-fit view when data changes
    useEffect(() => {
        if (filteredNodes.length > 0) {
            setTimeout(() => {
                fitView({ padding: 0.1, minZoom: 0.01, maxZoom: 3 });
            }, 100);
        }
    }, [filteredNodes, fitView]);

    // Load data on component mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="execution-sequence-container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading execution sequence data...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="execution-sequence-container">
                <div className="error">
                    <h3>Error Loading Data</h3>
                    <p>{error}</p>
                    <button onClick={fetchData} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="execution-sequence-container">
            {/* Header */}
            <div className="header">
                <h1>Execution Sequence Visualization</h1>
                <p>Hierarchical view of function execution flow</p>
            </div>

            {/* Controls */}
            <div className="controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search functions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-controls">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={showOnlyEntryPoints}
                            onChange={(e) => setShowOnlyEntryPoints(e.target.checked)}
                        />
                        Show only entry points
                    </label>

                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={groupByLevel}
                            onChange={(e) => setGroupByLevel(e.target.checked)}
                        />
                        Group by execution level
                    </label>
                </div>
            </div>

            {/* Stats */}
            <div className="stats">
                <div className="stat-item">
                    <span className="stat-label">Total Functions:</span>
                    <span className="stat-value">{nodes.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Filtered:</span>
                    <span className="stat-value">{filteredNodes.length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Entry Points:</span>
                    <span className="stat-value">{nodes.filter(n => n.data.isEntryPoint).length}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Max Level:</span>
                    <span className="stat-value">{Math.max(...nodes.map(n => n.data.executionLevel || 0))}</span>
                </div>
            </div>

            {/* React Flow */}
            <div className="flow-container">
                <ReactFlow
                    nodes={filteredNodes.map(node => ({
                        ...node,
                        data: {
                            ...node.data,
                            isHighlighted: highlightedNodeId === node.id,
                            isSearchMatch: searchTerm ?
                                node.data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                node.data.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                node.data.module.toLowerCase().includes(searchTerm.toLowerCase()) : false,
                        }
                    }))}
                    edges={edges.map(edge => ({
                        ...edge,
                        style: {
                            ...edge.style,
                            stroke: highlightedEdgeIds.includes(edge.id) ? '#3b82f6' : '#6b7280',
                            strokeWidth: highlightedEdgeIds.includes(edge.id) ? 3 : 1.5,
                            opacity: highlightedEdgeIds.includes(edge.id) ? 1 : 0.7,
                        }
                    }))}
                    onNodeClick={handleNodeClick}
                    onPaneClick={handlePaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                    minZoom={0.01}
                    maxZoom={3}
                    nodesDraggable={true}
                    panOnDrag={true}
                    zoomOnScroll={true}
                    zoomOnPinch={true}
                    deleteKeyCode={null}
                    multiSelectionKeyCode={null}
                >
                    <Background variant={BackgroundVariant.Dots} />
                    <Controls />
                </ReactFlow>
            </div>

            {/* Node Details Panel */}
            {selectedNode && (
                <div className="node-details-panel">
                    <div className="panel-header">
                        <h3>Function Details</h3>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="close-button"
                        >
                            ×
                        </button>
                    </div>

                    <div className="panel-content">
                        <div className="detail-section">
                            <h4>Basic Info</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Name:</span>
                                    <span className="detail-value">{selectedNode.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">File:</span>
                                    <span className="detail-value">{selectedNode.filePath}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Module:</span>
                                    <span className="detail-value">{selectedNode.module}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Type:</span>
                                    <span className="detail-value">{selectedNode.functionType}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Execution Sequence</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Execution Level:</span>
                                    <span className="detail-value">{selectedNode.executionLevel}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Call Depth:</span>
                                    <span className="detail-value">{selectedNode.callDepth}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Entry Point:</span>
                                    <span className="detail-value">{selectedNode.isEntryPoint ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Leaf Function:</span>
                                    <span className="detail-value">{selectedNode.isLeafFunction ? 'Yes' : 'No'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Execution Path</h4>
                            <div className="execution-path">
                                {selectedNode.executionPath.map((step, index) => (
                                    <React.Fragment key={index}>
                                        <span className="path-step">{step}</span>
                                        {index < selectedNode.executionPath.length - 1 && (
                                            <span className="path-arrow">→</span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="detail-section">
                            <h4>Connections</h4>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Depends On:</span>
                                    <span className="detail-value">{selectedNode.dependsOnCount}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Used By:</span>
                                    <span className="detail-value">{selectedNode.usedByCount}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Total:</span>
                                    <span className="detail-value">{selectedNode.totalConnections}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main component wrapped with ReactFlowProvider
export const ExecutionSequenceVisualization: React.FC = () => {
    return (
        <ReactFlowProvider>
            <ExecutionSequenceFlow />
        </ReactFlowProvider>
    );
};
