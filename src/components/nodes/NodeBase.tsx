import { Position, type Node, Handle, type NodeProps, type Edge } from '@xyflow/react';
import { Component, createRef, type ContextType, type ReactNode } from 'react';
import { GraphStateContext } from '../../contexts/GraphStateContext';
import { getConnectedSources, getConnectedTargets, getConnections } from '../../const/utils';
import { bangOutHandleId, mainOutputHandleId, bangInHandleId, isActiveHandleId, nodeCreatorNodeId, variOutHandleIdPrefix } from '../../const/const';
import { DataTypeNames, type DataTypeName, type DataTypes, type HandleDef, type HandleDefs, type NodeClass } from '../../types/types';
import { NodeInput, type NodeInputProps } from '../NodeInput';
import Tippy from '@tippyjs/react';
import { globalNodeInstanceRegistry, type NodeInstanceRegistry } from '../../const/nodeTypes';
import { NodeTitleEditor } from '../NodeTitleEditor';
import type { Tags } from '../../const/tags';

const dataTypeColorMap: { [K in DataTypeName]: string } = {
    bang: '#ef47f1',
    boolean: '#fafc77',
    number: '#4eb3ff'
};

export function defineHandles<T extends HandleDefs>(defs: T): T {
    return defs;
};

export function isBangInHandleId(id: string) {
    return id === bangInHandleId;
}

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
    [Id in keyof Defs]?: TypeOfHandle<Defs[Id]>;
} & {
    [Id in typeof isActiveHandleId]?: TypeOfHandle<{ dataType: typeof DataTypeNames.Boolean }>;
};
export type CustomNodeDataProps = {
    nodeInstanceRegistry: NodeInstanceRegistry;
}

export type StateSnapshot = {
    react: object;
    other: object;
    edges: Edge[];
}

export type NodeBaseProps = Pick<NodeProps<Node<CustomNodeDataProps>>, 'id' | 'data'> & {
    isVirtual: boolean;
    stateSnapshot: StateSnapshot;
}
export abstract class NodeBase<Defs extends HandleDefs> extends Component<NodeBaseProps, State<Defs>> {
    declare static tags: Tags[];
    static contextType = GraphStateContext;
    declare context: ContextType<typeof GraphStateContext>;
    id: string;
    saveableState: object = {};
    protected nodeInstanceRegistry: NodeInstanceRegistry;
    protected isVirtualInstance: boolean = false;
    private virtualEdges: Edge[] = [];
    protected abstract handleDefs: Defs;
    /**
     * Null means don't set output or bang next
     * Pass either handle id of input that was set or bang handle id  or bangOutHandleId if is bang
     */
    protected abstract transform(id: keyof Defs | typeof bangOutHandleId): HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined | null;
    protected actionButtonText = 'Run';
    protected label?: string;
    static isBangable = false;
    protected hideIsActiveHandle = false;
    // protected bangHandleDefs: HandleDefs = { [bangInHandleId]: { dataType: 'bang' }, [bangOutHandleId]: { dataType: 'bang' } };
    protected ref = createRef<HTMLDivElement>();

    constructor(props: NodeBaseProps) {
        super(props);
        this.id = props.id;
        this.isVirtualInstance = props.isVirtual ?? false;
        this.nodeInstanceRegistry = props.data.nodeInstanceRegistry;
        if (this.isVirtualInstance) this.nodeInstanceRegistry.set(this.id, this);
        this.initState(props.isVirtual ? props.stateSnapshot : undefined);
    }

    get name() {
        return (this.constructor as NodeClass).defNodeName;
    }

    get _isBangable() {
        return (this.constructor as NodeClass).isBangable;
    }

    private initState(stateSnapshot?: StateSnapshot) {
        this.setDefaults();
        this.state = { ...this.state, [isActiveHandleId]: true };

        if (stateSnapshot) {
            this.state = { ...this.state, ...stateSnapshot.react as State<Defs> };
            this.saveableState = { ...this.saveableState, ...stateSnapshot.other };
            this.virtualEdges = stateSnapshot.edges;
        }
    }

    onTargetConnected(sourceHandleId: string, targetNodeId: string, targetHandleId: string) {
        if (!this.isBangOutputHandle(sourceHandleId)) this.executeTargetCallback(sourceHandleId, targetNodeId, targetHandleId);
    }

    getHandleType(handleId: string) {
        if (handleId === isActiveHandleId) return DataTypeNames.Boolean;
        if (handleId === bangOutHandleId || handleId === bangInHandleId) return DataTypeNames.Bang;
        const handle = this.handleDefs[handleId];
        if (handle === undefined) throw new Error('Could not find handle id defined for class');
        return handle.dataType;
    }

