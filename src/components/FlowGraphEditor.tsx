import { type NodeChange, applyNodeChanges, type EdgeChange, type Edge, type Node, applyEdgeChanges, type Connection, addEdge, ReactFlow, Background, reconnectEdge } from '@xyflow/react';
import { type FC, useContext, useCallback, useRef, useEffect } from 'react';
import { GraphStateContext } from '../contexts/GraphStateContext';
import { nodeTypes } from '../const/nodeTypes';
import { bangInHandleId } from '../const/const';
import { MenuPanel } from './MenuPanel';

export const FlowGraphEditor: FC<object> = () => {
    const { nodes, edges, setNodes, setEdges } = useContext(GraphStateContext);
    const edgeReconnectSuccessful = useRef(true);

    const onNodesChange = useCallback(
        (changes: NodeChange<Node>[]) => {
            setNodes((nodesSnapshot) => {
                console.log('nodes', nodesSnapshot)
                return applyNodeChanges(changes, nodesSnapshot)
            }
            )
        },
        [setNodes]
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange<Edge>[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [setEdges]
    );
    const onConnect = useCallback(
        (connection: Connection) => {
            setEdges((edgesSnapshot) => {
                const { source, sourceHandle, target, targetHandle } = connection;
                const alreadyExists = edgesSnapshot.some((e) => e.source === source && e.sourceHandle === sourceHandle && e.target === target && e.targetHandle === targetHandle);
                if (alreadyExists) return edgesSnapshot;

                const filtered = edgesSnapshot.filter((e) => targetHandle === bangInHandleId || !(e.target === target && e.targetHandle === targetHandle));
                return addEdge(connection, filtered);
            }
            );
        },
        [setEdges]
    );

    const onReconnectStart = useCallback(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeReconnectSuccessful.current = true;
        setEdges((edgesSnapshot) => {
            const { source, sourceHandle, target, targetHandle } = newConnection;
            const alreadyExists = edgesSnapshot.some((e) => e.source === source && e.sourceHandle === sourceHandle && e.target === target && e.targetHandle === targetHandle);
            if (alreadyExists) return edgesSnapshot;

            return reconnectEdge(oldEdge, newConnection, edgesSnapshot);
        });
    }, [setEdges]);

    const onReconnectEnd = useCallback((_: unknown, edge: { id: string; }) => {
        if (!edgeReconnectSuccessful.current) {
            setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        }
        edgeReconnectSuccessful.current = true;
    }, [setEdges]);

    return (
        <div className="dndflow">
            <div
                className='reactflow-wrapper'
            // style={{ width: '100vw', height: '100vh' }}
            >
                <ReactFlow
                    nodeTypes={nodeTypes}
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onReconnectStart={onReconnectStart}
                    onReconnect={onReconnect}
                    onReconnectEnd={onReconnectEnd}
                    reconnectRadius={20}
                    edgesFocusable={false}
                    proOptions={{ hideAttribution: true }}
                    edgesReconnectable={true}
                    minZoom={0.3}
                >
                    {/* <Controls /> */}
                    <Background />
                </ReactFlow>
            </div>
            <MenuPanel />
        </div>
    );
};