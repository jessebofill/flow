import { Position, type Node, Handle, type NodeProps, type Edge, type XYPosition } from '@xyflow/react';
import { Component, createRef, type ContextType, type ReactNode } from 'react';
import { GraphStateContext } from '../../contexts/GraphStateContext';
import { animateEdge, animateHandle, getConnectedSources, getConnectedTargets, getConnections, highlight, unhiglight } from '../../const/utils';
import { bangOutHandleId, mainOutputHandleId, bangInHandleId, isActiveHandleId, nodeCreatorNodeId, seqOutHandleIdPrefix, connectedHighlightClassName, variadicInHandleIdPrefix } from '../../const/const';
import { DataTypeNames, type CommonNodeData, type DataTypes, type HandleDef, type HandleDefs, type NodeClass } from '../../types/types';
import { NodeInput, type NodeInputProps } from '../NodeInput';
import Tippy from '@tippyjs/react';
import { globalNodeInstanceRegistry, type NodeInstanceRegistry } from '../../const/nodeTypes';
import type { Tags } from '../../const/tags';
import { toast } from 'sonner';
import { ContextMenu } from '../ContextMenu';
import { NodeContextMenuItems } from '../NodeContextMenuItems';
import { NodeTitle } from '../NodeTitle';
import { TbLink } from 'react-icons/tb';
import { VaridicHandleGroup } from '../VaridicHandleGroup';
import { EventNotifier, Events } from '../../EventNotifier';

let transformCalls = 0;
const callLimit = 2000;
const timeSpan = 10000;

export type InputHandleId<Defs extends HandleDefs> = {
    [Id in keyof Defs]: Id extends typeof mainOutputHandleId
    ? never
    : Defs[Id]['dataType'] extends typeof DataTypeNames.Bang
    ? never
    : Id;
}[keyof Defs];

export type TransformId<Defs extends HandleDefs> = InputHandleId<Defs> | typeof bangOutHandleId;

type HandleTypeFromDefs<T extends HandleDefs, Id extends keyof T> = DataTypes[T[Id]['dataType']];
type TypeOfHandle<Handle extends HandleDef> = DataTypes[Handle['dataType']];
type State<Defs extends Record<string, HandleDef>> = {
    handles: {
        [Id in keyof Defs]?: TypeOfHandle<Defs[Id]>;
    } & {
        [Id in typeof isActiveHandleId]?: TypeOfHandle<{ dataType: typeof DataTypeNames.Boolean }>;
    }
};
export type CustomNodeDataProps = {
    nodeInstanceRegistry: NodeInstanceRegistry;
    isVirtual: boolean;
    isInSubGraph: boolean;
    graphSnapshot?: GraphSnapshot;
} & CommonNodeData;

export type GraphSnapshot = {
    edges: Edge[];
    react: object;
    other: object;
};

export type NodeBaseProps = Pick<NodeProps<Node<CustomNodeDataProps>>, 'id' | 'data'> & {
    position?: XYPosition;
};

type VariadicHandleState = {
    [groupId: string]: {
        idTracker: number;
        handleIds: string[];
    }
}

/**
 * ! Do not initialize savable state directly in implementing class declarations. Use 'declare' to define shape and set in 'setDefaults' 
 */
export abstract class NodeBase<Defs extends HandleDefs> extends Component<NodeBaseProps, State<Defs>> {
    declare static tags: Tags[];
    static contextType = GraphStateContext;
    declare context: ContextType<typeof GraphStateContext>;
    id: string;
    saveableState: object & { label?: string; variadicHandles?: VariadicHandleState } = {};
    variadicHandleDefaults: { [Id in keyof Defs]?: TypeOfHandle<Defs[Id]> } = {};
    protected nodeInstanceRegistry: NodeInstanceRegistry;
    protected isVirtualInstance: boolean = false;
    protected isInSubGraph = false;
    private virtualEdges: Edge[] = [];
    // ! handleDefs must be a getter in order to access in super constructor.
    protected abstract handleDefs: Defs;
    /**
     * ! Do not call this method directly. Use transformSafe.
     * Null id used to represent input transorm without specific id.
     * Null return means don't set output or bang next.
     * Pass either handle id of input that was set or bang handle id  or bangOutHandleId if is bang.
     */
    protected abstract transform(id: keyof Defs | typeof bangOutHandleId | null): HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined | null;
    protected actionButtonText = 'Run';
    static isBangable = false;
    protected hideIsActiveHandle = false;
    // protected bangHandleDefs: HandleDefs = { [bangInHandleId]: { dataType: 'bang' }, [bangOutHandleId]: { dataType: 'bang' } };
    protected ref = createRef<HTMLDivElement>();

