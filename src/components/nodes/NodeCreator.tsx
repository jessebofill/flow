import { type Node, type NodeProps, getConnectedEdges, Handle, Position, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { useCallback, useContext, useEffect, useState, type CSSProperties, type FC } from 'react';
import { GraphStateContext } from '../../contexts/GraphStateContext';
import { getConnectedSources, getConnectedTargets, getGraphsAndNodesWithDep, getIslandOfNode, getNodeHandleType } from '../../const/utils';
import { useNewNodeCreatorState, type NodeCreatorHandleData } from '../../hooks/useNewNodeCreatorState';
import { DataTypeNames, type HandleData, type HandleDefs } from '../../types/types';
import { NodeTitleEditor } from '../NodeTitleEditor';
import { saveUserNode, globalNodeInstanceRegistry, createNodeFromClassDef, allNodeTypes, updateUserNode } from '../../const/nodeTypes';
import { v4 as uuid } from 'uuid';
import { NodeCreatorContext, NodeCreatorStatus } from '../../contexts/NodeCreatorContext';
import { LuSave, LuX } from 'react-icons/lu';
import { bangInHandleId } from '../../const/const';
import { ProxyNode } from './core/ProxyNode';
import { appDb, type SavedGraphNode } from '../../database';
import { toast } from 'sonner';
import { ModalContext } from '../../contexts/ModalContext';

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
    const prevName = data.initialState?.name;
    const { masterEdges: edges, masterNodes: nodes } = useContext(GraphStateContext);
    const { nodeCreatorStatus, setNodeCreatorStatus, setEditingNodeType } = useContext(NodeCreatorContext);
    const { showModal } = useContext(ModalContext);
    const { setNodes, fitView } = useReactFlow();
    const { inputs, outputs, setInputs, setOutputs, generateHandleId, getDataType } = useNewNodeCreatorState(data.initialState?.handles);
    const [isBangConnected, setIsBangConnected] = useState(false);
    const [title, setTitle] = useState(prevName ?? '');
    const [editingNodes, setEditingNodes] = useState<string[]>([]);
    const [actionName, setActionName] = useState(data.initialState?.actionLabel ?? 'Action');
    const updateInternals = useUpdateNodeInternals();
    const isEditing = nodeCreatorStatus === NodeCreatorStatus.Editing;

    const isHandleConnected = useCallback((handleId: string) => edges.some(edge => edge.source === nodeId && edge.sourceHandle === handleId || edge.target === nodeId && edge.targetHandle === handleId), [edges, nodeId]);

    useEffect(() => {
        setNodeCreatorStatus(data.editing ? NodeCreatorStatus.Editing : NodeCreatorStatus.Creating);
        setEditingNodeType(data.editing ? data.initialState?.name ?? '' : null);
        return () => {
            setNodeCreatorStatus(NodeCreatorStatus.None);
            setEditingNodeType(null);
        }
    }, [data.editing, data.initialState?.name, setEditingNodeType, setNodeCreatorStatus]);

    useEffect(() => {
        if (isEditing) {
            const island = getIslandOfNode(nodeId, nodes, edges);
            if (!island.length) throw new Error('Could not find island of node network');
            setEditingNodes(island.map(node => node.id));
        }
        //only set this initially. to track which nodes orginally a part of the editied node.
        //runs when the node creator status changes to editing
    }, [nodeCreatorStatus])

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

    const close = () => setNodes((nodes) => nodes.filter((node) => isEditing ? !editingNodes.includes(node.id) : node.id !== nodeId));


    const checkReqs = () => {
        if (outputs.length <= 1 && inputs.length <= 1) {
            toast.info(`Created node requires some connections.`);
            return false;
        }
        if (!title) {
            toast.info(`Created node requires a name.`);
            return false;
        }
        if (title in allNodeTypes && !(isEditing && title === prevName)) {
            toast.info(`Node with name "${title}" already exists. Please use a unique name.`);
            return false;
        }
        return true;
    }

    const onSave = () => {
        const indentifier = title;
        const graphId: string | undefined = isEditing ? appDb.cache.userNodes[prevName ?? '']?.graphId : uuid();
        if (!graphId) throw new Error(`Could not find existing use node ${prevName} in the cache`);

        const handleDefs = Object.fromEntries([...inputs, ...outputs].filter(handleData => 'dataType' in handleData)
            .map(({ id, ...handleDef }) => [id, handleDef]));
        const island = getIslandOfNode(nodeId, nodes, edges);
        if (!island.length) throw new Error('Could not find island of node network to create');
        const islandEdges = getConnectedEdges(island, edges);

        const nodeState = island.filter(node => node.id !== nodeId).map((node): [string, SavedGraphNode] => {
            const nodeInstance = globalNodeInstanceRegistry.get(node.id);
            if (!nodeInstance) throw new Error('Could not find node instance in registry to save it state');
            if (nodeInstance instanceof ProxyNode) nodeInstance.saveSubGraphState();

            // console.log('instance and proxy class', nodeInstance, ProxyNode)
            const state = {
                react: nodeInstance.state,
                other: nodeInstance.saveableState
            };
            return [node.id, { defNodeName: nodeInstance.name, initState: state, position: node.position }];
        })
        const createdNode = { graphId, isBangable: isBangConnected, handleDefs, actionLabel: actionName };
        const graph = { edges: islandEdges, nodes: Object.fromEntries(nodeState) };
        // proxyNodes.forEach(node => node.saveSubGraphState());
        if (isEditing) {
            updateUserNode(indentifier, createdNode, graph, prevName !== indentifier ? prevName : undefined)
            setNodes(nodes => nodes.filter((node) => !editingNodes.includes(node.id)));
            return;
        }
        const ClassDef = saveUserNode(indentifier, createdNode, graph);

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
    };

    const onEditSave = () => checkReqs() && showModal((close) => <SaveEditModal name={prevName!} newName={title} close={close} onConfirm={onSave} />);

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
                <NodeTitleEditor title={title} showEditIndicator={isEditing && title !== prevName} setTitle={setTitle} />
                <div style={{ display: 'flex', height: '100%', gap: '5px' }}>
                    {nodeCreatorStatus === NodeCreatorStatus.Editing &&
                        <div>Editing {prevName}</div>
                    }
                    <button
                        onClick={isEditing ? onEditSave : () => checkReqs() && onSave()}
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

interface SaveEditModalProps {
    name: string;
    newName: string;
    onConfirm: () => void;
    close: () => void;
}

const SaveEditModal: FC<SaveEditModalProps> = ({ name, newName, onConfirm, close }) => {
    const { nonNodeGraphsWithDep, nodesWithDep } = getGraphsAndNodesWithDep(name);
    const numberThatDependOn = nodesWithDep.length + nonNodeGraphsWithDep.length;
    const hasNodeAndOtherGraphs = nodesWithDep.length && nonNodeGraphsWithDep.length;
    const nodeString = nodesWithDep.map(name => `"${name}"`).join(', ');

    return (
        <div>
            <header>
                Update {name}
            </header>
            <p>
                {`Are you sure you want to update this node? ${name !== newName ? `"${name}" will be renamed to "${newName}".` : ''}
                ${numberThatDependOn ? `${nodeString} ${hasNodeAndOtherGraphs ? 'and' : ''}${nonNodeGraphsWithDep.length ? `${nonNodeGraphsWithDep.length} graphs ` : ''}depend${numberThatDependOn === 1 ? 's' : ''} on this, and these changes will likely cause ${numberThatDependOn === 1 ? 'it' : 'them'} to break.` : ''}`}
            </p>
            <div className='modal-buttons'>
                <button onClick={() => {
                    onConfirm();
                    close();
                }}>
                    Confirm
                </button>
                <button onClick={close}>
                    Cancel
                </button>
            </div>
        </div>
    );
};