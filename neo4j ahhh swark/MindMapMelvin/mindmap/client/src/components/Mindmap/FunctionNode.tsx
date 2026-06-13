import { Handle, Position } from "reactflow";
import { getModuleColor } from "../utils";

const FunctionNode = ({ data, selected }: { data: { name: string, module: string, isMatching: boolean }; selected?: boolean }) => {
    const moduleColor = getModuleColor(data.module);
    const isMatching = data.isMatching;

    return (
        <div
            style={{
                background: selected
                    ? `linear-gradient(135deg, ${moduleColor}, ${moduleColor}dd)`
                    : isMatching
                        ? `linear-gradient(135deg, #f59e0b, #d97706)` // Orange gradient for matching nodes
                        : `linear-gradient(135deg, ${moduleColor}, ${moduleColor}cc)`,
                borderRadius: '12px',
                border: selected
                    ? '3px solid #fff'
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
                    : isMatching
                        ? 'radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, transparent 70%)' // Orange glow for matching
                        : 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                animation: selected || isMatching ? 'pulse 2s infinite' : 'none',
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
                border: isMatching ? '1px solid rgba(245, 158, 11, 0.5)' : 'none'
            }}>
                {isMatching ? '🔍' : '🏷️'} {data.module}
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