    constructor(props: NodeBaseProps) {
        super(props);
        this.id = props.id;
        this.isVirtualInstance = props.data.isVirtual ?? false;
        this.isInSubGraph = props.data.isInSubGraph;
        this.nodeInstanceRegistry = props.data.nodeInstanceRegistry;
        if (this.isVirtualInstance) this.nodeInstanceRegistry.set(this.id, this);
        this.initState(props.data.graphSnapshot);
        console.log(`loading node ${this.name}
            id: ${this.id}
${/*@ts-ignore*/''}
stateId:`, this.saveableState?.initialGraphState);
        // console.log(this.saveableState)
    }

    get name() {
        return (this.constructor as NodeClass).defNodeName;
    }

    get _isBangable() {
        return (this.constructor as NodeClass).isBangable;
    }

    private initState(graphSnapshot?: GraphSnapshot) {
        this.setDefaults();
        this.state = {
            ...this.state,
            handles: { ...this.state?.handles, [isActiveHandleId]: true }
        };

        if (graphSnapshot) {
            this.state = { ...this.state, ...graphSnapshot.react as State<Defs> };
            this.saveableState = { ...this.saveableState, ...graphSnapshot.other };
            this.virtualEdges = graphSnapshot.edges;
        }

        const variadicIds = this.getVariadicIds();
        if (variadicIds.length) this.initVariadicHandlesState(variadicIds);
    }

    private initVariadicHandlesState(variadicGroupIds: string[]) {
        if (!this.saveableState.variadicHandles) {
            this.saveableState.variadicHandles = {};
        }
        variadicGroupIds.forEach(groupId => {
            const groups = this.saveableState.variadicHandles!;
            if (!groups[groupId]) {
                groups[groupId] = {
                    idTracker: 0,
                    handleIds: []
                };
                const variadicId = this.generateVariadicId(groupId);
                groups[groupId].handleIds.push(variadicId);
                this.state = { ...this.state, handles: { ...this.state.handles, [variadicId]: this.variadicHandleDefaults[groupId] } };
            }
        });
    }

    onTargetConnected(sourceHandleId: string, targetNodeId: string, targetHandleId: string) {
        if (!this.isBangOutputHandle(sourceHandleId)) this.executeTargetCallback(sourceHandleId, targetNodeId, targetHandleId);
    }

    getHandleType(handleId: string) {
        if (handleId === isActiveHandleId) return DataTypeNames.Boolean;
        if (handleId === bangOutHandleId || handleId === bangInHandleId) return DataTypeNames.Bang;
        const variadicGroupId = this.parseVariadicId(handleId)?.handleGroupId;
        const handle = this.handleDefs[variadicGroupId ?? handleId];
        if (handle === undefined) throw new Error('Could not find handle id defined for class');
        return handle.dataType;
    }

    isHandleConnected(handleId: string) {
        const edges = this.isVirtualInstance ? this.virtualEdges : this.context.masterEdges;
        return edges.some(edge => edge.source === this.id && edge.sourceHandle === handleId || edge.target === this.id && edge.targetHandle === handleId);
    }

    parseVariadicId(id: string): { handleGroupId: string; index: number } | null {
        if (!id.startsWith(variadicInHandleIdPrefix)) return null;
        const match = id.match(/^(.+?)(-?\d+)$/);
        if (!match) return null;

        return {
            handleGroupId: match[1],
            index: parseInt(match[2], 10)
        };
    }

    onTitleChange(title: string) {
        const label = title.trim();
        if (label) {
            if (label === this.name) this.saveableState.label = undefined;
            else this.saveableState.label = label;
        } else this.saveableState.label = undefined;
    }

    /**Execute after output and those outputs connections get called but before onFinish callbacks */
    protected async onOutputChange(prevValue: HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined, nextValue: HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined) {

    }

    protected handleDefToId(handleDef: HandleDef) {
        return Object.entries(this.handleDefs).find(([_, def]) => def === handleDef)?.[0];
    }

