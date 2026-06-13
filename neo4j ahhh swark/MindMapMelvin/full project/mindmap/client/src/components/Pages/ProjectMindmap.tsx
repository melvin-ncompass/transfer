/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import ReactFlow, {
    type Node,
    type Edge,
    useNodesState,
    useEdgesState,
    Controls,
    MiniMap,
    Background,
    ReactFlowProvider,
    MarkerType,
    BackgroundVariant,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useSessionStorage, useFetch, useDebounce } from '../../hooks';
import { AnimatedSVGEdge, FunctionNode } from '../Mindmap';
import useCodeDetails from '../../hooks/useCodeDetails';
import './ProjectMindmap.css';



// 🎨 Step 6: Rich Custom Function Node Component


const nodeTypes = {
    functionNode: FunctionNode,
};

const edgeTypes = {
    animatedSVGEdge: AnimatedSVGEdge,
};

// 🎯 Step 3: Data Fetching from Backend
const ProjectMindmapInner = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [highlightedEdges, setHighlightedEdges] = useState<string[]>([]);
    // const [codeDetails, setCodeDetails] = useState<any>(null);
    // const [loadingCode, setLoadingCode] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCentering, setIsCentering] = useState(false);
    const [allNodes, setAllNodes] = useState<Node[]>([]);
    const [allEdges, setAllEdges] = useState<Edge[]>([]);
    const [matchingNodes, setMatchingNodes] = useState<Node[]>([]);
    const [allConnectedNodes, setAllConnectedNodes] = useState<Node[]>([]);
    const [connectedEdges, setConnectedEdges] = useState<Edge[]>([]);

    const { setCenter, fitView } = useReactFlow();
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { fetchData } = useFetch();
    const { sessionUser, sessionRepo } = useSessionStorage();

    const { codeDetails, setCodeDetails, fetchCodeDetails, loadingCode } = useCodeDetails();

    // Fetch data from backend
    useEffect(() => {
        const fetchMindmapData = async () => {
            try {
                setLoading(true);
                console.log('🔍 Fetching mindmap data...');

                const result = await fetchData(
                    `preprocess/getMindmapData?repo=${sessionRepo()}&username=${sessionUser()}`,
                );

                // Transform backend data to React Flow format
                const nodes = result.data.mindmap.nodes;
                const relationships = result.data.mindmap.relationships;

                console.log('🔍 Nodes:', nodes);
                console.log('🔍 Relationships:', relationships);

                // Create a tree layout based on dependencies
                const nodeMap = new Map();
                nodes.forEach((node: any) => {
                    nodeMap.set(node.id, { ...node, children: [], level: 0 });
                });

                // Build the tree structure with cycle detection
                relationships.forEach((rel: any) => {
                    const parent = nodeMap.get(rel.source);
                    const child = nodeMap.get(rel.target);
                    if (parent && child && parent.id !== child.id) { // Prevent self-loops
                        parent.children.push(child);
                    }
                });

                // Find root nodes (nodes with no incoming edges)
                const rootNodes = nodes.filter((node: any) =>
                    !relationships.some((rel: any) => rel.target === node.id)
                );

                // Calculate levels and positions
                const positions = new Map();
                let maxLevel = 0;

                const calculatePositions = (node: any, level: number, xOffset: number, visited = new Set()) => {
                    // Prevent infinite recursion with cycle detection
                    if (visited.has(node.id)) {
                        console.warn(`Cycle detected for node ${node.id}, skipping`);
                        return;
                    }

                    visited.add(node.id);
                    node.level = level;
                    maxLevel = Math.max(maxLevel, level);

                    // Position nodes in levels (left to right) with better vertical distribution
                    const x = level * 2000 + 200;

                    // More spread out vertically  
                    const y = xOffset * 200 + 300; // Increased vertical spacing for better top-to-bottom distribution

                    positions.set(node.id, { x, y });

                    // Position children with better vertical distribution
                    let childOffset = xOffset;
                    const childSpacing = Math.max(3, Math.ceil(node.children.length / 2)); // Increased spacing for better width utilization
                    node.children.forEach((child: any) => {
                        calculatePositions(child, level + 1, childOffset, new Set(visited));
                        childOffset += childSpacing; // Increased spacing between children
                    });
                };

                // Start positioning from root nodes with error handling
                try {
                    let rootOffset = 0;
                    rootNodes.forEach((root: any) => {
                        const rootNode = nodeMap.get(root.id);
                        if (rootNode) {
                            calculatePositions(rootNode, 0, rootOffset);
                            rootOffset += Math.max(4, rootNode.children.length + 2); // Increased spacing for better width utilization
                        }
                    });
                } catch (error) {
                    console.warn('Tree layout failed, using grid layout:', error);
                    // Clear positions to force grid layout
                    positions.clear();
                }

                // Create the transformed nodes with fallback grid layout for many nodes
                const transformedNodes: Node[] = nodes.map((node: any, index: number) => {
                    let pos = positions.get(node.id);

                    // Fallback to grid layout if position not calculated (for disconnected nodes)
                    if (!pos) {
                        const cols = Math.ceil(Math.sqrt(nodes.length));
                        const col = index % cols;
                        const row = Math.floor(index / cols);
                        pos = {
                            x: col * 300 + 300, // Increased horizontal spacing to use more width
                            y: row * 180 + 200  // Increased vertical spacing for better distribution
                        };
                    }

                    return {
                        id: node.id,
                        type: 'functionNode',
                        position: pos,
                        data: {
                            name: node.name,
                            module: node.module || 'unknown',
                            level: nodeMap.get(node.id)?.level || 0,
                            relativePath: node.relativePath || null
                        },
                    };
                });

                const transformedEdges: Edge[] = relationships.map((rel: any, index: number) => ({
                    id: `edge-${index}`,
                    source: rel.source,
                    target: rel.target,
                    type: 'default',
                    style: {
                        stroke: '#333',
                        strokeWidth: 2,
                        opacity: 0.8
                    },
                    label: rel.type === 'DEPENDS_ON' ? 'depends on' : 'used by',
                    labelStyle: {
                        fontSize: '10px',
                        fontWeight: 'bold',
                        fill: '#333',
                        // background: 'white',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        border: '1px solid #ccc'
                    },
                    labelBgStyle: { 
                        // fill: 'white', 
                        fillOpacity: 0.8 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#333',
                        width: 20,
                        height: 20,
                    },
                }));

                // Store all data for search functionality
                setAllNodes(transformedNodes);
                setAllEdges(transformedEdges);

                // Initially show all nodes
                setMatchingNodes([]);
                setAllConnectedNodes(transformedNodes);
                setConnectedEdges(transformedEdges);
                setNodes(transformedNodes);
                setEdges(transformedEdges);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');

                // Fallback to hardcoded data
                const fallbackNodes: Node[] = [
                    {
                        id: '1',
                        type: 'functionNode',
                        position: { x: 100, y: 100 },
                        data: { name: 'loginUser', module: 'auth' },
                    },
                    {
                        id: '2',
                        type: 'functionNode',
                        position: { x: 400, y: 100 },
                        data: { name: 'validateToken', module: 'auth' },
                    },
                ];
                const fallbackEdges: Edge[] = [
                    {
                        id: 'e1-2',
                        source: '1',
                        target: '2',
                        type: 'straight',
                        style: { stroke: '#333', strokeWidth: 2 },
                        label: 'depends on',
                        labelStyle: {
                            fontSize: '10px',
                            fontWeight: 'bold',
                            fill: '#333',
                            // background: 'white',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            border: '1px solid #ccc'
                        },
                        labelBgStyle: { 
                            // fill: 'white', 
                            fillOpacity: 0.8 },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: '#333',
                            width: 20,
                            height: 20,
                        },
                    },
                ];
                // Store fallback data for search functionality
                setAllNodes(fallbackNodes);
                setAllEdges(fallbackEdges);
                setMatchingNodes([]);
                setAllConnectedNodes(fallbackNodes);
                setConnectedEdges(fallbackEdges);
                setNodes(fallbackNodes);
                setEdges(fallbackEdges);
            } finally {
                setLoading(false);
            }
        };

        fetchMindmapData();
    }, []);


    // Search and filter logic
    useEffect(() => {
        if (debouncedSearchQuery.trim() === '') {
            // Show all nodes when search is empty
            setMatchingNodes([]);
            setAllConnectedNodes(allNodes);
            setConnectedEdges(allEdges);
            setNodes(allNodes);
            setEdges(allEdges);

            // Auto-center all nodes when clearing search
            setIsCentering(true);
            setTimeout(() => {
                if (allNodes.length > 0) {
                    fitView({
                        padding: 0.02, // Minimal padding to maximize screen usage
                        duration: 800,
                        minZoom: 0.01, // Much lower minimum zoom to allow proper zooming out
                        maxZoom: 3
                    });
                }
                setTimeout(() => setIsCentering(false), 900); // Hide indicator after animation
            }, 100);

            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const query = debouncedSearchQuery.toLowerCase();

        // Find matching nodes
        const foundMatchingNodes = allNodes.filter(node =>
            node.data.name.toLowerCase().includes(query) ||
            node.data.module.toLowerCase().includes(query)
        );

        const matchingNodeIds = new Set(foundMatchingNodes.map(node => node.id));

        // Find edges connected to matching nodes
        const connectedEdges = allEdges.filter(edge =>
            matchingNodeIds.has(edge.source) || matchingNodeIds.has(edge.target)
        );

        // Find ALL nodes that are connected to matching nodes (including the connected nodes themselves)
        const connectedNodeIds = new Set<string>();
        matchingNodeIds.forEach(id => connectedNodeIds.add(id)); // Add matching nodes
        connectedEdges.forEach(edge => {
            connectedNodeIds.add(edge.source); // Add source nodes
            connectedNodeIds.add(edge.target); // Add target nodes
        });

        // Get all connected nodes (matching + connected)
        const foundAllConnectedNodes = allNodes.filter(node => connectedNodeIds.has(node.id));

        console.log('🔍 Search Debug:');
        console.log('  Matching nodes:', foundMatchingNodes.length, foundMatchingNodes.map(n => n.id));
        console.log('  Matching node IDs:', Array.from(matchingNodeIds));
        console.log('  Connected node IDs:', Array.from(connectedNodeIds));
        console.log('  All connected nodes:', foundAllConnectedNodes.length, foundAllConnectedNodes.map(n => n.id));
        console.log('  All edges:', allEdges.length);
        console.log('  Connected edges:', connectedEdges.length, connectedEdges.map(e => `${e.source} -> ${e.target}`));

        // Debug: Check if any edges have matching source/target
        const debugEdges = allEdges.filter(edge => {
            const hasSource = matchingNodeIds.has(edge.source);
            const hasTarget = matchingNodeIds.has(edge.target);
            if (hasSource || hasTarget) {
                console.log(`  ✅ Edge ${edge.id}: ${edge.source} -> ${edge.target} (source: ${hasSource}, target: ${hasTarget})`);
            }
            return hasSource || hasTarget;
        });
        console.log('  Debug filtered edges:', debugEdges.length);

        // Update state variables
        setMatchingNodes(foundMatchingNodes);
        setAllConnectedNodes(foundAllConnectedNodes);
        setConnectedEdges(connectedEdges);

        // Update React Flow data - show ALL connected nodes, not just matching ones
        setNodes(foundAllConnectedNodes);
        setEdges(connectedEdges);

        // Auto-center the filtered content for better user experience
        setIsCentering(true);
        setTimeout(() => {
            if (foundAllConnectedNodes.length > 0) {
                fitView({
                    padding: 0.02, // Minimal padding to maximize screen usage
                    duration: 800, // Smooth animation
                    minZoom: 0.01, // Much lower minimum zoom to allow proper zooming out
                    maxZoom: 3
                });
            }
            setTimeout(() => setIsCentering(false), 900); // Hide indicator after animation
        }, 100); // Small delay to ensure nodes are rendered

        setIsSearching(false);
    }, [debouncedSearchQuery, allNodes, allEdges, setNodes, setEdges, fitView]);

    const handleNodeClick = (_event: React.MouseEvent, node: any) => {
        setSelectedNode(node.id);

        // Find connected edges
        const connectedEdges = edges.filter(edge =>
            edge.source === node.id || edge.target === node.id
        );
        setHighlightedEdges(connectedEdges.map(edge => edge.id));

        // Fetch code details if we have a relativePath
        if (node.data.relativePath) {
            fetchCodeDetails(node.id, node.data.relativePath);
        } else {
            console.log('⚠️ No relativePath found for node:', node);
            setCodeDetails(null);
        }
    };

    // Handle background click to deselect
    const handlePaneClick = () => {
        setSelectedNode(null);
        setHighlightedEdges([]);
        setCodeDetails(null);
    };


    const handleMiniMapClick = (_event: any, position: any) => {
        console.log('🗺️ MiniMap clicked at:', position);
        setCenter(position.x, position.y, { zoom: 0.25 });
        // The MiniMap will automatically handle the navigation
    };
    // Define custom node types


    return (
        <div className="project-mindmap-container">
            {/* Header */}
            <div className="project-mindmap-header">
                {/* <h1 className="project-mindmap-title">
                     Project Mindmap
                </h1> */}

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '10px'
                }}>

                </div>
                {/* Controls */}
                <div className="ackheader-controls">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search functions or modules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`search-input ${searchQuery
                                ? (isCentering ? 'centering' : 'searching')
                                : 'normal'
                                }`}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="search-clear-button"
                            >
                                ✕
                            </button>
                        )}
                        {searchQuery && (
                            <div className="search-results">
                                {isSearching ? 'Searching...' :
                                    isCentering ? 'Centering view...' :
                                        `Found ${matchingNodes.length} matching + ${allConnectedNodes.length - matchingNodes.length} connected nodes, ${connectedEdges.length} connections`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="stats-container">
                <div className="stat-item">
                    📊 {searchQuery ? `${allConnectedNodes.length} of ${allNodes.length}` : allNodes.length} nodes
                </div>
                <div className={`stat-item ${searchQuery ? 'search-active' : ''}`}>
                    🔗 {searchQuery ? `${connectedEdges.length} of ${allEdges.length}` : allEdges.length} connections
                </div>
                {searchQuery && (
                    <div className="search-active-badge">
                        🔍 Search Active
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Left Panel - Selection Info */}
                <div className="left-panel">
                    {selectedNode ? (
                        <div>
                            <div className="selected-function-header">
                                <h3 className="selected-function-title">🎯 Selected Function</h3>
                                <div className="selected-function-name">{selectedNode}</div>
                                <div className="selected-function-connections">
                                    {highlightedEdges.length} connections
                                </div>
                            </div>

                            {loadingCode && (
                                <div className="loading-code">
                                    <div className="loading-code-icon">⏳</div>
                                    <div>Loading code details...</div>
                                </div>
                            )}

                            {codeDetails && (
                                <div className="code-details-panel">
                                    <h3 className="code-details-title">
                                        📝 Code Details
                                    </h3>

                                    {codeDetails.error ? (
                                        <div className="code-error">
                                            <div className="code-error-icon">❌</div>
                                            <div className="code-error-title">Error Loading Code</div>
                                            <div className="code-error-message">{codeDetails.error}</div>
                                        </div>
                                    ) : (
                                        <div>
                                            {/* Function Name */}
                                            <div className="function-name-section">
                                                <div className="function-name-label">
                                                    Function Name :
                                                </div>
                                                <div className="function-name-value">
                                                    {codeDetails.functionName}
                                                </div>
                                            </div>

                                            {/* File Path */}
                                            <div className="file-path-section">
                                                <div className="file-path-label">
                                                    File Location : 
                                                </div>
                                                <div className="file-path-value">
                                                    {codeDetails.filePath}
                                                </div>
                                            </div>

                                            {/* Purpose/Description */}
                                            <div className="purpose-section">
                                                <div className="purpose-label">
                                                    Purpose & Description :
                                                </div>
                                                <div className="purpose-value">
                                                    {codeDetails.purpose}
                                                </div>
                                            </div>

                                            {/* Code Viewer */}
                                            <details className="code-viewer">
                                                <summary className="code-viewer-summary">
                                                    <span>🔍</span>
                                                    <span>View Source Code</span>
                                                </summary>
                                                <div className="code-viewer-content">
                                                    <div className="code-block">
                                                        {codeDetails.codeBlock}
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🎯</div>
                            <h3 className="empty-state-title">Select a Function</h3>
                            <p className="empty-state-description">
                                Click on any function node to view its details and code
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Panel - Mindmap */}
                <div className="right-panel">

                    {loading && (
                        <div className="loading-state">
                            <div className="loading-icon">⏳</div>
                            <div className="loading-title">Loading Project Data</div>
                            <div className="loading-description">Fetching functions and relationships...</div>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <div className="error-icon">❌</div>
                            <div className="error-title">Error Loading Data</div>
                            <div className="error-message">{error}</div>
                            <div className="error-fallback">
                                Using fallback data instead
                            </div>
                        </div>
                    )}

                    {!loading && !error && (
                        <ReactFlow
                            nodes={nodes.map(node => {
                                const isMatching = matchingNodes.some(matchingNode => matchingNode.id === node.id);
                                return {
                                    ...node,
                                    data: {
                                        ...node.data,
                                        selected: selectedNode === node.id,
                                        isMatching: isMatching
                                    }
                                };
                            })}
                            edges={edges.map(edge => {
                                const isHighlighted = highlightedEdges.includes(edge.id);
                                return {
                                    ...edge,
                                    style: {
                                        ...edge.style,
                                        stroke: isHighlighted ? '#ff6b6b' : searchQuery ? '#10b981' : '#333',
                                        strokeWidth: isHighlighted ? 4 : searchQuery ? 3 : 2,
                                        opacity: isHighlighted ? 1 : searchQuery ? 0.9 : 0.8,
                                    }
                                };
                            })}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onNodeClick={handleNodeClick}
                            onPaneClick={handlePaneClick}
                            nodeTypes={nodeTypes}
                            // edgeTypes={edgeTypes}
                            fitView
                            style={{ background: 'transparent' }}
                            nodesDraggable={true}
                            nodesConnectable={false}
                            elementsSelectable={true}
                            panOnDrag={true}
                            zoomOnScroll={true}
                            panOnScroll={false}
                            selectNodesOnDrag={false}
                            minZoom={0.01}
                            maxZoom={3}
                        >
                            <Controls
                                className="react-flow-controls"
                            />
                            <MiniMap
                                className="react-flow-minimap"
                                nodeColor={(node) => {
                                    const module = node.data?.module || 'unknown';
                                    const colors = {
                                        'auth': '#e74c3c',
                                        'user': '#3498db',
                                        'api': '#2ecc71',
                                        'utils': '#f39c12',
                                        'controller': '#9b59b6',
                                        'service': '#1abc9c',
                                        'unknown': '#95a5a6'
                                    };
                                    return colors[module as keyof typeof colors] || colors.unknown;
                                }}
                                onClick={handleMiniMapClick}
                            />
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={20}
                                size={1.5}
                                color="#e2e8f0"
                            />
                        </ReactFlow>
                    )}
                </div>
            </div>
        </div>
    );
};

// 🎯 Wrapped Component
const ProjectMindmap = () => {
    return (
        <ReactFlowProvider>
            <ProjectMindmapInner />
        </ReactFlowProvider>
    );
};

export default ProjectMindmap;