    isHandleConnected(handleId: string) {
        const edges = this.isVirtualInstance ? this.virtualEdges : this.context.masterEdges;
        return edges.some(edge => edge.source === this.id && edge.sourceHandle === handleId || edge.target === this.id && edge.targetHandle === handleId);
    }

    /**Execute after output and those outputs connections get called but before onFinish callbacks */
    protected onOutputChange(prevValue: HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined, nextValue: HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined) {

    }

    protected handleDefToId(handleDef: HandleDef) {
        return Object.entries(this.handleDefs).find(([_, def]) => def === handleDef)?.[0];
    }

    protected getInputIds() {
        return Object.keys(this.handleDefs).filter(id => !id.startsWith(variOutHandleIdPrefix) && id !== mainOutputHandleId);
    }

    protected getExtraOutIds() {
        return Object.keys(this.handleDefs).filter(id => id.startsWith(variOutHandleIdPrefix));
    }

    protected getExtraBangoutIds() {
        return Object.entries(this.handleDefs).filter(([id, def]) => id.startsWith(variOutHandleIdPrefix) && def.dataType === DataTypeNames.Bang).map(entry => entry[0]);
    }

    protected isBangOutputHandle(handleId: string) {
        return handleId === bangOutHandleId || this.getExtraBangoutIds().includes(handleId);
    }