    protected getInputIds() {
        return Object.keys(this.handleDefs).filter(id => !id.startsWith(seqOutHandleIdPrefix) && id !== mainOutputHandleId);
    }

    protected getVariadicIds() {
        return Object.keys(this.handleDefs).filter(id => id.startsWith(variadicInHandleIdPrefix));
    }

    protected getExtraOutIds() {
        return Object.keys(this.handleDefs).filter(id => id.startsWith(seqOutHandleIdPrefix));
    }

    protected getExtraBangoutIds() {
        return Object.entries(this.handleDefs).filter(([id, def]) => id.startsWith(seqOutHandleIdPrefix) && def.dataType === DataTypeNames.Bang).map(entry => entry[0]);
    }

    protected isBangOutputHandle(handleId: string) {
        return handleId === bangOutHandleId || this.getExtraBangoutIds().includes(handleId);
    }

    protected setDefaults() {
        this.state = { handles: {} };
    }

    protected async exeTargetCallbacks(handleId: string) {
        await this.executeTargetCallbacks(handleId);
    }

    protected async exeTargetCallbacksWithEdges(handleId: string, edges: Edge[]) {
        await this.executeTargetCallbacks(handleId, edges);
    }

    protected forceRender() {
        this.setState(prev => ({ ...prev }));
    }

    protected async transformInput(handleId?: string) {
        const output = this.transformSafe(handleId ?? null);
        if (output !== null) await this.setOutput(output);
    };

    private generateVariadicId(handleGroupId: string) {
        const group = this.saveableState.variadicHandles![handleGroupId];
        return `${handleGroupId}${group.idTracker++}`;
    }

    private transformSafe(id: keyof Defs | typeof bangOutHandleId | null): HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined | null {
        if (!transformCalls) {
            setTimeout(() => {
                if (transformCalls >= callLimit) toast.error(`${callLimit} calls occurred in within ${timeSpan / 1000}s period. Graph likely contains an inifinite loop.`);
                else if (transformCalls >= callLimit * 0.35) toast.warning(`${callLimit * 0.35} calls occurred within ${timeSpan / 1000}s. Graph may contain an inifinite loop.`)
                transformCalls = 0;
            }, timeSpan);
        }
        transformCalls++;
        return this.transform(id);
    }

    private setStateAsync<S extends State<Defs>, K extends keyof S>(
        state: ((prevState: Readonly<S>, props: Readonly<typeof this.props>) => Pick<S, K> | S | null) | (Pick<S, K> | S | null)
    ): Promise<void> {
        if (this.isVirtualInstance) {
            return Promise.resolve().then(() => {
                const nextState = typeof state === 'function' ? state(this.state as Readonly<S>, this.props) : state;
                if (nextState) this.state = { ...this.state, ...nextState };
            });
        } else {
            return new Promise<void>(resolve => {
                setTimeout(() => this.setState(state as Readonly<State<Defs>>, resolve), 0);
            });
        }
    }

    /**
     * Allow undefined values to change input for now. Just cast to 0. May need to change in future
     */
    private async setInput<K extends keyof Defs>(handleId: K, value: HandleTypeFromDefs<Defs, K> | undefined) {
        // console.log('setr', handleId, value, this.id)
        await this.setStateAsync(prev => ({ handles: { ...prev.handles, [handleId as keyof State<Defs>]: value ?? 0 } }));
        if (handleId === isActiveHandleId || !this.state.handles[isActiveHandleId]) return;
        await this.transformInput(handleId as string);
    };

    private async setOutput(value: HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined) {
        const prevVal = this.state.handles[mainOutputHandleId];
        await this.setStateAsync(prev => ({ handles: { ...prev.handles, [mainOutputHandleId]: value } }));
        if (!this.isVirtualInstance) EventNotifier.dispatch(Events.NodeUpdate, { id: this.id });
        await this.executeTargetCallbacks(mainOutputHandleId);
        await this.onOutputChange(prevVal, value);
    };

    private async executeTargetCallbacks(sourceHandleId: string, withEdges?: Edge[]): Promise<void> {
        const edges = withEdges ?? (this.isVirtualInstance ? this.virtualEdges : this.context.masterEdges);
        const connectedTargets = getConnectedTargets(edges, this.id, sourceHandleId);
        // console.log('targets', sourceHandleId, connectedTargets)
        animateHandle(this.id, sourceHandleId)
        for (const target of connectedTargets) {
            if (!target.handleId) throw new Error('The connected target did not have an identifiable handle');
            animateEdge(target.edgeId)
            animateHandle(target.nodeId, target.handleId)
            await this.executeTargetCallback(sourceHandleId, target.nodeId, target.handleId);
        }
    }

