import { useMemo } from "react";
import ReactFlow, { Background, Controls, type Node } from "reactflow";
import "reactflow/dist/style.css";

// A custom node that simply renders whatever React component is passed into it
const WrapperNode = ({ data }: { data: { component: React.ReactNode } }) => {
    return (
        <div className="flex items-center justify-center p-4 min-w-[800px] w-max cursor-default nodrag">
            {data.component}
        </div>
    );
};

const nodeTypes = {
    wrapper: WrapperNode,
};

export function ZoomableView({ children }: { children: React.ReactNode }) {
    // Wrap the entire component tree structure in a single, un-draggable ReactFlow Node
    // This perfectly delegates native panning/zooming handles locally without breaking React
    const nodes: Node[] = useMemo(() => ([
        {
            id: 'viewport-1',
            type: 'wrapper',
            position: { x: 0, y: 0 },
            data: { component: children },
            draggable: false, 
            selectable: false,
        }
    ]), [children]);

    return (
        <div className="w-full h-full relative overflow-hidden rounded-xl">
            <ReactFlow
                nodes={nodes}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.1, minZoom: 0.1, maxZoom: 3 }}
                nodesDraggable={false}
                zoomOnScroll={true}
                panOnDrag={true}
                className="bg-transparent"
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#ffffff20" gap={16} />
                <Controls className="filter invert opacity-50 block md:hidden lg:block z-50 absolute bottom-4 left-4" />
            </ReactFlow>
        </div>
    );
}