    protected setDefaults() {
        this.state = {} as State<Defs>;
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
                this.setState(state as Readonly<State<Defs>>, resolve);
            });
        }
    }

    /**
     * Allow undefined values to change input for now. Just cast to 0. May need to change in future
     */
    private async setInput<K extends keyof Defs>(handleId: K, value: HandleTypeFromDefs<Defs, K> | undefined) {
        if (handleId !== isActiveHandleId && !this.state[isActiveHandleId]) return;
        console.log('setr', handleId, value, this.id)
        await this.setStateAsync({ [handleId as keyof State<Defs>]: value ?? 0 });
        const output = this.transform(handleId);
        if (output !== null) await this.setOutput(output);
    };

    private async setOutput(value: HandleTypeFromDefs<Defs, typeof mainOutputHandleId> | undefined) {
        const prevVal = this.state[mainOutputHandleId];
        await this.setStateAsync(() => ({ [mainOutputHandleId]: value }));
        await this.executeTargetCallbacks(mainOutputHandleId);
        this.onOutputChange(prevVal, value);
    };

    private async executeTargetCallbacks(sourceHandleId: string, withEdges?: Edge[]): Promise<void> {
        const edges = withEdges ?? (this.isVirtualInstance ? this.virtualEdges : this.context.masterEdges);
        const connectedTargets = getConnectedTargets(edges, this.id, sourceHandleId);
        console.log('targets', sourceHandleId, connectedTargets)
        for (const target of connectedTargets) {
            if (!target.targetHandleId) throw new Error('The connected target did not have an identifiable handle');
            // console.log(this.id,'exe target', target.targetNodeI
            await this.executeTargetCallback(sourceHandleId, target.targetNodeId, target.targetHandleId);
        }
    }

    private async executeTargetCallback(sourceHandleId: string, targetNodeId: string, targetHandleId: string) {
        if (targetNodeId === nodeCreatorNodeId) return;
        // console.log('exe target', sourceHandleId, targetNodeId, targetHandleId, this.state[ouputHandleId])
        const node = this.nodeInstanceRegistry.get(targetNodeId);
        if (!node) throw new Error(`The connected target node could not be found in the registry`);

        if (this.getHandleType(sourceHandleId) === DataTypeNames.Bang) await node.bang(targetHandleId);
        else await node.setInput(targetHandleId, this.state[sourceHandleId] as HandleTypeFromDefs<typeof node.handleDefs, keyof typeof node.handleDefs>);
    };

    private async bang(bangedOnHandleId: string) {
        if (!this.state[isActiveHandleId]) return;
        const output = this.transform(bangedOnHandleId);
        console.log(`${this.id}: banged with `, output, bangedOnHandleId)
        if (output !== null && bangedOnHandleId === bangInHandleId) {
            await this.setOutput(output);
            await this.executeTargetCallbacks(bangOutHandleId);
        }
        // } else if (this.bangIfOutputNull) {
        //     this.executeTargetCallbacks(bangOutHandleId);
        // }
    }

    private getHandleElement(handleId: string) {
        const handleDef = handleId === bangInHandleId || handleId === bangOutHandleId ? { dataType: 'bang' } as const :
            handleId === isActiveHandleId ? { label: 'Active', dataType: 'boolean' } as const :
                this.handleDefs[handleId];
        const isExtraOut = this.getExtraOutIds().includes(handleId);
        const isOut = handleId === mainOutputHandleId || handleId === bangOutHandleId || isExtraOut;
        const color = dataTypeColorMap[handleDef.dataType];

        return (
            <div key={handleId as string} ref={this.ref} style={{ display: 'flex', flexDirection: isOut ? 'row' : 'row-reverse', height: '3em', gap: '5px', alignItems: 'center', alignSelf: isOut ? 'flex-end' : 'flex-start' }} >
                {!isOut && handleId !== bangInHandleId &&
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <NodeInput
                            {...{
                                dataType: handleDef.dataType,
                                value: this.state[handleId],
                                label: handleDef.label,
                                setValue: handleDef.dataType === DataTypeNames.Bang ? () => this.bang(handleId) :
                                    (v: unknown) => handleId === isActiveHandleId ? this.setInput(isActiveHandleId, v as never) :
                                        this.setInput(handleId as InputHandleId<Defs>, v as HandleTypeFromDefs<Defs, typeof handleId>),
                                disabled: getConnectedSources(this.context.masterEdges, this.id, handleId).length > 0 ||
                                    !this.state[isActiveHandleId] && handleId !== isActiveHandleId
                            } as NodeInputProps}
                        />
                        {handleDef.label && handleDef.dataType !== DataTypeNames.Bang && <div>
                            {handleDef.label}
                        </div>}
                    </div>
                }
                {isExtraOut && handleDef.dataType !== DataTypeNames.Bang &&
                    <div
                        style={{
                            padding: '0 8px',
                            fontSize: '20px',
                            background: '#1d1d20',
                            borderRadius: '4px'
                        }}
                    >
                        <div>{this.state[handleId] !== undefined ? String(this.state[handleId]) : false}</div>
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
                        className={`${handleDef.dataType} ${this.isHandleConnected(handleId) ? 'connected' : ''}`}
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
                        onConnect={connection => {
                            console.log('connection', connection.sourceHandle, connection.targetHandle, this.id)
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
        // console.log('stat', this.state)
        // return <div>Test</div>;
        const output = this.state[mainOutputHandleId];
        //@ts-ignore
        // return <div>{String(output)}</div>;
        return <div>{output !== undefined ? String(output) : false}</div>;
    }

    protected renderExtra(): ReactNode {
        return;
    }

    render() {
        const inputs = this.getInputIds().map(handleId => (this.getHandleElement(handleId)));
        const outputs: ReactNode[] = [];
        if (mainOutputHandleId in this.handleDefs) outputs.push(this.getHandleElement(mainOutputHandleId));
        const leftBang = this._isBangable && this.getHandleElement(bangInHandleId);
        const rightBang = this._isBangable && this.getHandleElement(bangOutHandleId);
        const extraOuts = this.getExtraOutIds().map(handleId => (this.getHandleElement(handleId)));
        return (
            <div style={{
                // boxShadow: 'rgb(105 121 248 / 24%) 0px 0px 20px 0px', 
                // borderRadius: 8,
                // minWidth: '200px',
                // background: '#27282d',
                // border: '1px solid #6a61d8',
                width: '100%'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 20px',
                    background: '#1d1d20',
                    fontSize: '20px',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                }}>
                    <div style={{ textAlign: 'left' }}>
                        {this.name}
                    </div>
                    {/* <NodeTitleEditor title={this.label || this.name} setTitle={label => (this.label = label) || setTimeout(() => this.forceRender(), 1)}/> */}
                </div>
                <div style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingRight: '5px' }}>{inputs}</div>
                        </div>
                        {!this.handleDefs[mainOutputHandleId] ? this.renderContent() :
                            <div
                                style={{
                                    alignContent: 'center',
                                    fontSize: '36px',
                                    background: '#1d1d20',
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
                        style={{
                            width: '100%',
                            background: '#8161f0',
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            borderBottomLeftRadius: 8,
                            borderBottomRightRadius: 8,
                        }}
                        onClick={() => this.bang(bangInHandleId)}
                    >
                        {this.actionButtonText}
                    </button>
                    <div style={{ position: 'absolute', right: 0 }}>
                        {rightBang}
                    </div>
                </div>}
            </div>
        );
    }

    componentDidMount() {
        globalNodeInstanceRegistry.set(this.id, this);
        setTimeout(() => {
            this.context.setMasterNodes(nodes => {
                return nodes.map(node => {
                    if (node.id !== this.id) return node;
                    const x = node.position.x - (node.measured?.width ?? 0) / 4;
                    const y = node.position.y - 10;
                    return { ...node, position: { x, y }, style: { visibility: 'visible' } };
                })
            });
        }, 1);
    }

    componentWillUnmount() {
        globalNodeInstanceRegistry.delete(this.id);
    }
}