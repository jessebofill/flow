import { type NodeChange, applyNodeChanges, type EdgeChange, type Edge, type Node, applyEdgeChanges, type Connection, addEdge, ReactFlow, Background, type Viewport, type IsValidConnection, useViewport, SelectionMode, useReactFlow } from '@xyflow/react';
import { type FC, useContext, useCallback, useRef, useEffect } from 'react';
import { GraphStateContext } from '../contexts/GraphStateContext';
import { allNodeTypes, globalNodeInstanceRegistry } from '../const/nodeTypes';
import { nodeContainsNestedDep } from '../const/utils';
import { bangInHandleId, basicEdgeTypeName, nodeCreatorNodeId, nodeCreatorTypeName } from '../const/const';
import { getNodeHandleType, validateConnection } from '../const/utils';
import { edgeTypes } from '../const/edgeTypes';
import type { TBasicEdge } from './BasicEdge';
import { NodeCreatorCallbacks, NodeCreatorContext } from '../contexts/NodeCreatorContext';
import { SidebarMenu } from './SidebarMenu';
import { ConnectionLine } from './ConnectionLine';
import { useDroppable } from '@dnd-kit/core';
import { DragAndDropOverlay } from './DragAndDropOverlay';
import { toast } from 'sonner';
import type { NodeCreatorType } from './nodes/NodeCreator';
import { appDb } from '../database';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { EventNotifier, Events } from '../EventNotifier';

