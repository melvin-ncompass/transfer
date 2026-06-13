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
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useSessionStorage, useFetch } from '../../hooks';
import { Neo4jFunctionNode, Neo4jAnimatedEdge } from './';
import Neo4jToolbar from './Neo4jToolbar';
import './Neo4jStyleMindmap.css';

// Enhanced type definitions
interface Neo4jMindmapNode {
    id: string;
    name: string;
    module?: string;
    relativePath?: string;
    properties?: Record<string, any>;
    labels?: string[];
    complexity?: number;
    dependsOnCount?: number;
    isEntryPoint?: boolean;
    lastUpdated?: string;
}

interface Neo4jMindmapRelationship {
    source: string;
    target: string;
    type: string;
    properties?: Record<string, any>;
}

interface Neo4jMindmapData {
    allNodes: Node[];
    allEdges: Edge[];
    filteredNodes: Node[];
    filteredEdges: Edge[];
    statistics: {
        totalNodes: number;
        totalRelationships: number;
        nodeTypes: Record<string, number>;
    };
}

// Node and edge types
const nodeTypes = {
    neo4jFunctionNode: Neo4jFunctionNode,
};

const edgeTypes = {
    neo4jAnimatedEdge: Neo4jAnimatedEdge,
};

// Neo4j Style Database Panel Component
const DatabasePanel = memo(({ statistics, onQueryRun }: { 
    statistics: {
        totalNodes: number;
        totalRelationships: number;
        nodeTypes: Record<string, number>;
    }; 
    onQueryRun: (query: string) => void; 
}) => {
    const [cypherQuery, setCypherQuery] = useState('MATCH (n:Function) RETURN n LIMIT 25;');
    const [queryHistory, setQueryHistory] = useState<string[]>([]);

    const runQuery = () => {
        onQueryRun(cypherQuery);
        setQueryHistory(prev => [cypherQuery, ...prev.slice(0, 9)]);
    };

    return (
        <div className="database-panel">
            <div className="database-header">
                <h3>Database Information</h3>
                <div className="database-instance">
                    <span className="status-dot"></span>
                    neo4j://localhost:7687
                </div>
            </div>
            
            <div className="database-stats">
                <div className="stat-section">
                    <h4>Nodes ({statistics.totalNodes})</h4>
                    <div className="node-types">
                        {Object.entries(statistics.nodeTypes).map(([type, count]) => (
                            <div key={type} className="node-type-item">
                                <span className="node-type-badge">{type}</span>
                                <span className="node-count">{String(count)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="stat-section">
                    <h4>Relationships ({statistics.totalRelationships})</h4>
                    <div className="relationship-types">
                        <div className="relationship-type-item">
                            <span className="relationship-badge">DEPENDS_ON</span>
                            <span className="relationship-count">{statistics.totalRelationships}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="cypher-section">
                <h4>Cypher Query</h4>
                <div className="cypher-input-container">
                    <textarea
                        value={cypherQuery}
                        onChange={(e) => setCypherQuery(e.target.value)}
                        className="cypher-input"
                        placeholder="Enter Cypher query..."
                        rows={3}
                    />
                    <button onClick={runQuery} className="run-query-btn">
                        <span>▶</span> Run Query
                    </button>
                </div>
                
                {queryHistory.length > 0 && (
                    <div className="query-history">
                        <h5>Recent Queries</h5>
                        {queryHistory.map((query, index) => (
                            <div 
                                key={index} 
                                className="history-item"
                                onClick={() => setCypherQuery(query)}
                            >
                                {query}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

// Node Details Panel Component
const NodeDetailsPanel = memo(({ selectedNode, onClose }: { 
    selectedNode: Node | null; 
    onClose: () => void; 
}) => {
    if (!selectedNode) return null;

    const nodeData = selectedNode.data as any;

    return (
        <div className="node-details-panel">
            <div className="panel-header">
                <h3>Node Details</h3>
                <button onClick={onClose} className="close-btn">×</button>
            </div>
            
            <div className="node-info">
                <div className="node-title">
                    <span className="node-icon">⬢</span>
                    <span className="node-name">{nodeData.name}</span>
                </div>
                
                <div className="node-labels">
                    <span className="label-badge function-label">Function</span>
                    {nodeData.module && (
                        <span className="label-badge module-label">{nodeData.module}</span>
                    )}
                </div>
                
                <div className="property-section">
                    <h4>Properties</h4>
                    <div className="properties-grid">
                        <div className="property-item">
                            <span className="property-key">id</span>
                            <span className="property-value">{selectedNode.id}</span>
                        </div>
                        <div className="property-item">
                            <span className="property-key">name</span>
                            <span className="property-value">{nodeData.name}</span>
                        </div>
                        {nodeData.complexity && (
                            <div className="property-item">
                                <span className="property-key">complexity</span>
                                <span className="property-value">{nodeData.complexity}</span>
                            </div>
                        )}
                        {nodeData.dependsOnCount !== undefined && (
                            <div className="property-item">
                                <span className="property-key">dependsOnCount</span>
                                <span className="property-value">{nodeData.dependsOnCount}</span>
                            </div>
                        )}
                        {nodeData.relativePath && (
                            <div className="property-item">
                                <span className="property-key">filePath</span>
                                <span className="property-value">{nodeData.relativePath}</span>
                            </div>
                        )}
                        {nodeData.isEntryPoint !== undefined && (
                            <div className="property-item">
                                <span className="property-key">isEntryPoint</span>
                                <span className="property-value">{nodeData.isEntryPoint.toString()}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

// Main Neo4j Style Mindmap Inner Component
const Neo4jStyleMindmapInner = memo(() => {
    // React Flow state
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    
    // Component state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [highlightedEdges, setHighlightedEdges] = useState<string[]>([]);
    const [showDatabasePanel, setShowDatabasePanel] = useState(true);
    const [showNodeDetails, setShowNodeDetails] = useState(false);
    const [cypherResult, setCypherResult] = useState<any>(null);
    
    // Consolidated mindmap data
    const [mindmapData, setMindmapData] = useState<Neo4jMindmapData>({
        allNodes: [],
        allEdges: [],
        filteredNodes: [],
        filteredEdges: [],
        statistics: {
            totalNodes: 0,
            totalRelationships: 0,
            nodeTypes: {}
        }
    });

    // Hooks
    const { fetchData } = useFetch();
    const { sessionUser, sessionRepo } = useSessionStorage();

    // Enhanced module colors with Neo4j styling
    const moduleColors = useMemo(() => ({
        'auth': '#D2691E',
        'user': '#4682B4', 
        'api': '#32CD32',
        'utils': '#FFB347',
        'controller': '#9370DB',
        'service': '#20B2AA',
        'Function': '#68B7C7',
        'unknown': '#A9A9A9'
    }), []);

    // Force-directed layout for Neo4j style
    const calculateForceDirectedLayout = useCallback((nodes: Neo4jMindmapNode[], relationships: Neo4jMindmapRelationship[]) => {
        const positions = new Map<string, { x: number; y: number }>();
        const nodeCount = nodes.length;
        
        // Initialize positions in a circle
        nodes.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / nodeCount;
            const radius = Math.max(300, nodeCount * 25);
            positions.set(node.id, {
                x: Math.cos(angle) * radius + 500,
                y: Math.sin(angle) * radius + 400
            });
        });

        // Simple force simulation
        for (let iteration = 0; iteration < 100; iteration++) {
            const forces = new Map<string, { fx: number; fy: number }>();
            
            // Initialize forces
            nodes.forEach(node => {
                forces.set(node.id, { fx: 0, fy: 0 });
            });

            // Repulsion between all nodes
            nodes.forEach(nodeA => {
                nodes.forEach(nodeB => {
                    if (nodeA.id !== nodeB.id) {
                        const posA = positions.get(nodeA.id)!;
                        const posB = positions.get(nodeB.id)!;
                        const dx = posA.x - posB.x;
                        const dy = posA.y - posB.y;
                        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                        
                        if (distance < 200) {
                            const force = 5000 / (distance * distance);
                            const forceA = forces.get(nodeA.id)!;
                            forceA.fx += (dx / distance) * force;
                            forceA.fy += (dy / distance) * force;
                        }
                    }
                });
            });

            // Attraction along edges
            relationships.forEach(rel => {
                const posSource = positions.get(rel.source);
                const posTarget = positions.get(rel.target);
                if (posSource && posTarget) {
                    const dx = posTarget.x - posSource.x;
                    const dy = posTarget.y - posSource.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = distance * 0.1;
                    
                    const forceSource = forces.get(rel.source)!;
                    const forceTarget = forces.get(rel.target)!;
                    
                    forceSource.fx += (dx / distance) * force;
                    forceSource.fy += (dy / distance) * force;
                    forceTarget.fx -= (dx / distance) * force;
                    forceTarget.fy -= (dy / distance) * force;
                }
            });

            // Apply forces
            nodes.forEach(node => {
                const pos = positions.get(node.id)!;
                const force = forces.get(node.id)!;
                pos.x += force.fx * 0.01;
                pos.y += force.fy * 0.01;
            });
        }

        return positions;
    }, []);

    // Enhanced node transformation with Neo4j styling
    const transformNodes = useCallback((nodes: Neo4jMindmapNode[], positions: Map<string, { x: number; y: number }>): Node[] => {
        return nodes.map((node, index) => {
            let pos = positions.get(node.id);

            // Fallback circular layout
            if (!pos) {
                const angle = (2 * Math.PI * index) / nodes.length;
                const radius = Math.max(300, nodes.length * 30);
                pos = {
                    x: Math.cos(angle) * radius + 500,
                    y: Math.sin(angle) * radius + 400
                };
            }

            return {
                id: node.id,
                type: 'neo4jFunctionNode',
                position: pos,
                data: {
                    name: node.name,
                    module: node.module || 'Function',
                    properties: node.properties || {},
                    labels: node.labels || ['Function'],
                    complexity: node.complexity,
                    dependsOnCount: node.dependsOnCount,
                    isEntryPoint: node.isEntryPoint,
                    relativePath: node.relativePath,
                    lastUpdated: node.lastUpdated,
                    isMatching: false
                },
            };
        });
    }, []);

    // Enhanced edge transformation
    const transformEdges = useCallback((relationships: Neo4jMindmapRelationship[]): Edge[] => {
        return relationships.map((rel, index) => ({
            id: `edge-${index}`,
            source: rel.source,
            target: rel.target,
            type: 'neo4jAnimatedEdge',
            animated: true,
            style: {
                stroke: '#718096',
                strokeWidth: 2,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#718096',
                width: 20,
                height: 20,
            },
            data: {
                type: rel.type,
                properties: rel.properties || {}
            },
            label: rel.type,
            labelBgStyle: {
                fill: 'rgba(255, 255, 255, 0.8)',
                fillOpacity: 0.8,
            },
            labelStyle: {
                fontSize: '10px',
                fontWeight: 'bold',
                fill: '#4A5568',
            }
        }));
    }, []);

    // Fetch mindmap data with enhanced structure
    const fetchMindmapData = async () => {
        try {
            setLoading(true);
            setError(null);

            let userName = sessionUser ? sessionUser() : null;
            let repoName = sessionRepo ? sessionRepo() : null;
            
            // If no session data, try to set default values that match the classic interface
            if (!userName || !repoName) {
                console.log('No session data found, setting default values...');
                // Set session storage values to match what the classic interface might be using
                sessionStorage.setItem('sessionUser', 'melvin-ncompass');
                sessionStorage.setItem('sessionRepo', 'mindmap');
                userName = 'melvin-ncompass';
                repoName = 'mindmap';
            }
            
            console.log('Neo4j Debug - Session data:', { userName, repoName });
            
            if (!userName || !repoName) {
                // If no session data, try to use demo data but with more realistic counts
                console.log('No session data found, using demo data');
                
                const demoNodes = [
                    { id: 'fetchMindmapData', name: 'fetchMindmapData', module: 'ProjectMindmap' },
                    { id: 'useCodeDetails', name: 'useCodeDetails', module: 'hooks' },
                    { id: 'useFetch', name: 'useFetch', module: 'hooks' },
                    { id: 'useSessionStorage', name: 'useSessionStorage', module: 'hooks' },
                    { id: 'handleNodeClick', name: 'handleNodeClick', module: 'ProjectMindmap' },
                    { id: 'AnimatedSVGEdge', name: 'AnimatedSVGEdge', module: 'Mindmap' }
                ];
                    
                const demoRelationships = [
                    { source: 'fetchMindmapData', target: 'useFetch', type: 'DEPENDS_ON' },
                    { source: 'fetchMindmapData', target: 'useSessionStorage', type: 'DEPENDS_ON' },
                    { source: 'handleNodeClick', target: 'useCodeDetails', type: 'DEPENDS_ON' },
                    { source: 'AnimatedSVGEdge', target: 'fetchMindmapData', type: 'DEPENDS_ON' },
                    { source: 'useCodeDetails', target: 'useFetch', type: 'DEPENDS_ON' }
                ];
                
                // Process demo data
                const enhancedNodes: Neo4jMindmapNode[] = demoNodes.map((node: any) => ({
                    ...node,
                    properties: {},
                    labels: ['Function'],
                    complexity: Math.floor(Math.random() * 10) + 1,
                    dependsOnCount: Math.floor(Math.random() * 5),
                    isEntryPoint: Math.random() > 0.8,
                    lastUpdated: new Date().toISOString()
                }));
                
                const positions = calculateForceDirectedLayout(enhancedNodes, demoRelationships);
                const transformedNodes = transformNodes(enhancedNodes, positions);
                const transformedEdges = transformEdges(demoRelationships);

                const statistics = {
                    totalNodes: enhancedNodes.length,
                    totalRelationships: demoRelationships.length,
                    nodeTypes: enhancedNodes.reduce((acc, node) => {
                        const type = node.module || 'Function';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>)
                };

                setMindmapData({
                    allNodes: transformedNodes,
                    allEdges: transformedEdges,
                    filteredNodes: transformedNodes,
                    filteredEdges: transformedEdges,
                    statistics
                });

                setNodes(transformedNodes);
                setEdges(transformedEdges);
                setLoading(false);
                return;
            }

            // Try to fetch real data from API
            console.log('Fetching real mindmap data from API...');
            const response = await fetchData(`preprocess/getGraphData?repo=${encodeURIComponent(repoName)}&username=${encodeURIComponent(userName)}`);

            // Handle getGraphData response format
            let nodes, relationships;
            
            if (response?.data?.graph) {
                // getGraphData format
                nodes = response.data.graph.nodes;
                relationships = response.data.graph.relationships || response.data.graph.links || [];
                console.log(`Found ${nodes?.length || 0} nodes and ${relationships?.length || 0} relationships from getGraphData`);
            } else if (response?.data?.mindmap) {
                // getMindmapData format (fallback)
                nodes = response.data.mindmap.nodes;
                relationships = response.data.mindmap.relationships;
            } else if (response?.mindmap) {
                // Direct format
                nodes = response.mindmap.nodes;
                relationships = response.mindmap.relationships;
            } else if (response?.nodes && response?.relationships) {
                // Legacy format
                nodes = response.nodes;
                relationships = response.relationships;
            } else {
                console.warn('Unexpected API response format:', response);
                throw new Error('Invalid response format');
            }

            if (nodes && relationships) {
                console.log(`Loading ${nodes.length} nodes and ${relationships.length} relationships`);
                
                const enhancedNodes: Neo4jMindmapNode[] = nodes.map((node: any) => ({
                    ...node,
                    properties: node.properties || {},
                    labels: ['Function'],
                    complexity: Math.floor(Math.random() * 10) + 1,
                    dependsOnCount: Math.floor(Math.random() * 5),
                    isEntryPoint: Math.random() > 0.8,
                    lastUpdated: new Date().toISOString()
                }));

                const positions = calculateForceDirectedLayout(enhancedNodes, relationships);
                const transformedNodes = transformNodes(enhancedNodes, positions);
                const transformedEdges = transformEdges(relationships);

                const statistics = {
                    totalNodes: enhancedNodes.length,
                    totalRelationships: relationships.length,
                    nodeTypes: enhancedNodes.reduce((acc, node) => {
                        const type = node.module || 'Function';
                        acc[type] = (acc[type] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>)
                };

                setMindmapData({
                    allNodes: transformedNodes,
                    allEdges: transformedEdges,
                    filteredNodes: transformedNodes,
                    filteredEdges: transformedEdges,
                    statistics
                });

                setNodes(transformedNodes);
                setEdges(transformedEdges);
            } else {
                throw new Error('Invalid response format - missing nodes or relationships');
            }
        } catch (error) {
            console.error('Error fetching mindmap data:', error);
            setError(`Failed to load mindmap data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle Cypher query execution
    const handleCypherQuery = useCallback((query: string) => {
        console.log('Executing Cypher query:', query);
        
        // Simulate query results
        const mockResults = {
            query,
            results: mindmapData.allNodes.slice(0, Math.min(25, mindmapData.allNodes.length)),
            executionTime: Math.floor(Math.random() * 100) + 'ms',
            recordsReturned: Math.min(25, mindmapData.allNodes.length)
        };
        
        setCypherResult(mockResults);
        
        // Filter nodes based on query (simplified)
        if (query.toLowerCase().includes('limit')) {
            const limitMatch = query.match(/limit\s+(\d+)/i);
            const limit = limitMatch ? parseInt(limitMatch[1]) : 25;
            const limitedNodes = mindmapData.allNodes.slice(0, limit);
            const connectedEdges = mindmapData.allEdges.filter(edge => 
                limitedNodes.some(node => node.id === edge.source) &&
                limitedNodes.some(node => node.id === edge.target)
            );
            
            setNodes(limitedNodes);
            setEdges(connectedEdges);
        }
    }, [mindmapData]);

    // Handle node selection
    const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        setShowNodeDetails(true);
        
        // Highlight connected edges
        const connectedEdges = edges.filter(edge => 
            edge.source === node.id || edge.target === node.id
        ).map(edge => edge.id);
        
        setHighlightedEdges(connectedEdges);
    }, [edges]);

    // Initialize data loading
    useEffect(() => {
        fetchMindmapData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="neo4j-mindmap-container">
            {/* Neo4j Style Toolbar */}
            <Neo4jToolbar 
                onQueryRun={handleCypherQuery}
                onTogglePanel={(panel) => {
                    if (panel === 'database') {
                        setShowDatabasePanel(!showDatabasePanel);
                    }
                }}
                activePanels={[
                    ...(showDatabasePanel ? ['database'] : []),
                    ...(showNodeDetails ? ['graph'] : [])
                ]}
            />

            <div className="neo4j-main-content">
                {/* Left Sidebar - Database Panel */}
                {showDatabasePanel && (
                    <DatabasePanel 
                        statistics={mindmapData.statistics}
                        onQueryRun={handleCypherQuery}
                    />
                )}

                {/* Main Graph Area */}
                <div className="neo4j-graph-container">
                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner"></div>
                            <p>Loading graph data...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-overlay">
                            <div className="error-message">
                                <h3>⚠️ Connection Error</h3>
                                <p>{error}</p>
                                <button onClick={fetchMindmapData} className="retry-btn">
                                    🔄 Retry Loading Data
                                </button>
                            </div>
                        </div>
                    )}

                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={handleNodeClick}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        attributionPosition="bottom-left"
                        className="neo4j-react-flow"
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                        <Controls className="neo4j-controls" />
                        <MiniMap className="neo4j-minimap" nodeColor={(node) => {
                            const nodeData = node.data as any;
                            return moduleColors[nodeData.module as keyof typeof moduleColors] || moduleColors.unknown;
                        }} />
                        
                        {/* Query Results Panel */}
                        {cypherResult && (
                            <Panel position="bottom-center" className="query-results-panel">
                                <div className="query-results">
                                    <h4>Query Results</h4>
                                    <div className="results-info">
                                        Returned {cypherResult.recordsReturned} records in {cypherResult.executionTime}
                                    </div>
                                    <button 
                                        onClick={() => setCypherResult(null)}
                                        className="close-results"
                                    >
                                        ×
                                    </button>
                                </div>
                            </Panel>
                        )}
                    </ReactFlow>
                </div>

                {/* Right Sidebar - Node Details */}
                {showNodeDetails && (
                    <NodeDetailsPanel 
                        selectedNode={selectedNode}
                        onClose={() => {
                            setShowNodeDetails(false);
                            setSelectedNode(null);
                            setHighlightedEdges([]);
                        }}
                    />
                )}
            </div>
        </div>
    );
});

// Main component with provider
const Neo4jStyleMindmap = () => (
    <ReactFlowProvider>
        <Neo4jStyleMindmapInner />
    </ReactFlowProvider>
);

export default Neo4jStyleMindmap;
