import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
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

// Type definitions for better type safety
interface MindmapNode {
    id: string;
    name: string;
    module?: string;
    relativePath?: string;
}

interface MindmapRelationship {
    source: string;
    target: string;
    type: string;
}



interface MindmapData {
    allNodes: Node[];
    allEdges: Edge[];
    filteredNodes: Node[];
    filteredEdges: Edge[];
}

// Node and edge types
const nodeTypes = {
    functionNode: FunctionNode,
};

const edgeTypes = {
    animatedSVGEdge: AnimatedSVGEdge,
};

// Optimized ProjectMindmap Inner Component
const ProjectMindmapInner = memo(() => {
    // React Flow state
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    
    // Component state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [highlightedEdges, setHighlightedEdges] = useState<string[]>([]);
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCentering, setIsCentering] = useState(false);
    
    // Consolidated mindmap data
    const [mindmapData, setMindmapData] = useState<MindmapData>({
        allNodes: [],
        allEdges: [],
        filteredNodes: [],
        filteredEdges: []
    });

    // Hooks
    const { setCenter, fitView } = useReactFlow();
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const { fetchData } = useFetch();
    const { sessionUser, sessionRepo } = useSessionStorage();
    const { codeDetails, setCodeDetails, fetchCodeDetails, loadingCode } = useCodeDetails();

    // Memoized module colors for better performance
    const moduleColors = useMemo(() => ({
        'auth': '#e74c3c',
        'user': '#3498db',
        'api': '#2ecc71',
        'utils': '#f39c12',
        'controller': '#9b59b6',
        'service': '#1abc9c',
        'unknown': '#95a5a6'
    }), []);

    // Optimized tree layout calculation
    const calculateNodePositions = useCallback((nodes: MindmapNode[], relationships: MindmapRelationship[]) => {
        const nodeMap = new Map<string, MindmapNode & { children: MindmapNode[]; level: number }>();
        const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
        
        // Initialize node map
        sortedNodes.forEach((node) => {
            nodeMap.set(node.id, { ...node, children: [], level: 0 });
        });

        // Build tree structure with cycle detection
        const processedRelationships = new Set<string>();
        relationships.forEach((rel) => {
            const relKey = `${rel.source}-${rel.target}`;
            if (processedRelationships.has(relKey)) return;
            processedRelationships.add(relKey);

            const parent = nodeMap.get(rel.source);
            const child = nodeMap.get(rel.target);
            if (parent && child && parent.id !== child.id) {
                parent.children.push(child);
            }
        });

        // Find root nodes
        const rootNodes = nodes.filter((node) =>
            !relationships.some((rel) => rel.target === node.id)
        ).sort((a, b) => a.id.localeCompare(b.id));

        // Calculate positions using optimized algorithm
        const positions = new Map<string, { x: number; y: number }>();
        
        const positionNodes = (node: MindmapNode & { children: MindmapNode[]; level: number }, level: number, xOffset: number, visited = new Set<string>()) => {
            if (visited.has(node.id)) return;
            visited.add(node.id);

            node.level = level;
            const x = level * 400 + 200;
            const y = xOffset * 120 + 200;
            positions.set(node.id, { x, y });

            // Position children
            let childOffset = xOffset;
            const childSpacing = Math.max(2, Math.ceil(node.children.length / 3));
            const sortedChildren = [...node.children].sort((a, b) => a.id.localeCompare(b.id));
            
            sortedChildren.forEach((child) => {
                const childNode = nodeMap.get(child.id);
                if (childNode) {
                    positionNodes(childNode, level + 1, childOffset, visited);
                    childOffset += childSpacing;
                }
            });
        };

        // Position from root nodes
        let rootOffset = 0;
        rootNodes.forEach((root) => {
            const rootNode = nodeMap.get(root.id);
            if (rootNode) {
                positionNodes(rootNode, 0, rootOffset);
                rootOffset += Math.max(2, rootNode.children.length + 1);
            }
        });

        return { positions, nodeMap };
    }, []);

    // Optimized node transformation
    const transformNodes = useCallback((nodes: MindmapNode[], positions: Map<string, { x: number; y: number }>, nodeMap: Map<string, any>): Node[] => {
        return nodes.map((node, index) => {
            let pos = positions.get(node.id);

            // Fallback grid layout
            if (!pos) {
                const cols = Math.ceil(Math.sqrt(nodes.length));
                const col = index % cols;
                const row = Math.floor(index / cols);
                pos = {
                    x: col * 350 + 200,
                    y: row * 150 + 200
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
    }, []);

    // Optimized edge transformation
    const transformEdges = useCallback((relationships: MindmapRelationship[]): Edge[] => {
        return relationships.map((rel, index) => ({
            id: `edge-${index}`,
            source: rel.source,
            target: rel.target,
            type: 'straight',
            style: {
                stroke: '#666',
                strokeWidth: 1.5,
                opacity: 0.9
            },
            label: rel.type === 'DEPENDS_ON' ? 'depends on' : 'used by',
            labelStyle: {
                fontSize: '10px',
                fontWeight: 'bold',
                fill: '#333',
                background: 'white',
                padding: '2px 4px',
                borderRadius: '2px',
                border: '1px solid #ccc'
            },
            labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#333',
                width: 20,
                height: 20,
            },
        }));
    }, []);

    // Optimized data fetching
    const fetchMindmapData = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching mindmap data...');

            // Check if session data is available
            const repo = sessionRepo();
            const username = sessionUser();
            
            if (!repo || !username) {
                console.warn('⚠️ Session data not available:', { repo, username });
                throw new Error('Session data not available. Please log in and select a repository.');
            }

            const result = await fetchData(
                `preprocess/getMindmapData?repo=${repo}&username=${username}`,
            );

            // Check if result is valid and has the expected structure
            if (!result || !result.data || !result.data.mindmap) {
                console.warn('⚠️ Invalid API response:', result);
                throw new Error('Invalid response from server. Please try again.');
            }

            const nodes: MindmapNode[] = result.data.mindmap.nodes || [];
            const relationships: MindmapRelationship[] = result.data.mindmap.relationships || [];

            console.log('🔍 Nodes:', nodes);
            console.log('🔍 Relationships:', relationships);

            // Handle empty data
            if (nodes.length === 0) {
                console.warn('⚠️ No nodes found in response');
                throw new Error('No function data found for this repository.');
            }

            // Use optimized calculation functions
            const { positions, nodeMap } = calculateNodePositions(nodes, relationships);
            const transformedNodes = transformNodes(nodes, positions, nodeMap);
            const transformedEdges = transformEdges(relationships);

            // Update consolidated state
            setMindmapData({
                allNodes: transformedNodes,
                allEdges: transformedEdges,
                filteredNodes: transformedNodes,
                filteredEdges: transformedEdges
            });

            setNodes(transformedNodes);
            setEdges(transformedEdges);
            setError(null);
        } catch (err) {
            console.error('❌ Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');

            // Fallback data
            const fallbackNodes: Node[] = [
                {
                    id: '1',
                    type: 'functionNode',
                    position: { x: 100, y: 100 },
                    data: { name: 'loginUser', module: 'auth', level: 0 },
                },
                {
                    id: '2',
                    type: 'functionNode',
                    position: { x: 400, y: 100 },
                    data: { name: 'validateToken', module: 'auth', level: 0 },
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
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#333',
                        width: 20,
                        height: 20,
                    },
                },
            ];

            setMindmapData({
                allNodes: fallbackNodes,
                allEdges: fallbackEdges,
                filteredNodes: fallbackNodes,
                filteredEdges: fallbackEdges
            });

            setNodes(fallbackNodes);
            setEdges(fallbackEdges);
        } finally {
            setLoading(false);
        }
    }, [fetchData, sessionRepo, sessionUser, calculateNodePositions, transformNodes, transformEdges]);

    // Effects
    useEffect(() => {
        // Add a small delay to ensure session storage is loaded
        const timer = setTimeout(() => {
            fetchMindmapData();
        }, 500);
        
        return () => clearTimeout(timer);
    }, []); // Empty dependency array to run only once on mount

    // Search and filter logic with performance optimization
    const performSearch = useCallback((query: string) => {
        setMindmapData(currentData => {
            if (query.trim() === '') {
                // Show all nodes when search is empty
                setNodes(currentData.allNodes);
                setEdges(currentData.allEdges);

                // Auto-center all nodes
                setIsCentering(true);
                setTimeout(() => {
                    if (currentData.allNodes.length > 0) {
                        fitView({
                            padding: 0.02,
                            duration: 800,
                            minZoom: 0.01,
                            maxZoom: 3
                        });
                    }
                    setTimeout(() => setIsCentering(false), 900);
                }, 100);

                return {
                    ...currentData,
                    filteredNodes: currentData.allNodes,
                    filteredEdges: currentData.allEdges
                };
            }

            setIsSearching(true);
            const searchTerm = query.toLowerCase();

            // Find matching nodes
            const matchingNodes = currentData.allNodes.filter(node =>
                node.data.name.toLowerCase().includes(searchTerm) ||
                node.data.module.toLowerCase().includes(searchTerm)
            );

            const matchingNodeIds = new Set(matchingNodes.map(node => node.id));

            // Find connected edges
            const connectedEdges = currentData.allEdges.filter(edge =>
                matchingNodeIds.has(edge.source) || matchingNodeIds.has(edge.target)
            );

            // Find all connected nodes
            const allConnectedNodeIds = new Set<string>();
            matchingNodeIds.forEach(id => allConnectedNodeIds.add(id));
            connectedEdges.forEach(edge => {
                allConnectedNodeIds.add(edge.source);
                allConnectedNodeIds.add(edge.target);
            });

            const allConnectedNodes = currentData.allNodes.filter(node => 
                allConnectedNodeIds.has(node.id)
            );

            // Update React Flow
            setNodes(allConnectedNodes.map(node => ({
                ...node,
                data: {
                    ...node.data,
                    isMatching: matchingNodeIds.has(node.id)
                }
            })));
            setEdges(connectedEdges);

            // Auto-center filtered content
            setIsCentering(true);
            setTimeout(() => {
                if (allConnectedNodes.length > 0) {
                    fitView({
                        padding: 0.02,
                        duration: 800,
                        minZoom: 0.01,
                        maxZoom: 3
                    });
                }
                setTimeout(() => setIsCentering(false), 900);
            }, 100);

            setTimeout(() => setIsSearching(false), 200);

            return {
                ...currentData,
                filteredNodes: allConnectedNodes,
                filteredEdges: connectedEdges
            };
        });
    }, [fitView, setNodes, setEdges]); // Safe dependencies that won't cause loops

    // Event handlers
    const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNode(node.id);

        // Find connected edges from current mindmap data
        setMindmapData(currentData => {
            const connectedEdges = currentData.filteredEdges.filter(edge =>
                edge.source === node.id || edge.target === node.id
            );
            setHighlightedEdges(connectedEdges.map(edge => edge.id));
            return currentData; // Return unchanged data
        });

        // Fetch code details if available
        if (node.data.relativePath) {
            fetchCodeDetails(node.id, node.data.relativePath);
        } else {
            console.log('⚠️ No relativePath found for node:', node);
            setCodeDetails(null);
        }
    }, [fetchCodeDetails, setCodeDetails]);

    const handlePaneClick = useCallback(() => {
        setSelectedNode(null);
        setHighlightedEdges([]);
        setCodeDetails(null);
    }, [setCodeDetails]);

    const handleMiniMapClick = useCallback((_event: any, position: any) => {
        console.log('🗺️ MiniMap clicked at:', position);
        setCenter(position.x, position.y, { zoom: 0.25 });
    }, [setCenter]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Search effect
    useEffect(() => {
        performSearch(debouncedSearchQuery);
    }, [debouncedSearchQuery]); // Remove performSearch dependency to prevent loops

    // Memoized node color function for MiniMap
    const getNodeColor = useCallback((node: Node) => {
        const module = node.data?.module || 'unknown';
        return moduleColors[module as keyof typeof moduleColors] || moduleColors.unknown;
    }, [moduleColors]);

    // Memoized enhanced nodes and edges for React Flow
    const enhancedNodes = useMemo(() => {
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                selected: selectedNode === node.id,
            }
        }));
    }, [nodes, selectedNode]);

    const enhancedEdges = useMemo(() => {
        return edges.map(edge => {
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
        });
    }, [edges, highlightedEdges, searchQuery]);

    return (
        <div className="project-mindmap-container">
            {/* Header */}
            <div className="project-mindmap-header">
                <h1 className="project-mindmap-title">
                    🧠 Project Mindmap
                </h1>

                {/* Controls */}
                <div className="header-controls">
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
                                onClick={clearSearch}
                                className="search-clear-button"
                            >
                                ✕
                            </button>
                        )}
                        {searchQuery && (
                            <div className="search-results">
                                {isSearching ? 'Searching...' :
                                    isCentering ? 'Centering view...' :
                                        `Found ${mindmapData.filteredNodes.filter(n => n.data.isMatching).length} matching + ${mindmapData.filteredNodes.length - mindmapData.filteredNodes.filter(n => n.data.isMatching).length} connected nodes, ${mindmapData.filteredEdges.length} connections`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="stats-container">
                <div className="stat-item">
                    📊 {searchQuery ? `${mindmapData.filteredNodes.length} of ${mindmapData.allNodes.length}` : mindmapData.allNodes.length} nodes
                </div>
                <div className={`stat-item ${searchQuery ? 'search-active' : ''}`}>
                    🔗 {searchQuery ? `${mindmapData.filteredEdges.length} of ${mindmapData.allEdges.length}` : mindmapData.allEdges.length} connections
                </div>
                {searchQuery && (
                    <div className="search-active-badge">
                        🔍 Search Active
                    </div>
                )}
                {/* Debug info for session values */}
                <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
                    Session: {sessionUser() || 'No user'} | {sessionRepo() || 'No repo'}
                </div>
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
                                                    Function Name
                                                </div>
                                                <div className="function-name-value">
                                                    {codeDetails.functionName}
                                                </div>
                                            </div>

                                            {/* File Path */}
                                            <div className="file-path-section">
                                                <div className="file-path-label">
                                                    File Location
                                                </div>
                                                <div className="file-path-value">
                                                    {codeDetails.filePath}
                                                </div>
                                            </div>

                                            {/* Purpose/Description */}
                                            <div className="purpose-section">
                                                <div className="purpose-label">
                                                    Purpose & Description
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
                            
                            {/* Show different messages based on error type */}
                            {error.includes('Session data not available') ? (
                                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                    <div className="error-help" style={{ 
                                        backgroundColor: '#fff3cd', 
                                        border: '1px solid #ffeaa7',
                                        borderRadius: '8px',
                                        padding: '15px',
                                        marginBottom: '15px',
                                        color: '#856404'
                                    }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                            📝 How to fix this:
                                        </div>
                                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                                            1. Make sure you're logged in<br/>
                                            2. Select a repository from the dashboard<br/>
                                            3. Navigate back to this page<br/>
                                            4. Click the retry button below
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: '#666', 
                                        marginBottom: '10px',
                                        fontFamily: 'monospace',
                                        backgroundColor: '#f8f9fa',
                                        padding: '8px',
                                        borderRadius: '4px'
                                    }}>
                                        Debug: User: {sessionUser() || 'null'} | Repo: {sessionRepo() || 'null'}
                                    </div>
                                    
                                    {/* Temporary testing helper */}
                                    <div style={{ 
                                        marginBottom: '15px', 
                                        padding: '10px', 
                                        backgroundColor: '#e3f2fd', 
                                        borderRadius: '6px',
                                        border: '1px solid #bbdefb'
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#1976d2' }}>
                                            🧪 Quick Test Setup:
                                        </div>
                                        <button
                                            onClick={() => {
                                                sessionStorage.setItem('username', 'test-user');
                                                sessionStorage.setItem('selected_repo', 'test-repo');
                                                console.log('Set test session data');
                                                fetchMindmapData();
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#1976d2',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                cursor: 'pointer',
                                                marginRight: '8px'
                                            }}
                                        >
                                            Set Test Data & Retry
                                        </button>
                                        <span style={{ fontSize: '11px', color: '#666' }}>
                                            (This will set dummy session data for testing)
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="error-fallback">
                                    Using fallback data instead
                                </div>
                            )}
                            
                            <button 
                                onClick={fetchMindmapData}
                                style={{
                                    marginTop: '10px',
                                    padding: '10px 20px',
                                    backgroundColor: '#3498db',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2980b9'}
                                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3498db'}
                            >
                                🔄 Retry Loading Data
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <ReactFlow
                            nodes={enhancedNodes}
                            edges={enhancedEdges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onNodeClick={handleNodeClick}
                            onPaneClick={handlePaneClick}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
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
                            <Controls className="react-flow-controls" />
                            <MiniMap
                                className="react-flow-minimap"
                                nodeColor={getNodeColor}
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
});

ProjectMindmapInner.displayName = 'ProjectMindmapInner';

// Main component wrapper
const ProjectMindmap = memo(() => {
    return (
        <ReactFlowProvider>
            <ProjectMindmapInner />
        </ReactFlowProvider>
    );
});

ProjectMindmap.displayName = 'ProjectMindmap';

export default ProjectMindmap;