export const FlowGraphEditor: FC<object> = () => {
    const { masterNodes, masterEdges, setMasterNodes, setMasterEdges } = useContext(GraphStateContext);
    const { isNodeCreatorOpen } = useContext(NodeCreatorContext);
    const { fitView } = useReactFlow();
    const viewport = useViewport();
    const loadGraph = useLoadGraph();
    const ref = useRef<HTMLDivElement>(null);
    const edgeReconnectSuccessful = useRef(true);
    const { setNodeRef } = useDroppable({ id: 'xyflow' });

    const onNodesChange = useCallback(
        (changes: NodeChange<Node>[]) => {
            // console.log('changes', changes)
            const removedIds = changes.filter(change => change.type === 'remove').map(change => change.id);

            if (removedIds.length > 0) {
                setMasterEdges(prevEdges => prevEdges.filter(edge => !removedIds.includes(edge.source) && !removedIds.includes(edge.target)));
            }
            setMasterNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot));
            setTimeout(() => EventNotifier.dispatch(Events.NodesChange), 1);
        },
        [setMasterEdges, setMasterNodes]
    );
    const onEdgesChange = useCallback(
        (changes: EdgeChange<Edge>[]) => {
            console.log('edges changes', changes)
            setMasterEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot))
        },
        [setMasterEdges]
    );
    const onConnect = useCallback(
        (connection: Connection) => {
            setMasterEdges((edgesSnapshot) => {
                const { source, sourceHandle, target, targetHandle } = connection;
                const alreadyExists = edgesSnapshot.some((e) => e.source === source && e.sourceHandle === sourceHandle && e.target === target && e.targetHandle === targetHandle);
                if (alreadyExists) return edgesSnapshot;

                const getTypeFrom: [string, string] = source === nodeCreatorNodeId ? [target, targetHandle!] : [source, sourceHandle!];
                const dataType = getNodeHandleType(...getTypeFrom);
                const edge = {
                    ...connection,
                    type: basicEdgeTypeName,
                    selectable: false,
                    data: { dataType: dataType }
                } as TBasicEdge

                //do not allow multiple connection from same source handle of nodecreator except bang
                const filtered = edgesSnapshot.filter((e) => !(e.source === nodeCreatorNodeId && e.sourceHandle === sourceHandle && sourceHandle !== bangInHandleId))
                    //do not allow multiple connections to same target handle except for bang
                    .filter((e) => !(e.target === target && e.targetHandle === targetHandle && targetHandle !== bangInHandleId));
                return addEdge(edge, filtered);
            });
        },
        [setMasterEdges]
    );

    const onReconnectStart = useCallback(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
        edgeReconnectSuccessful.current = true;
        setMasterEdges((edgesSnapshot) => {
            const { source, sourceHandle, target, targetHandle } = newConnection;
            const alreadyExists = edgesSnapshot.some((e) => e.source === source && e.sourceHandle === sourceHandle && e.target === target && e.targetHandle === targetHandle);
            if (alreadyExists) return edgesSnapshot;

            const getTypeFrom: [string, string] = source === nodeCreatorNodeId ? [target, targetHandle!] : [source, sourceHandle!];
            const dataType = getNodeHandleType(...getTypeFrom);
            const edge = {
                ...newConnection,
                type: basicEdgeTypeName,
                selectable: false,
                data: { dataType: dataType }
            } as TBasicEdge

            const filtered = edgesSnapshot.filter((e) => !(e === oldEdge || e.source === nodeCreatorNodeId && e.sourceHandle === sourceHandle && sourceHandle !== bangInHandleId))
                .filter((e) => !(e.target === target && e.targetHandle === targetHandle && targetHandle !== bangInHandleId));
            return addEdge(edge, filtered);
        });
    }, [setMasterEdges]);

    const onReconnectEnd = useCallback((_: unknown, edge: { id: string; }) => {
        if (!edgeReconnectSuccessful.current) {
            setMasterEdges((eds) => eds.filter((e) => e.id !== edge.id));
        }
        edgeReconnectSuccessful.current = true;
    }, [setMasterEdges]);

    const getNodeCreatorPos = (viewport: Viewport) => {
        const pane = ref.current!.getBoundingClientRect();
        const inset = 15; // pixels from left edge of screen
        const width = pane.width - inset * 2;
        const height = pane.height - inset * 2;
        const x = (inset - viewport.x) / viewport.zoom;
        const y = (inset - viewport.y) / viewport.zoom;
        return {
            id: nodeCreatorNodeId,
            type: nodeCreatorTypeName,
            position: { x, y },
            draggable: false,
            selectable: false,
            focusable: false,
            style: {
                zIndex: '-1000',
                transform: `scale(${1 / viewport.zoom})`,
                left: x,
                top: y,
                height: `${height}px`,
                width: `${width}px`,
                cursor: 'grab'
            },
            data: {}
        };
    };

    const setNodeCreator = useCallback((viewport: Viewport, add?: boolean) => {
        const nodeCreator = getNodeCreatorPos(viewport);

        setMasterNodes(nodes => {
            if (add && !isNodeCreatorOpen) return [...nodes, nodeCreator];
            const prevNodeCreator = nodes.find(node => node.type === nodeCreatorTypeName);
            if (prevNodeCreator) {
                nodeCreator.data = { ...prevNodeCreator.data };
                return [...nodes.filter(n => n.type !== nodeCreatorTypeName), nodeCreator];
            }
            return nodes;
        });
    }, [isNodeCreatorOpen, setMasterNodes]);

    useEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver(() => setNodeCreator(viewport));
        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [viewport, setNodeCreator]);


    const isValidConnection: IsValidConnection = useCallback((connection) => validateConnection(connection, masterEdges), [masterEdges]);

    const createNode = useCallback(() => {
        if (isNodeCreatorOpen) return toast.warning('Node creator is already open')
        fitView({
            maxZoom: 1.1,
            minZoom: 0.5,
            padding: 0.3,
            duration: 500,
            ease: t => t * (2 - t),
            interpolate: 'smooth'
        });
        setTimeout(() => setNodeCreator(viewport, true), 100);
    }, [fitView, isNodeCreatorOpen, setNodeCreator, viewport]);


    const editNode = useCallback((rfTypeIdentifier: string) => {
        if (isNodeCreatorOpen) return toast.warning('Node creator is already open');
        const instancedNodeTypes = [... new Set(masterNodes.map(node => globalNodeInstanceRegistry.get(node.id)!.name))];
        const isTypeInstanced = instancedNodeTypes.includes(rfTypeIdentifier);
        const typesWithDep = instancedNodeTypes.filter(type => nodeContainsNestedDep(type, rfTypeIdentifier));
        if (isTypeInstanced) {
            if (!typesWithDep.length) {
                toast.warning(`Cannot edit "${rfTypeIdentifier}" while it is instanced in a grpah. Please remove it first.`);
            } else {
                toast.warning(`Cannot edit "${rfTypeIdentifier}" because the graph contains instances of it and nodes that depend on it. Please remove
                    "${rfTypeIdentifier}", ${typesWithDep.map(type => `"${type}"`).join(', ')} first.`);
            }
            return;
        }
        if (typesWithDep.length) {
            toast.warning(`Cannot edit "${rfTypeIdentifier}" because the graph contains nodes that depend on it. Please remove
                ${typesWithDep.map(type => `"${type}"`).join(', ')} first.`);
            return;
        }

        const { graphId, handleDefs, actionLabel } = appDb.cache.userNodes[rfTypeIdentifier];
        const nodeCreator: NodeCreatorType = getNodeCreatorPos(viewport);

        nodeCreator.data = {
            editing: true,
            initialState: {
                name: rfTypeIdentifier,
                handles: handleDefs,
                actionLabel
            }
        }

        loadGraph(graphId, { insertNodes: [nodeCreator] });
    }, [isNodeCreatorOpen, loadGraph, masterNodes, viewport])

    return (
        <div className="dndflow">
            <div
                ref={setNodeRef}
                className='reactflow-wrapper'
            // style={{ width: '100vw', height: '100vh' }}
            >
                <ReactFlow
                    ref={ref}
                    nodeTypes={allNodeTypes}
                    edgeTypes={edgeTypes}
                    nodes={masterNodes}
                    edges={masterEdges}
                    connectionLineComponent={ConnectionLine}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onReconnectStart={onReconnectStart}
                    onReconnect={onReconnect}
                    onReconnectEnd={onReconnectEnd}
                    reconnectRadius={20}
                    nodesFocusable={false}
                    edgesFocusable={false}
                    panOnDrag={[1]}
                    selectionMode={SelectionMode.Partial}
                    selectionOnDrag={true}
                    connectOnClick={false}
                    proOptions={{ hideAttribution: true }}
                    edgesReconnectable={true}
                    onViewportChange={setNodeCreator}
                    isValidConnection={isValidConnection}
                    minZoom={isNodeCreatorOpen ? 0.5 : 0.3}
                    maxZoom={isNodeCreatorOpen ? 1.1 : 5}
                    autoPanOnConnect={!isNodeCreatorOpen}
                    autoPanOnNodeDrag
                >
                    {/* <Controls /> */}
                    {/* <Panel position='center-left'
                        style={{ height: '100%' }}
                    >
                        sdfsdfsf
                        <WatchView />
                    </Panel> */}
                    {/* <MiniMap/> */}
                    <Background />
                </ReactFlow>
            </div>
            <NodeCreatorCallbacks.Provider value={{ createNode, editNode }}>
                <SidebarMenu />
            </NodeCreatorCallbacks.Provider>
            <DragAndDropOverlay />
        </div>
    );
};