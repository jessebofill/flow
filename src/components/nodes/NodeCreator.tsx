import { type Node, type NodeProps, getConnectedEdges, Handle, Position, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { useCallback, useContext, useEffect, useState, type CSSProperties, type FC } from 'react';
import { GraphStateContext } from '../../contexts/GraphStateContext';
import { getConnectedSources, getConnectedTargets, getIslandOfNode, getNodeHandleType } from '../../const/utils';
import { useNewNodeCreatorState, type NodeCreatorHandleData } from '../../hooks/useNewNodeCreatorState';
import { DataTypeNames, type HandleData, type HandleDefs } from '../../types/types';
import { NodeTitleEditor } from '../NodeTitleEditor';
import { saveUserNode, globalNodeInstanceRegistry, createNodeFromClassDef, allNodeTypes } from '../../const/nodeTypes';
import { v4 as uuid } from 'uuid';
import { NodeCreatorContext, NodeCreatorStatus } from '../../contexts/NodeCreatorContext';
import { LuSave, LuX } from 'react-icons/lu';
import { bangInHandleId } from '../../const/const';
import { ProxyNode } from './core/ProxyNode';
import type { GraphState, GraphStateNode } from '../../database';
import { toast } from 'sonner';

const handleStyle: CSSProperties = {
    position: 'relative',
    height: '15px',
    width: '15px',
};

export type NodeCreatorType = Node<{
    editing?: boolean;
    initialState?: {
        name: string;
        handles: HandleDefs;
        actionLabel?: string;
    }
}>;

export const NodeCreator: FC<NodeProps<NodeCreatorType>> = ({ id: nodeId, data }) => {
    const { masterEdges: edges, masterNodes: nodes } = useContext(GraphStateContext);
    const { setNodeCreatorStatus } = useContext(NodeCreatorContext);
    const { setNodes, fitView } = useReactFlow();
    const { inputs, outputs, setInputs, setOutputs, generateHandleId, getDataType } = useNewNodeCreatorState(data.initialState?.handles);
    const [isBangConnected, setIsBangConnected] = useState(false);
    const [title, setTitle] = useState(data.initialState?.name ?? '');
    const [actionName, setActionName] = useState(data.initialState?.actionLabel ?? 'Action');
    const updateInternals = useUpdateNodeInternals();

    const isHandleConnected = useCallback((handleId: string) => edges.some(edge => edge.source === nodeId && edge.sourceHandle === handleId || edge.target === nodeId && edge.targetHandle === handleId), [edges, nodeId]);

    useEffect(() => {
        setNodeCreatorStatus(data.editing ? NodeCreatorStatus.Editing : NodeCreatorStatus.Creating);
        return () => setNodeCreatorStatus(NodeCreatorStatus.None);
    }, [data.editing, setNodeCreatorStatus])

    useEffect(() => setIsBangConnected(isHandleConnected(bangInHandleId)), [isHandleConnected])

    useEffect(() => {
        //remove handles that have no connections and make sure last handle is ghost
        const updateHandles = (handles: NodeCreatorHandleData[], isOut: boolean) => {
            return handles.flatMap((handle, index) => {
                const isLast = index === handles.length - 1;
                const getConnected = isOut ? getConnectedSources : getConnectedTargets;
                const connectedNodes = getConnected(edges, nodeId, handle.id);

                //handle has no connections. remove it, or keep as ghost if last handle
                if (!connectedNodes.length) return (isLast) ? handle : [];
                //handle has connections, ensure datatype is set. add new ghost handle if it's last one
                const existingConnection = ('targetNodeId' in connectedNodes[0]) ?
                    { nodeId: connectedNodes[0].targetNodeId, handleId: connectedNodes[0].targetHandleId } :
                    { nodeId: connectedNodes[0].sourceNodeId, handleId: connectedNodes[0].sourceHandleId };
                const existingType = getNodeHandleType(existingConnection.nodeId, existingConnection.handleId!);
                (handle as HandleData).dataType = existingType;
                return isLast ? [handle, { id: generateHandleId(isOut) }] : handle;
            })

        }
        setInputs(handles => updateHandles(handles, false));
        setOutputs(handles => updateHandles(handles, true));
        updateInternals(nodeId);
    }, [edges]);

    const close = useCallback(() => setNodes((nodes) => nodes.filter((node) => node.id !== nodeId)), [nodeId, setNodes]);

    const onSave = useCallback(() => {
        const indentifier = title;
        if (outputs.length <= 1 && inputs.length <= 1) {
            toast.info(`Created node requires some connections.`);
            return;
        }
        if (!indentifier) {
            toast.info(`Created node requires a name.`);
            return;
        }
        if (indentifier in allNodeTypes) {
            toast.info(`Node with name "${indentifier}" already exists. Please use a unique name.`);
            return;
        }
        const graphId = uuid();
        const handleDefs = Object.fromEntries([...inputs, ...outputs].filter(handleData => 'dataType' in handleData)
            .map(({ id, ...handleDef }) => [id, handleDef]));
        const island = getIslandOfNode(nodeId, nodes, edges);
        if (!island.length) throw new Error('Could not find island of node network to create')
        const islandEdges = getConnectedEdges(island, edges);
        const proxyNodes: ProxyNode[] = [];

        const nodeState = island.filter(node => node.id !== nodeId).map((node): [string, GraphStateNode] => {
            const nodeInstance = globalNodeInstanceRegistry.get(node.id);
            if (!nodeInstance) throw new Error('Could not find node instance in registry to save it state');
            if (nodeInstance instanceof ProxyNode) proxyNodes.push(nodeInstance);
            // console.log('instance and proxy class', nodeInstance, ProxyNode)
            const state = {
                react: nodeInstance.state,
                other: nodeInstance.saveableState
            };
            return [node.id, { defNodeName: nodeInstance.name, initState: state, position: node.position }];
        })

        const graphState: GraphState = {
            nodes: Object.fromEntries(nodeState)
        }

        proxyNodes.forEach(node => node.saveSubGraphState());

        const ClassDef = saveUserNode(indentifier, isBangConnected, handleDefs, graphId, { edges: islandEdges }, graphState, actionName);
        setNodes(nodes => {
            const nodesExcludingIsland = nodes.filter(node => !island.includes(node));
            return [...nodesExcludingIsland, createNodeFromClassDef(ClassDef)];
        });

        setTimeout(() =>
            fitView({
                maxZoom: 2,
                // minZoom: 0.5,
                padding: 0.3,
                duration: 500,
                ease: t => t * (2 - t),
                interpolate: 'smooth'
            }), 100);
    }, [title, outputs, inputs, nodeId, nodes, edges, isBangConnected, actionName, setNodes, fitView]);

    return (
        <div
            className='node-creator'
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                className='header'
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 15px',
                    background: '#1d1d20',
                    fontSize: '1.5rem',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                }}
            >
                <NodeTitleEditor title={title} setTitle={setTitle} />
                <div style={{ display: 'flex', height: '100%', gap: '5px' }}>
                    <button
                        onClick={onSave}
                        style={{
                            background: 'transparent',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            width: '35px',
                            justifyContent: 'center'
                        }}
                    >
                        <LuSave />
                    </button>
                    <button
                        onClick={close}
                        style={{
                            background: 'transparent',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            width: '35px',
                            justifyContent: 'center'
                        }}
                    >
                        <LuX />
                    </button>
                </div>
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '20px',
                    flex: '1',
                    flexDirection: 'row',
                    alignItems: 'flex-start'
                }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {inputs.map((handle) =>
                        <div key={handle.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <Handle
                                className={`${getDataType(handle)} ${isHandleConnected(handle.id) ? 'connected' : ''}`}
                                id={handle.id}
                                type='source'
                                position={Position.Right}
                                style={handleStyle}
                            />
                            <div style={{ paddingLeft: '5px', display: 'flex' }}>
                                <NodeTitleEditor
                                    key={handle.id}
                                    animateWidth={50}
                                    buttonMargin='0'
                                    title={handle.label ?? ''}
                                    setTitle={(label) => setInputs(inputs => inputs.map(input => input.id === handle.id ? { ...input, label } : input))}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {outputs.map((handle) =>
                        <div key={handle.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>

                            <Handle
                                className={`${getDataType(handle)} ${isHandleConnected(handle.id) ? 'connected' : ''}`}
                                id={handle.id}
                                type='target'
                                position={Position.Left}
                                style={handleStyle}
                            />
                            <div style={{ paddingRight: '5px', display: 'flex' }}>
                                <NodeTitleEditor
                                    key={handle.id}
                                    animateWidth={50}
                                    buttonMargin='0'
                                    reverse
                                    title={handle.label ?? ''}
                                    setTitle={(label) => setOutputs(outputs => outputs.map(output => output.id === handle.id ? { ...output, label } : output))}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div
                className={`action ${isBangConnected ? 'connected' : ''}`}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '3.2em',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                }}
            >
                <div>
                    <Handle
                        className={`${DataTypeNames.Bang} ${isBangConnected ? 'connected' : ''}`}
                        id={bangInHandleId}
                        type='source'
                        position={Position.Right}
                        style={{ ...handleStyle, zIndex: '10' }}
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        right: '0',
                        left: '0',
                        fontSize: '1rem',
                        padding: '5px 15px',
                    }}
                >
                    <NodeTitleEditor title={actionName} setTitle={setActionName} />
                </div>
            </div>
        </div>

    );
};