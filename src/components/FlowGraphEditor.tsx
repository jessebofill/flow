import { type NodeChange, applyNodeChanges, type EdgeChange, type Edge, type Node, applyEdgeChanges, type Connection, addEdge, ReactFlow, Background, reconnectEdge, Panel, type NodeMouseHandler } from '@xyflow/react';
import { type FC, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { GraphStateContext } from '../contexts/GraphStateContext';
import { nodeTypes } from '../const/nodeTypes';
import { bangInHandleId } from '../const/const';
import { MenuPanel } from './MenuPanel';
import { WatchView } from './WatchView';
import { ContextMenu } from './ContextMenu';

export const FlowGraphEditor: FC<object> = () => {
    const { nodes, edges, setNodes, setEdges } = useContext(GraphStateContext);
    const [menu, setMenu] = useState(null);
    const ref = useRef(null);
    const edgeReconnectSuccessful = useRef(true);

    const onNodesChange = useCallback(
        (changes: NodeChange<Node>[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
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
            });
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

    const onNodeContextMenu: NodeMouseHandler = useCallback(
        (event, node) => {
            // Prevent native context menu from showing
            event.preventDefault();

            // Calculate position of the context menu. We want to make sure it
            // doesn't get positioned off-screen.
            const pane = ref.current.getBoundingClientRect();
            setMenu({
                id: node.id,
                top: event.clientY < pane.height - 200 && event.clientY,
                left: event.clientX < pane.width - 200 && event.clientX,
                right: event.clientX >= pane.width - 200 && pane.width - event.clientX,
                bottom:
                    event.clientY >= pane.height - 200 && pane.height - event.clientY,
            });
        },
        [setMenu],
    );

    const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

    return (
        <div className="dndflow">
            <div
                className='reactflow-wrapper'
            // style={{ width: '100vw', height: '100vh' }}
            >
                <ReactFlow
                    ref={ref}
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
                    onNodeContextMenu={onNodeContextMenu}
                    onPaneClick={onPaneClick}
                    minZoom={0.3}
                    maxZoom={5}
                    autoPanOnConnect
                    autoPanOnNodeDrag
                >
                    {/* <Controls /> */}
                    {/* <Panel position='center-left'
                        style={{ height: '100%' }}
                    >
                        sdfsdfsf
                        <WatchView />
                    </Panel> */}
                    {menu && <ContextMenu onClick={onPaneClick} {...menu} />}
                    <Background />
                </ReactFlow>
            </div>
            <MenuPanel />
        </div>
    );
};