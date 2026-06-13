import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from 'reactflow';

interface Neo4jEdgeData {
    type?: string;
    properties?: Record<string, any>;
}

const Neo4jAnimatedEdge: React.FC<EdgeProps<Neo4jEdgeData>> = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
}) => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    // Neo4j style edge styling
    const edgeStyle = {
        strokeWidth: selected ? 3 : 2,
        stroke: selected ? '#2563eb' : '#718096',
        strokeDasharray: data?.type === 'DEPENDS_ON' ? '0' : '5,5',
        ...style,
    };

    return (
        <>
            {/* Main Edge Path */}
            <BaseEdge 
                path={edgePath} 
                markerEnd={markerEnd} 
                style={edgeStyle}
            />
            
            {/* Animated Flow Particles */}
            {selected && (
                <circle r="3" fill="#2563eb" className="neo4j-edge-particle">
                    <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={edgePath}
                    />
                </circle>
            )}
            
            {/* Edge Label */}
            {data?.type && (
                <text
                    x={labelX}
                    y={labelY}
                    className="neo4j-edge-label"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        fill: selected ? '#2563eb' : '#4A5568',
                        pointerEvents: 'none',
                    }}
                >
                    <tspan
                        x={labelX}
                        dy="-2"
                        style={{
                            fill: 'white',
                            stroke: 'white',
                            strokeWidth: '3px',
                            paintOrder: 'stroke fill'
                        }}
                    >
                        {data.type}
                    </tspan>
                    <tspan
                        x={labelX}
                        dy="0"
                        style={{
                            fill: selected ? '#2563eb' : '#4A5568'
                        }}
                    >
                        {data.type}
                    </tspan>
                </text>
            )}
        </>
    );
};

export default Neo4jAnimatedEdge;
