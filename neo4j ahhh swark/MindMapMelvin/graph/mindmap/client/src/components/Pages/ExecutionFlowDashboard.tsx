import CytoscapeComponent from 'react-cytoscapejs';
import { useState, useEffect, useCallback, useRef } from 'react';
import cytoscape from 'cytoscape';
// @ts-expect-error - cytoscape-dagre type definitions
import dagre from 'cytoscape-dagre';
import './ExecutionFlowDashboard.css';

// Register dagre layout
cytoscape.use(dagre);

// Data interfaces
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


const ExecutionFlowDashboard = () => {
    // State management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [originalData, setOriginalData] = useState<MindmapData | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
    const [selectedNode, setSelectedNode] = useState<ExecutionSequenceData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyCritical, setShowOnlyCritical] = useState(false);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [filteredData, setFilteredData] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });

    // Ref for file list container to enable scrolling
    const fileListRef = useRef<HTMLDivElement>(null);

    const getFileNameFromNodeId = useCallback((nodeId: string): string => {
        const filePath = nodeId.split('#')[0];
        return filePath.split('/').pop() || filePath;
    }, []);

    const getUniqueFileNames = useCallback((nodes: ExecutionSequenceData[]): string[] => {
        const fileNames = new Set<string>();
        nodes.forEach(node => {
            fileNames.add(getFileNameFromNodeId(node.id));
        });
        return Array.from(fileNames).sort();
    }, [getFileNameFromNodeId]);

    // Scroll selected file into view
    const scrollToSelectedFile = useCallback((fileName: string) => {
        if (fileListRef.current) {
            const fileButtons = fileListRef.current.querySelectorAll('.file-item');
            fileButtons.forEach(button => {
                if (button.textContent?.includes(fileName)) {
                    button.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });

                    // Add a brief highlight effect
                    button.classList.add('highlight-scroll');
                    setTimeout(() => {
                        button.classList.remove('highlight-scroll');
                    }, 1000);
                }
            });
        }
    }, []);

    // Fetch data from backend
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

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
            console.log('📊 Raw data received:', data);

            setOriginalData(data);

            // Transform to Cytoscape format (no grouping) - inline to avoid dependency
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const elements: any[] = [];
            const visibleNodes = new Set<string>();

            data.nodes.forEach(node => {
                // Check if node should be included based on filters
                const shouldIncludeNode =
                    (!showOnlyCritical || node.totalConnections > 5 || node.isEntryPoint) &&
                    (!selectedFile || getFileNameFromNodeId(node.id) === selectedFile);

                if (shouldIncludeNode) {
                    visibleNodes.add(node.id);
                    elements.push({
                        data: {
                            ...node,
                            id: node.id,
                            label: node.name,
                            nodeType: 'function'
                        },
                        classes: `function-node ${node.isEntryPoint ? 'entry-point' : ''} ${node.isLeafFunction ? 'leaf-function' : ''}`
                    });
                }
            });

            // Add edges only between visible nodes
            data.relationships.forEach((rel, index) => {
                if (visibleNodes.has(rel.source) && visibleNodes.has(rel.target)) {
                    elements.push({
                        data: {
                            id: `edge-${index}-${rel.source}-${rel.target}`,
                            source: rel.source,
                            target: rel.target,
                            // label: `L${rel.calledAtLine}`,
                            isCrossModule: rel.isCrossModule
                        },
                        classes: `function-edge ${rel.isCrossModule ? 'cross-module' : 'same-module'}`
                    });
                }
            });

            setGraphData({ nodes: elements, edges: [] });
            setFilteredData({ nodes: elements, edges: [] });

        } catch (err) {
            console.error('❌ Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle search
    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);

        if (!term.trim()) {
            setFilteredData(graphData);
            return;
        }

        // Find matching nodes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchingNodes = graphData.nodes.filter((element: any): boolean => {
            if (element.data.type === 'group') return false; // Skip groups since we removed grouping
            return element.data.label?.toLowerCase().includes(term.toLowerCase()) ||
                element.data.name?.toLowerCase().includes(term.toLowerCase());
        });

        // Get IDs of matching nodes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchingNodeIds = new Set(matchingNodes.map((node: any) => node.data.id));

        // Find all connected nodes (both incoming and outgoing)
        const connectedNodeIds = new Set<string>();

        // Add matching nodes
        matchingNodeIds.forEach(id => connectedNodeIds.add(id));

        // Find connected nodes through edges
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        graphData.nodes.forEach((node: any) => {
            if (node.data && node.data.source && node.data.target) {
                const sourceId = node.data.source;
                const targetId = node.data.target;

                // If source matches, add target
                if (matchingNodeIds.has(sourceId)) {
                    connectedNodeIds.add(targetId);
                }
                // If target matches, add source
                if (matchingNodeIds.has(targetId)) {
                    connectedNodeIds.add(sourceId);
                }
            }
        });

        // Filter nodes to include only matching and connected nodes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredNodes = graphData.nodes.filter((element: any): boolean => {
            if (element.data.type === 'group') return false; // Skip groups
            return connectedNodeIds.has(element.data?.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }).map((element: any) => {
            // Add highlight class to matching nodes
            const isMatching = matchingNodeIds.has(element.data?.id);
            const currentClasses = element.classes || '';
            const newClasses = isMatching ? `${currentClasses} search-match`.trim() : currentClasses;

            return {
                ...element,
                classes: newClasses
            };
        });

        // Filter edges to include only those between the filtered nodes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filteredEdges = graphData.nodes.filter((element: any): boolean => {
            // Check if this is an edge (has source and target)
            if (element.data && element.data.source && element.data.target) {
                const sourceId = element.data.source;
                const targetId = element.data.target;
                // Include edge only if both source and target are in our filtered nodes
                return connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId);
            }
            return false; // Not an edge
        });

        setFilteredData({ nodes: filteredNodes, edges: filteredEdges });
    }, [graphData]);

    // Handle node click
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNodeClick = useCallback((event: any): void => {
        const node = event.target;
        if (node.data().nodeType === 'function') {
            // If no file is selected (All Files view), redirect to the node's file
            if (!selectedFile) {
                const nodeFileName = getFileNameFromNodeId(node.data().id);
                console.log(`🔄 Redirecting to file filter: ${nodeFileName}`);
                setSelectedFile(nodeFileName);
                setSelectedNode(null); // Clear any existing selected node

                // Scroll to the selected file in the side panel
                setTimeout(() => {
                    scrollToSelectedFile(nodeFileName);
                }, 100); // Small delay to ensure the file list is rendered
            } else {
                // If a file is already selected, show node details
                setSelectedNode(node.data());
            }
        }
    }, [selectedFile, getFileNameFromNodeId, scrollToSelectedFile]);

    // Load data on mount
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Re-transform when critical filter or selected file changes (no API call)
    useEffect(() => {
        if (originalData) {
            console.log('🔄 Re-transforming data with selected file:', selectedFile);

            // Inline transformation to avoid dependency issues
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const elements: any[] = [];
            const visibleNodes = new Set<string>();

            // Add all nodes - filter by selected file if any
            originalData.nodes.forEach(node => {
                // Check if node should be included based on filters
                const shouldIncludeNode =
                    (!showOnlyCritical || node.totalConnections > 5 || node.isEntryPoint) &&
                    (!selectedFile || getFileNameFromNodeId(node.id) === selectedFile);

                if (shouldIncludeNode) {
                    visibleNodes.add(node.id);
                    elements.push({
                        data: {
                            ...node,
                            id: node.id,
                            label: node.name,
                            nodeType: 'function',
                            isLocalFile: !selectedFile || getFileNameFromNodeId(node.id) === selectedFile
                        },
                        classes: `function-node ${node.isEntryPoint ? 'entry-point' : ''} ${node.isLeafFunction ? 'leaf-function' : ''}`
                    });
                }
            });

            // If file filtering is active, also include imported dependencies
            if (selectedFile) {
                console.log(`🔍 File filtering active for: ${selectedFile}`);
                let importedCount = 0;

                // Find all relationships where source is from selected file but target is from different file
                originalData.relationships.forEach(rel => {
                    const sourceFile = getFileNameFromNodeId(rel.source);
                    const targetFile = getFileNameFromNodeId(rel.target);

                    // If source is from selected file but target is from different file
                    if (sourceFile === selectedFile && targetFile !== selectedFile) {
                        // Find the target node and add it as imported dependency
                        const targetNode = originalData.nodes.find(node => node.id === rel.target);
                        if (targetNode && !visibleNodes.has(rel.target)) {
                            console.log(`📥 Adding imported dependency: ${targetNode.name} from ${targetFile}`);
                            console.log(`📥 Classes: function-node imported-dependency ${targetNode.isEntryPoint ? 'entry-point' : ''} ${targetNode.isLeafFunction ? 'leaf-function' : ''}`);
                            visibleNodes.add(rel.target);
                            elements.push({
                                data: {
                                    ...targetNode,
                                    id: targetNode.id,
                                    label: targetNode.name,
                                    nodeType: 'function',
                                    isLocalFile: false,
                                    isImportedDependency: true
                                },
                                classes: `function-node imported-dependency ${targetNode.isEntryPoint ? 'entry-point' : ''} ${targetNode.isLeafFunction ? 'leaf-function' : ''}`
                            });
                            importedCount++;
                        }
                    }
                });
                console.log(`📊 Total imported dependencies added: ${importedCount}`);
            }

            // Add edges only between visible nodes
            originalData.relationships.forEach((rel, index) => {
                if (visibleNodes.has(rel.source) && visibleNodes.has(rel.target)) {
                    const sourceFile = getFileNameFromNodeId(rel.source);
                    const targetFile = getFileNameFromNodeId(rel.target);
                    const isCrossFileDependency = selectedFile && sourceFile === selectedFile && targetFile !== selectedFile;

                    elements.push({
                        data: {
                            id: `edge-${index}-${rel.source}-${rel.target}`,
                            source: rel.source,
                            target: rel.target,
                            // label: `L${rel.calledAtLine}`,
                            isCrossModule: rel.isCrossModule,
                            isCrossFileDependency: isCrossFileDependency
                        },
                        classes: `function-edge ${rel.isCrossModule ? 'cross-module' : 'same-module'} ${isCrossFileDependency ? 'cross-file-dependency' : ''}`
                    });
                }
            });

            setGraphData({ nodes: elements, edges: [] });
            setFilteredData({ nodes: elements, edges: [] });
        }
    }, [originalData, showOnlyCritical, selectedFile]);

    // Apply search filter when search term changes (no API call)
    useEffect(() => {
        if (graphData.nodes.length > 0) {
            if (searchTerm.trim()) {
                handleSearch(searchTerm);
            } else {
                setFilteredData(graphData);
            }
        }
    }, [searchTerm, graphData, handleSearch]);


    const styleSheet = [
        // General node text color (fallback)
        {
            selector: "node",
            style: {
                "color": "#1f2937"
            }
        },
        // Default function nodes
        {
            selector: "node.function-node",
            style: {
                "background-color": "#e5e7eb",
                "border-color": "#6b7280",
                "border-width": 2,
                "width": 120,
                "height": 60,
                "font-size": 9,
                "font-weight": "500",
                "color": "#1f2937",
                "shape": "roundrectangle",
                "label": "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                "text-wrap": "wrap",
                "text-max-width": "110px",
                "text-overflow-wrap": "anywhere",
                "cursor": "pointer"
            }
        },
        // Hover effect for clickable nodes (when no file is selected)
        {
            selector: "node.function-node:hover",
            style: {
                "background-color": "#d1d5db",
                "border-color": "#4b5563",
                "border-width": 3
            }
        },
        // Entry point nodes (larger and green)
        {
            selector: "node.entry-point",
            style: {
                "background-color": "#10b981",
                "border-color": "#059669",
                "border-width": 3,
                "width": 140,
                "height": 70,
                "font-size": 10,
                "font-weight": "bold",
                "color": "#1f2937",
                "shape": "star",
                "text-wrap": "wrap",
                "text-max-width": "130px",
                "text-overflow-wrap": "anywhere"
            }
        },
        // Leaf function nodes (orange)
        {
            selector: "node.leaf-function",
            style: {
                "background-color": "#f59e0b",
                "border-color": "#d97706",
                "border-width": 2,
                "width": 120,
                "height": 60,
                "font-size": 9,
                "font-weight": "500",
                "color": "#1f2937",
                "text-wrap": "wrap",
                "text-max-width": "110px",
                "text-overflow-wrap": "anywhere"
            }
        },
        // High-connection nodes (larger)
        {
            selector: "node[totalConnections > 10]",
            style: {
                "width": 140,
                "height": 70,
                "font-size": 10,
                "font-weight": "bold",
                "text-wrap": "wrap",
                "text-max-width": "130px",
                "text-overflow-wrap": "anywhere"
            }
        },
        // Selected nodes
        {
            selector: "node:selected",
            style: {
                "border-width": 4,
                "border-color": "#3b82f6",
                "border-opacity": 0.8,
                "background-color": "#dbeafe",
                "text-wrap": "wrap",
                "text-overflow-wrap": "anywhere"
            }
        },
        // Search match nodes (highlighted)
        {
            selector: "node.search-match",
            style: {
                "border-width": 5,
                "border-color": "#dc2626",
                "border-opacity": 1,
                "background-color": "#fef2f2",
                "box-shadow": "0 0 15px #dc2626",
                "width": 140,
                "height": 70,
                "font-size": 11,
                "font-weight": "bold",
                "color": "#1f2937",
                "text-wrap": "wrap",
                "text-overflow-wrap": "anywhere"
            }
        },
        // Imported dependency nodes
        {
            selector: "node.imported-dependency",
            style: {
                "background-color": "#fef3c7",
                "border-color": "#f59e0b",
                "border-style": "dashed",
                "border-width": 2,
                "width": 120,
                "height": 60,
                "font-size": 9,
                "font-weight": "500",
                "color": "#1f2937",
                "shape": "roundrectangle",
                "label": "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                "text-wrap": "wrap",
                "text-max-width": "110px",
                "text-overflow-wrap": "anywhere"
            }
        },
        // Edges
        {
            selector: "edge",
            style: {
                "width": 1,
                "line-color": "#6b7280",
                "target-arrow-color": "#6b7280",
                "target-arrow-shape": "triangle",
                "curve-style": "bezier",
                "font-size": 8,
                "text-rotation": "autorotate",
                "text-events": "no"
            }
        },
        // Edges with labels
        {
            selector: "edge[label]",
            style: {
                "label": "data(label)"
            }
        },
        // Cross-module edges (thicker and blue)
        {
            selector: "edge.cross-module",
            style: {
                "line-color": "#3b82f6",
                "target-arrow-color": "#3b82f6",
                "width": 2
            }
        },
        // Same-module edges (thinner)
        {
            selector: "edge.same-module",
            style: {
                "line-color": "#6b7280",
                "target-arrow-color": "#6b7280",
                "width": 1
            }
        }
    ];

    if (loading) {
        return (
            <div className="execution-flow-dashboard">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading execution flow...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="execution-flow-dashboard">
                <div className="error">
                    <h3>Error Loading Data</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-button">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="execution-flow-dashboard">
            {/* Header */}
            <div className="header">
                <h1>Execution Flow Dashboard</h1>
                <p>Knowledge Transfer Visualization - {originalData?.nodes.length || 0} functions with {originalData?.relationships.length || 0} relationships</p>
            </div>

            {/* Controls */}
            <div className="controls">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search functions..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-container">
                    <label className="filter-checkbox">
                        <input
                            type="checkbox"
                            checked={showOnlyCritical}
                            onChange={(e) => setShowOnlyCritical(e.target.checked)}
                        />
                        Show only critical functions
                    </label>
                </div>

                <div className="stats">
                    <span>Functions: {originalData?.nodes.length || 0}</span>
                    <span>Relationships: {originalData?.relationships.length || 0}</span>
                    <span>Entry Points: {originalData?.nodes.filter(n => n.isEntryPoint).length || 0}</span>
                    <span>Leaf Functions: {originalData?.nodes.filter(n => n.isLeafFunction).length || 0}</span>
                </div>

                {/* Legend for file filtering */}
                {selectedFile && (
                    <div className="file-filter-legend">
                        <h4>File Filter Active: {selectedFile}</h4>
                        <div className="legend-items">
                            <div className="legend-item">
                                <div className="legend-color local-function"></div>
                                <span>Local Functions</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color imported-dependency"></div>
                                <span>Imported Dependencies</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Help text for All Files view */}
                {!selectedFile && (
                    <div className="help-text">
                        <p>💡 <strong>Tip:</strong> Click on any function node to filter by its file and see its dependencies</p>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="main-content">
                {/* Side Panel - File List */}
                <div className="side-panel">
                    <h3>Files</h3>
                    <div className="file-list" ref={fileListRef}>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className={`file-item ${!selectedFile ? 'active' : ''}`}
                        >
                            All Files ({originalData?.nodes.length || 0})
                        </button>
                        {originalData && getUniqueFileNames(originalData.nodes).map((fileName) => {
                            const nodeCount = originalData.nodes.filter(node =>
                                getFileNameFromNodeId(node.id) === fileName
                            ).length;
                            return (
                                <button
                                    key={fileName}
                                    onClick={() => {
                                        setSelectedFile(fileName);
                                        scrollToSelectedFile(fileName);
                                    }}
                                    className={`file-item ${selectedFile === fileName ? 'active' : ''}`}
                                >
                                    {fileName} ({nodeCount})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Cytoscape Visualization */}
                <div className="cytoscape-container">
                    <CytoscapeComponent
                        elements={CytoscapeComponent.normalizeElements([...filteredData.nodes, ...filteredData.edges])}
                        style={{ width: '100%', height: '600px' }}
                        // @ts-expect-error - Cytoscape stylesheet type compatibility
                        stylesheet={styleSheet}
                        zoomingEnabled={true}
                        maxZoom={3}
                        minZoom={0.1}
                        autounselectify={false}
                        boxSelectionEnabled={true}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        cy={(cy: any): void => {
                            cy.on('tap', 'node', handleNodeClick);

                            // Apply layout after cytoscape is ready
                            cy.ready(() => {
                                try {
                                    // Try dagre first
                                    cy.layout({
                                        name: 'dagre',
                                        rankDir: 'TB',
                                        fit: true,
                                        directed: true,
                                        padding: 30,
                                        nodeSep: 50,
                                        edgeSep: 20,
                                        rankSep: 100,
                                        animate: true,
                                        animationDuration: 1000,
                                        avoidOverlap: true,
                                        nodeDimensionsIncludeLabels: false
                                    }).run();
                                } catch (error) {
                                    console.warn('Dagre layout failed, using breadthfirst:', error);
                                    // Fallback to breadthfirst
                                    cy.layout({
                                        name: 'breadthfirst',
                                        fit: true,
                                        directed: true,
                                        padding: 30,
                                        animate: true,
                                        animationDuration: 1000,
                                        avoidOverlap: true,
                                        nodeDimensionsIncludeLabels: false
                                    }).run();
                                }
                            });
                        }}
                    />
                </div>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
                <div className="node-details">
                    <h3>Function Details</h3>
                    <div className="details-grid">
                        <div><strong>Name:</strong> {selectedNode.name}</div>
                        <div><strong>Type:</strong> {selectedNode.functionType}</div>
                        <div><strong>Module:</strong> {selectedNode.module}</div>
                        <div><strong>Execution Level:</strong> {selectedNode.executionLevel}</div>
                        <div><strong>Call Depth:</strong> {selectedNode.callDepth}</div>
                        <div><strong>Connections:</strong> {selectedNode.totalConnections}</div>
                        <div><strong>Entry Point:</strong> {selectedNode.isEntryPoint ? 'Yes' : 'No'}</div>
                        <div><strong>Leaf Function:</strong> {selectedNode.isLeafFunction ? 'Yes' : 'No'}</div>
                    </div>
                    <button
                        onClick={() => setSelectedNode(null)}
                        className="close-button"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExecutionFlowDashboard;