import { type Node, type NodeProps, getConnectedEdges, Handle, Position, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { useCallback, useContext, useEffect, useState, type CSSProperties, type FC } from 'react';
import { GraphStateContext } from '../../contexts/GraphStateContext';
import { getConnectedSources, getConnectedTargets, getIslandOfNode, getNodeHandleType } from '../../const/utils';
import { useNewNodeCreatorState, type NodeCreatorHandleData } from '../hooks/useNewNodeCreatorState';
import { DataTypeNames, type HandleData, type HandleDef } from '../../types/types';
import { NodeTitleEditor } from '../NodeTitleEditor';
import { saveUserNode, globalNodeInstanceRegistry, createNodeFromClassDef, allNodeTypes } from '../../const/nodeTypes';
import { v4 as uuid } from 'uuid';
import { NodeCreatorContext } from '../../contexts/NodeCreatorContext';
import { LuSave, LuX } from 'react-icons/lu';
import { bangInHandleId } from '../../const/const';
import { ProxyNode } from './ProxyNode';
import type { GraphState, GraphStateNode } from '../../database';
import { toast } from 'sonner';

const handleStyle: CSSProperties = {
    position: 'relative',
    height: '15px',
    width: '15px',
};

export const NodeCreator: FC<NodeProps<Node>> = ({ id: nodeId }: NodeProps) => {
    const { masterEdges: edges, masterNodes: nodes } = useContext(GraphStateContext);
    const { setIsCreatingNode } = useContext(NodeCreatorContext);
    const { setNodes, setEdges, fitView } = useReactFlow();
    const { inputs, outputs, setInputs, setOutputs, generateHandleId, getDataType } = useNewNodeCreatorState();
    const [isBangConnected, setIsBangConnected] = useState(false);
    const [title, setTitle] = useState('');
    const [actionName, setActionName] = useState('Action');
    const updateInternals = useUpdateNodeInternals();

    useEffect(() => {
        setIsCreatingNode(true);
        return () => setIsCreatingNode(false);
    }, [setIsCreatingNode])

    useEffect(() => setIsBangConnected(!!getConnectedTargets(edges, nodeId, bangInHandleId).length), [edges, nodeId])

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

    // useEffect(() => {
    //     //removes edges of old type when type changes. assumes latest edge will be at end of edges array
    //     let needsUpdate = false;
    //     const lastEdgesOfHandles: { [handleId: string]: TBasicEdge } = {};
    //     edges.forEach(edge => { if (edge.source === nodeId) lastEdgesOfHandles[edge.sourceHandle!] = edge as TBasicEdge });
    //     const newEdges = edges.filter(edge => {
    //         const { source, sourceHandle, data } = edge;
    //         if (source !== nodeId || !data || !('dataType' in data) || !lastEdgesOfHandles[sourceHandle!]) return true;
    //         const lastEdgeOfHandle = lastEdgesOfHandles[sourceHandle!];
    //         if (!lastEdgeOfHandle || !lastEdgeOfHandle.data?.dataType) return true;

    //         const dataType = (data as TBasicEdge['data'])!.dataType;
    //         const isExpectedType = dataType === lastEdgeOfHandle.data.dataType;
    //         if (!isExpectedType) needsUpdate = true;
    //         return isExpectedType;
    //     });
    //     if (needsUpdate) setEdges(newEdges);
    // }, [edges, nodeId, setEdges]);

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

        const nodeState = island.filter(node => node.id !== nodeId).map(node => {
            const nodeInstance = globalNodeInstanceRegistry.get(node.id);
            if (!nodeInstance) throw new Error('Could not find node instance in registry to save it state');
            if (nodeInstance instanceof ProxyNode) proxyNodes.push(nodeInstance);
            // console.log('instance and proxy class', nodeInstance, ProxyNode)
            const state = {
                react: nodeInstance.state,
                other: nodeInstance.saveableState
            };
            return [node.id, { defNodeName: nodeInstance.name, initState: state } as GraphStateNode];
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
                className='border-bottom'
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
                                className={getDataType(handle)}
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
                {/* <div
                    style={{
                        alignContent: 'center',
                        fontSize: '36px',
                        // background: '#1d1d20',
                        flex: 'auto',
                        padding: '15px',
                        borderRadius: '5px',
                        minWidth: '76px',
                        minHeight: '54px',
                        maxWidth: '76px',
                        maxHeight: '54px'
                    }}>

                </div> */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {outputs.map((handle, index) =>
                        <div key={handle.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>

                            <Handle
                                className={getDataType(handle)}

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
                className='border-top'
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '3.2em',
                    background: isBangConnected ? '#8161f0' : '#1d1d20',
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                }}
            >
                <div>
                    <Handle
                        className={DataTypeNames.Bang}
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

interface NodeCreatorHandleProps {
    handle: HandleDef;

}

const NodeCreatorHandle = ({ handle, }) => {


    return (
        <div style={{ display: 'flex' }}>

            <Handle
                className={getDataType(handle)}
                key={handle.id}
                id={handle.id}
                type='source'
                position={Position.Right}
                style={handleStyle}
            />
            <NodeTitleEditor setTitle={() => { }} />
        </div>
    );
};