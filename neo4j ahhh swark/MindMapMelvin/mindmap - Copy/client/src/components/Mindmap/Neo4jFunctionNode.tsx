import React from 'react';
import { Handle, Position } from "reactflow";

interface Neo4jNodeData {
    name: string;
    module: string;
    properties?: Record<string, any>;
    labels?: string[];
    complexity?: number;
    dependsOnCount?: number;
    isEntryPoint?: boolean;
    relativePath?: string;
    lastUpdated?: string;
    isMatching?: boolean;
}

const Neo4jFunctionNode: React.FC<{ 
    data: Neo4jNodeData; 
    selected?: boolean;
}> = ({ data, selected }) => {
    // Neo4j style colors
    const getNodeColor = (module: string) => {
        const colors: Record<string, string> = {
            'auth': '#D2691E',
            'user': '#4682B4', 
            'api': '#32CD32',
            'utils': '#FFB347',
            'controller': '#9370DB',
            'service': '#20B2AA',
            'Function': '#68B7C7',
            'unknown': '#A9A9A9'
        };
        return colors[module] || colors.Function;
    };

    const nodeColor = getNodeColor(data.module);
    const isMatching = data.isMatching;

    return (
        <div
            className={`neo4j-node ${selected ? 'selected' : ''} ${isMatching ? 'matching' : ''}`}
            style={{
                '--node-color': nodeColor,
                background: selected
                    ? `radial-gradient(circle, ${nodeColor}ee, ${nodeColor}cc)`
                    : isMatching
                        ? `radial-gradient(circle, #f59e0b, #d97706)`
                        : `radial-gradient(circle, ${nodeColor}dd, ${nodeColor}aa)`,
                border: selected
                    ? `3px solid ${nodeColor}`
                    : isMatching
                        ? '3px solid #f59e0b'
                        : `2px solid ${nodeColor}88`,
                boxShadow: selected
                    ? `0 0 20px ${nodeColor}66, 0 4px 15px rgba(0,0,0,0.3)`
                    : isMatching
                        ? `0 0 20px #f59e0b66, 0 4px 15px rgba(0,0,0,0.3)`
                        : `0 4px 12px rgba(0,0,0,0.2)`,
            } as React.CSSProperties}
        >
            {/* Connection Handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="neo4j-handle neo4j-handle-target"
            />
            
            {/* Node Content */}
            <div className="neo4j-node-content">
                {/* Node Icon */}
                <div className="neo4j-node-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                </div>
                
                {/* Node Name */}
                <div className="neo4j-node-name">
                    {data.name}
                </div>
                
                {/* Labels */}
                <div className="neo4j-node-labels">
                    {data.labels?.map((label, index) => (
                        <span key={index} className="neo4j-label">
                            {label}
                        </span>
                    ))}
                </div>
                
                {/* Properties Preview */}
                <div className="neo4j-node-properties">
                    {data.complexity && (
                        <div className="property-item">
                            <span className="property-key">complexity:</span>
                            <span className="property-value">{data.complexity}</span>
                        </div>
                    )}
                    {data.dependsOnCount !== undefined && (
                        <div className="property-item">
                            <span className="property-key">deps:</span>
                            <span className="property-value">{data.dependsOnCount}</span>
                        </div>
                    )}
                    {data.isEntryPoint && (
                        <div className="property-item entry-point">
                            <span className="entry-icon">🚀</span>
                            <span>Entry Point</span>
                        </div>
                    )}
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="neo4j-handle neo4j-handle-source"
            />
            
            {/* Selection Indicator */}
            {selected && (
                <div className="neo4j-selection-ring"></div>
            )}
        </div>
    );
};

export default Neo4jFunctionNode;