    private async executeTargetCallback(sourceHandleId: string, targetNodeId: string, targetHandleId: string) {
        if (targetNodeId === nodeCreatorNodeId) return;
        // console.log('exe target', sourceHandleId, targetNodeId, targetHandleId, this.state[ouputHandleId])
        const node = this.nodeInstanceRegistry.get(targetNodeId);
        if (!node) throw new Error(`The connected target node could not be found in the registry`);

        if (this.getHandleType(sourceHandleId) === DataTypeNames.Bang) await node.bang(targetHandleId);
        else await node.setInput(targetHandleId, this.state.handles[sourceHandleId]);
    };

    private async bang(bangedOnHandleId: string) {
        if (!this.state.handles[isActiveHandleId]) return;
        const output = this.transformSafe(bangedOnHandleId);
        console.log(`${this.id}: banged with `, output, bangedOnHandleId)
        if (output !== null && bangedOnHandleId === bangInHandleId) {
            await this.setOutput(output);
            await this.executeTargetCallbacks(bangOutHandleId);
        }
        // } else if (this.bangIfOutputNull) {
        //     this.executeTargetCallbacks(bangOutHandleId);
        // }
    }

    private getHandleElement(handleId: string, appendLabel?: string) {
        const variadicGroupId = this.parseVariadicId(handleId)?.handleGroupId;
        const handleDef = handleId === bangInHandleId || handleId === bangOutHandleId ? { dataType: 'bang' } as const :
            handleId === isActiveHandleId ? { label: 'Active', dataType: 'boolean' } as const :
                this.handleDefs[variadicGroupId ?? handleId];
        const isExtraOut = this.getExtraOutIds().includes(handleId);
        const isOut = handleId === mainOutputHandleId || handleId === bangOutHandleId || isExtraOut;
        const isDisabled = () => {
            const isInactive = !this.state.handles[isActiveHandleId] && handleId !== isActiveHandleId;
            let valueFromSource = false;
            if (handleDef.dataType !== DataTypeNames.Bang) {
                const sources = getConnectedSources(this.context.masterEdges, this.id, handleId);
                valueFromSource = sources.length > 0 && sources[0].nodeId !== nodeCreatorNodeId;
            }
            return isInactive || valueFromSource;
        };
        return (
            <div key={handleId as string} style={{ display: 'flex', flexDirection: isOut ? 'row' : 'row-reverse', height: '3em', gap: '5px', alignItems: 'center', alignSelf: isOut ? 'flex-end' : 'flex-start' }} >
                {!isOut && handleId !== bangInHandleId &&
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <NodeInput
                            {...{
                                dataType: handleDef.dataType,
                                value: this.state.handles[handleId],
                                label: handleDef.label,
                                setValue: handleDef.dataType === DataTypeNames.Bang ? () => this.bang(handleId) :
                                    (v: unknown) => handleId === isActiveHandleId ? this.setInput(isActiveHandleId, v as never) :
                                        this.setInput(handleId as InputHandleId<Defs>, v as HandleTypeFromDefs<Defs, typeof handleId>),
                                disabled: isDisabled()
                            } as NodeInputProps}
                        />
                        {handleDef.label && handleDef.dataType !== DataTypeNames.Bang && <div>
                            {appendLabel ? `${handleDef.label}${appendLabel}` : handleDef.label}
                        </div>}
                    </div>
                }
                {isExtraOut && handleDef.dataType !== DataTypeNames.Bang &&
                    <div
                        className='output-box'
                        style={{
                            padding: '0 8px',
                            fontSize: '20px',
                            borderRadius: '4px'
                        }}
                    >
                        <div>{this.state.handles[handleId] !== undefined ? String(this.state.handles[handleId]) : false}</div>
                    </div>
                }
                <Tippy
                    className={handleId === bangOutHandleId || handleId === bangInHandleId || handleId === mainOutputHandleId || handleDef.label ? '' : 'hidden'}
                    content={
                        handleId === bangInHandleId ? `${this.actionButtonText} on signal` :
                            handleId === bangOutHandleId ? 'Send signal' :
                                handleId === mainOutputHandleId ? 'Output' :
                                    handleDef.label
                    }
                    placement="top"
                    arrow={false}
                    animation="fade"
                    duration={[400, 250]}>
                    <Handle
                        className={`${handleDef.dataType} ${this.props.data.highlightedHandles?.includes(handleId) ? connectedHighlightClassName : ''} ${this.isHandleConnected(handleId) ? 'connected' : ''}`}
                        type={isOut ? 'source' : 'target'}
                        position={isOut ? Position.Right : Position.Left}
                        id={handleId}
                        style={{
                            // border: `2px solid ${color}`,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: isOut ? 'row' : 'row-reverse',
                            alignSelf: 'baseline',
                            height: '10px',
                            width: '10px'
                        }}
                        onMouseOver={() => this.highlightConnectedTohandle(handleId)}
                        onMouseOut={() => unhiglight(this.context)}
                        onConnect={connection => {
                            if (connection.source === nodeCreatorNodeId) return;
                            if (connection.sourceHandle === null || connection.sourceHandle === undefined) throw new Error('Connecting source handle id did not exist');
                            if (connection.targetHandle === null || connection.targetHandle === undefined) throw new Error('Connecting target handle id did not exist');
                            const sourceNode = this.nodeInstanceRegistry.get(connection.source);
                            if (!sourceNode) throw new Error('Could not find source node in the node registry');
                            sourceNode.onTargetConnected(connection.sourceHandle, connection.target, connection.targetHandle);
                        }}
                    />
                </Tippy>
            </div>
        );
    };

