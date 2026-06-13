import { Handle, Position } from "reactflow";
import { getModuleColor } from "../utils";

const FunctionNode = ({ data, selected }: {
    data: {
        name: string,
        module: string,
        isMatching: boolean;
        executionLevel?: number;
        callDepth?: number;
        isEntryPoint?: boolean;
        isLeafFunction?: boolean;
        executionPath?: string[];
        hierarchyId?: string;
        isHighlighted?: boolean;
        isSearchMatch?: boolean;
        isCollapsed?: boolean;
        onToggleCollapse?: () => void;
    };
    selected?: boolean
}) => {
    const moduleColor = getModuleColor(data.module);
    const isMatching = data.isMatching;
    const executionLevel = data.executionLevel || 0;
    const callDepth = data.callDepth || 0;
    const isEntryPoint = data.isEntryPoint || false;
    const isLeafFunction = data.isLeafFunction || false;
    const isHighlighted = data.isHighlighted || false;
    const isSearchMatch = data.isSearchMatch || false;
    const isCollapsed = data.isCollapsed || false;
    const onToggleCollapse = data.onToggleCollapse;

    return (
        <div
            style={{
                background: selected
                    ? `linear-gradient(135deg, ${moduleColor}, ${moduleColor}dd)`
                    : isHighlighted
                        ? `linear-gradient(135deg, #3b82f6, #2563eb)` // Blue gradient for highlighted nodes
                        : isSearchMatch
                            ? `linear-gradient(135deg, #f59e0b, #d97706)` // Orange gradient for search matches
                            : isMatching
                                ? `linear-gradient(135deg, #f59e0b, #d97706)` // Orange gradient for matching nodes
                                : `linear-gradient(135deg, ${moduleColor}, ${moduleColor}cc)`,
                borderRadius: '12px',
                border: selected
                    ? '3px solid #fff'
                    : isHighlighted
                        ? '3px solid #3b82f6' // Blue border for highlighted nodes
                        : isSearchMatch
                            ? '3px solid #f59e0b' // Orange border for search matches
                            : isMatching
                                ? '3px solid #f59e0b' // Orange border for matching nodes
                                : '2px solid rgba(255,255,255,0.3)',
                padding: '16px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                minWidth: '140px',
                minHeight: '80px',
                cursor: 'pointer',
                boxShadow: selected
                    ? `0 8px 25px rgba(0,0,0,0.3), 0 0 0 4px ${moduleColor}40`
                    : isHighlighted
                        ? `0 8px 25px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(59, 130, 246, 0.3)` // Blue glow for highlighted nodes
                        : isSearchMatch
                            ? `0 8px 25px rgba(245, 158, 11, 0.4), 0 0 0 4px rgba(245, 158, 11, 0.3)` // Orange glow for search matches
                            : isMatching
                                ? `0 8px 25px rgba(245, 158, 11, 0.4), 0 0 0 4px rgba(245, 158, 11, 0.3)` // Orange glow for matching nodes
                                : '0 4px 15px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated background pattern */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: selected
                    ? 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
                    : isHighlighted
                        ? 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)' // Blue glow for highlighted
                        : isSearchMatch
                            ? 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)' // Orange glow for search matches
                            : isMatching
                                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)' // Orange glow for matching
                                : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                animation: selected || isHighlighted || isSearchMatch || isMatching ? 'pulse 2s infinite' : 'none',
            }} />

            <Handle
                type="target"
                position={Position.Left}
                style={{
                    background: '#fff',
                    border: '2px solid #333',
                    width: '12px',
                    height: '12px'
                }}
            />

            <div style={{
                fontSize: '15px',
                marginBottom: '6px',
                fontWeight: '700',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                zIndex: 1
            }}>
                {data.name}
            </div>

            {/* Execution Level Badge */}
            <div style={{
                fontSize: '10px',
                background: isEntryPoint
                    ? 'rgba(34, 197, 94, 0.3)' // Green for entry points
                    : 'rgba(59, 130, 246, 0.3)', // Blue for regular functions
                color: 'white',
                padding: '2px 6px',
                borderRadius: '8px',
                fontWeight: '600',
                marginBottom: '4px',
                zIndex: 1,
                border: isEntryPoint ? '1px solid rgba(34, 197, 94, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)'
            }}>
                Level {executionLevel}
            </div>

            {/* Module and Type */}
            <div style={{
                fontSize: '11px',
                opacity: 0.9,
                background: isMatching
                    ? 'rgba(245, 158, 11, 0.3)' // Orange background for matching nodes
                    : 'rgba(255,255,255,0.2)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '500',
                zIndex: 1,
                border: isMatching ? '1px solid rgba(245, 158, 11, 0.5)' : 'none',
                marginBottom: '4px'
            }}>
                {isMatching ? '🔍' : '🏷️'} {data.module}
            </div>

            {/* Execution Info */}
            <div style={{
                fontSize: '9px',
                opacity: 0.8,
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                zIndex: 1
            }}>
                {isEntryPoint && (
                    <span style={{
                        background: 'rgba(34, 197, 94, 0.4)',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        fontSize: '8px'
                    }}>
                        ENTRY
                    </span>
                )}
                {isLeafFunction && (
                    <span style={{
                        background: 'rgba(168, 85, 247, 0.4)',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        fontSize: '8px'
                    }}>
                        LEAF
                    </span>
                )}
                <span style={{
                    background: 'rgba(255,255,255,0.3)',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    fontSize: '8px'
                }}>
                    Depth: {callDepth}
                </span>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                style={{
                    background: '#fff',
                    border: '2px solid #333',
                    width: '12px',
                    height: '12px'
                }}
            />

            {/* Collapse/Expand Button */}
            {onToggleCollapse && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollapse();
                    }}
                    style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {isCollapsed ? '▶' : '▼'}
                </button>
            )}

            <style >{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default FunctionNode;