    protected renderContent(): ReactNode {
        const output = this.state.handles[mainOutputHandleId];
        return <div>{output !== undefined ? String(output) : false}</div>;
    }

    protected renderExtra(): ReactNode {
        return;
    }

    render() {
        const inputs = this.getInputIds().map(handleId => {
            if (handleId.startsWith(variadicInHandleIdPrefix)) {
                const groupId = handleId;
                const { handleIds } = this.saveableState.variadicHandles![groupId];
                const onChange = (handleIds: string[]) => {
                    (async () => {
                        this.saveableState.variadicHandles![groupId].handleIds = handleIds;
                        await this.setStateAsync(prev => {
                            const entries = Object.entries(prev.handles).filter(([handleId]) => !handleId.startsWith(variadicInHandleIdPrefix) || handleIds.includes(handleId));
                            return { handles: Object.fromEntries(entries) as { [Id in keyof Defs]?: TypeOfHandle<Defs[Id]> | undefined } };
                        });
                        this.transformInput();
                    })();
                }

                const addHandle = (groupId: string) => {
                    const variadicId = this.generateVariadicId(groupId);
                    this.setInput(variadicId, this.variadicHandleDefaults[groupId]);
                    return variadicId;
                }

                return (
                    <VaridicHandleGroup
                        key={handleId}
                        nodeId={this.id}
                        handleGroupId={handleId}
                        initialHandles={handleIds}
                        onHandlesChange={onChange}
                        generateHandleId={addHandle}
                        getHandleElement={(id, index) => this.getHandleElement(id, index)}
                    />
                );
            }
            return this.getHandleElement(handleId);
        });
        const outputs: ReactNode[] = [];
        if (mainOutputHandleId in this.handleDefs) outputs.push(this.getHandleElement(mainOutputHandleId));
        const leftBang = this._isBangable && this.getHandleElement(bangInHandleId);
        const rightBang = this._isBangable && this.getHandleElement(bangOutHandleId);
        const extraOuts = this.getExtraOutIds().map(handleId => (this.getHandleElement(handleId)));
        return (
            <div className={this.state.handles[isActiveHandleId] ? '' : 'disabled'} style={{ width: '100%' }} ref={this.ref}>
                <div
                    className='header'
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 20px',
                        fontSize: '20px',
                        borderTopLeftRadius: 6,
                        borderTopRightRadius: 6,
                    }}
                >
                    <NodeTitle
                        name={this.name}
                        label={this.saveableState.label}
                        onChange={title => {
                            this.onTitleChange(title);
                            EventNotifier.dispatch(Events.NodeUpdate, { id: this.id });
                        }}
                    />
                    <div
                        onMouseOver={() => this.highlightAllConnected()}
                        onMouseOut={() => unhiglight(this.context)}
                        style={{
                            height: '30px',
                            width: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: 'translateX(10px)',
                            cursor: 'auto'
                        }}
                    >
                        <TbLink />
                    </div>
                </div>
                <div style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingRight: '5px' }}>{inputs}</div>
                        </div>
                        {!this.handleDefs[mainOutputHandleId] ? this.renderContent() :
                            <div
                                className='output-box'
                                style={{
                                    alignContent: 'center',
                                    fontSize: '36px',
                                    flex: 'auto',
                                    padding: '15px',
                                    borderRadius: '5px',
                                    minWidth: '76px',
                                    minHeight: '54px',
                                    maxWidth: '76px',
                                    maxHeight: '54px'
                                }}>
                                {this.renderContent()}
                            </div>
                        }
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
                                {outputs.concat(extraOuts)}
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between' }}>
                    {!this.hideIsActiveHandle && <div>{this.getHandleElement(isActiveHandleId)}</div>}
                    <div style={{ margin: '5px 10px' }}>
                        {this.renderExtra()}
                    </div>
                </div>
                {this._isBangable && <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'absolute' }}>
                        {leftBang}
                    </div>
                    <button
                        className='action'
                        disabled={!this.state.handles[isActiveHandleId]}
                        style={{
                            width: '100%',
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            borderBottomLeftRadius: 6,
                            borderBottomRightRadius: 6,
                        }}
                        onClick={() => this.bang(bangInHandleId)}
                    >
                        {this.actionButtonText}
                    </button>
                    <div style={{ position: 'absolute', right: 0 }}>
                        {rightBang}
                    </div>
                </div>}
                <ContextMenu elementContextMenuRef={this.ref} arrow={undefined} direction='right' portal={true}>
                    <NodeContextMenuItems nodeId={this.id} type={this.name} />
                </ContextMenu>
            </div>
        );
    }

    componentDidMount() {
        globalNodeInstanceRegistry.set(this.id, this);
        setTimeout(() => {
            this.context.setMasterNodes(nodes => {
                return nodes.map(node => {
                    if (node.id !== this.id) return node;
                    const x = node.position.x - (node.measured?.width ?? 0) / 2;
                    const y = node.position.y - 10;
                    return { ...node, position: { x, y }, style: { visibility: 'visible', opacity: 1 } };
                })
            });
        }, 1);
    }

    componentWillUnmount() {
        globalNodeInstanceRegistry.delete(this.id);
    }

    private getConnectionsToHandle(handleId: string) {
        const isOut = handleId === mainOutputHandleId || handleId === bangOutHandleId || this.getExtraOutIds().includes(handleId);
        const edges = getConnections(this.context.masterEdges, this.id, handleId).map(edge => edge.id);
        const handles = isOut ? getConnectedTargets(this.context.masterEdges, this.id, handleId) : getConnectedSources(this.context.masterEdges, this.id, handleId);
        return { handles, edges };
    }

    private highlightConnectedTohandle(handleId: string) {
        const { handles: handlesToHighlight, edges: edgesToHighlight } = this.getConnectionsToHandle(handleId);
        if (!edgesToHighlight.length) return;
        (handlesToHighlight as { nodeId: string, handleId: string }[]).push({ nodeId: this.id, handleId });
        highlight(this.context, handlesToHighlight, edgesToHighlight);
    }

    private highlightAllConnected() {
        const handleIds = Object.keys({
            [isActiveHandleId]: 0,
            ...this.handleDefs,
            ...(this._isBangable ? { [bangInHandleId]: 0, [bangOutHandleId]: 0 } : {})
        });

        const { handles: handlesToHighlight, edges: edgesToHighlight } = handleIds.reduce((acc: { handles: { nodeId: string, handleId: string }[], edges: string[] }, handleId) => {
            const { handles, edges } = this.getConnectionsToHandle(handleId);
            const handlesNext: { nodeId: string, handleId: string }[] = [...acc.handles];
            handles.forEach(handle => {
                if (!handlesNext.some(alreadyHas => alreadyHas.nodeId === handle.nodeId && alreadyHas.handleId === handleId)) {
                    handlesNext.push(handle);
                }
            });
            if (edges.length) handlesNext.push({ nodeId: this.id, handleId });
            return { handles: handlesNext, edges: [...acc.edges, ...edges] }
        }, { handles: [], edges: [] });
        if (!edgesToHighlight.length) return;
        highlight(this.context, handlesToHighlight, edgesToHighlight);
    }
}