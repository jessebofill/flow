import { Position, type Node, Handle, type NodeProps } from '@xyflow/react';
import { Component, createRef, type ContextType, type ReactNode } from 'react';
import { GraphStateContext } from '../../contexts/GraphStateContext';
import { getConnectedSources, getConnectedTargets } from '../../const/utils';
import { bangOutHandleId, outputHandleId, bangInHandleId, isActiveHandleId } from '../../const/const';
import { DataTypeNames, type DataTypeName, type DataTypes, type HandleDef, type HandleDefs, type NodeClass } from '../../types/types';
import { NodeInput, type NodeInputProps } from '../NodeInput';
import Tippy from '@tippyjs/react';

const dataTypeColorMap: { [K in DataTypeName]: string } = {
    bang: '#ef47f1',
    boolean: '#fafc77',
    number: '#4eb3ff'
};

export function defineHandles<T extends HandleDefs>(defs: T): T {
    return defs;
};

export function isBangOutHandleId(id: string) {
    return id === bangOutHandleId;
}

export type InputHandleId<Defs extends HandleDefs> = {
    [Id in keyof Defs]: Id extends typeof outputHandleId
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
};

export abstract class NodeBase<Defs extends HandleDefs> extends Component<NodeProps<Node>, State<Defs>> {
    static contextType = GraphStateContext;
    declare context: ContextType<typeof GraphStateContext>;
    protected abstract handleDefs: Defs;
    /**
     * Null means don't set output or bang next
     * Pass either handle id of input that was set or bangOutHandleId if is bang
     *
     */
    protected abstract transform(id: keyof Defs | typeof bangOutHandleId): HandleTypeFromDefs<Defs, typeof outputHandleId> | undefined | null;
    protected actionButtonText = 'Run';
    protected isBangable = false;
    protected bangIfOutputNull = false;
    protected hideIsActiveHandle = false;
    // protected bangHandleDefs: HandleDefs = { [bangInHandleId]: { dataType: 'bang' }, [bangOutHandleId]: { dataType: 'bang' } };
    protected ref = createRef<HTMLDivElement>();

    constructor(props: NodeProps<Node>) {
        super(props);
        this.setDefaults();
        this.state = { ...this.state, [isActiveHandleId]: true };
        // console.log('node', this)
    }

    get id() {
        return this.props.id;
    }

    get name() {
        return (this.constructor as NodeClass).defNodeName;
    }

    onTargetConnected(sourceHandleId: string, targetNodeId: string, targetHandleId: string) {
        if (!this.isBangOutputHandle(sourceHandleId)) this.executeTargetCallback(sourceHandleId, targetNodeId, targetHandleId);
    }

    /**Execute after output and those outputs connections get called but before onFinish callbacks */
    protected onOutputChange(prevValue: HandleTypeFromDefs<Defs, typeof outputHandleId> | undefined, nextValue: HandleTypeFromDefs<Defs, typeof outputHandleId> | undefined) {

    }

    protected handleDefToId(handleDef: HandleDef) {
        return Object.entries(this.handleDefs).find(([_, def]) => def === handleDef)?.[0];
    }

    protected getInputIds() {
        return Object.entries(this.handleDefs).filter(([id, def]) => id !== outputHandleId && def.dataType !== DataTypeNames.Bang).map(entry => entry[0]);
    }
    protected getExtraBangoutIds() {
        return Object.entries(this.handleDefs).filter(([id, def]) => id !== outputHandleId && def.dataType === DataTypeNames.Bang).map(entry => entry[0]);
    }

    protected isBangOutputHandle(handleId: string) {
        return handleId === bangOutHandleId || this.getExtraBangoutIds().includes(handleId);
    }

    protected setDefaults() {
        this.state = {} as State<Defs>;
    }

    protected getHandleType(handleId: string) {
        if (handleId === isActiveHandleId) return DataTypeNames.Boolean;
        if (handleId === bangOutHandleId || handleId === bangInHandleId) return DataTypeNames.Bang;
        const handle = this.handleDefs[handleId];
        if (handle === undefined) throw new Error('Could not find handle id defined for class');
        return handle.dataType;
    }

    protected bangThroughHandleId(handleId: string) {
        this.executeTargetCallbacks(handleId);
    }

    private setStateAsync<S extends State<Defs>, K extends keyof S>(
        state: ((prevState: Readonly<S>, props: Readonly<typeof this.props>) => Pick<S, K> | S | null) | (Pick<S, K> | S | null)
    ): Promise<void> {
        return new Promise<void>(resolve => {
            this.setState(state as Readonly<State<Defs>>, resolve);
        });
    }

    private setActive(value: boolean) {
        // console.log('set active', value, this.id)
        this.setState((prev) => ({ ...prev ?? {}, [isActiveHandleId]: value }));
    };

    /**
     * Allow undefined values to change input for now. Just cast to 0. May need to change in future
     */
    private async setInput<K extends keyof Defs>(handleId: K, value: HandleTypeFromDefs<Defs, K> | undefined) {
        if (handleId !== isActiveHandleId && !this.state[isActiveHandleId]) return;
        console.log('setr', handleId, value, this.id)
        await this.setStateAsync(
            (prev) => {
                const a = ({ ...prev ?? {}, [handleId]: value ?? 0 })
                // console.log('set444', handleId, a)
                return a
            });
        const output = this.transform(handleId);
        if (output !== null) await this.setOutput(output);
    };

    private async setOutput(value: HandleTypeFromDefs<Defs, typeof outputHandleId> | undefined) {
        const prevVal = this.state[outputHandleId];
        await this.setStateAsync((prev) => ({ ...prev, [outputHandleId]: value }));
        await this.executeTargetCallbacks(outputHandleId)
        this.onOutputChange(prevVal, value);
    };

    private async executeTargetCallbacks(sourceHandleId: string): Promise<void> {
        const { edges } = this.context;
        const connectedTargets = getConnectedTargets(edges, this.id, sourceHandleId);
        for (const target of connectedTargets) {
            if (!target.targetHandleId) throw new Error('The connected target did not have an identifiable handle');
            // console.log(this.id,'exe target', target.targetNodeI
            await this.executeTargetCallback(sourceHandleId, target.targetNodeId, target.targetHandleId);
        }
    }


    private async executeTargetCallback(sourceHandleId: string, targetNodeId: string, targetHandleId: string) {
        // console.log('exe target', sourceHandleId, targetNodeId, targetHandleId, this.state[ouputHandleId])
        const node = nodeInstanceRegistry.get(targetNodeId);
        if (!node) throw new Error(`The connected target node could not be found in the registry`);

        if (this.isBangOutputHandle(sourceHandleId)) await node.bang();
        else await node.setInput(targetHandleId, this.state[outputHandleId] as HandleTypeFromDefs<typeof node.handleDefs, keyof typeof node.handleDefs>);
    };

    private async bang() {
        if (!this.state[isActiveHandleId]) return;
        const output = this.transform(bangOutHandleId);
        console.log(`${this.id}: banged with `, output)
        if (output !== null) {
            await this.setOutput(output);
            this.bangThroughHandleId(bangOutHandleId);
        }
        // } else if (this.bangIfOutputNull) {
        //     this.executeTargetCallbacks(bangOutHandleId);
        // }
    }

    private validateConnection(thisHandleId: string, connectingNodeId: string, connectingHandleId: string | null | undefined) {
        // console.log('connect', thisHandleId, connectingNodeId, connectingHandleId)
        if (thisHandleId === connectingHandleId) return false;
        if (connectingNodeId === this.id) return false;
        if (connectingHandleId === null || connectingHandleId === undefined) throw new Error('Connecting node had no hanlde id to connect to');
        // if (thisHandleId === bangInHandleId) return connectingHandleId === bangOutHandleId;
        // if (connectingHandleId === bangInHandleId) return thisHandleId === bangOutHandleId;
        if (thisHandleId === outputHandleId && connectingHandleId === outputHandleId) return false;

        const otherNodeInstance = nodeInstanceRegistry.get(connectingNodeId);
        if (!otherNodeInstance) throw new Error('Could not find connecting node type in the registry');
        const otherHandleType = otherNodeInstance.getHandleType(connectingHandleId);
        const thisHandleType = this.getHandleType(thisHandleId);
        return thisHandleType === otherHandleType;
    }

    private getHandleElement(handleId: string) {
        const handleDef = handleId === bangInHandleId || handleId === bangOutHandleId ? { dataType: 'bang' } as const :
            handleId === isActiveHandleId ? { label: 'Active', dataType: 'boolean' } as const :
                this.handleDefs[handleId];
        const isOut = handleId === outputHandleId || this.isBangOutputHandle(handleId);
        const color = dataTypeColorMap[handleDef.dataType];

        return (
            <div key={handleId as string} ref={this.ref} style={{ display: 'flex', flexDirection: isOut ? 'row' : 'row-reverse', height: '3em', gap: '5px', alignItems: 'center', alignSelf: isOut ? 'flex-end' : 'flex-start' }} >
                {!isOut && handleDef.dataType !== 'bang' &&
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <NodeInput
                            {...{
                                dataType: handleDef.dataType,
                                value: this.state[handleId],
                                setValue: (v: unknown) => handleId === isActiveHandleId ? this.setActive(v as boolean) :
                                    this.setInput(handleId as InputHandleId<Defs>, v as HandleTypeFromDefs<Defs, typeof handleId>),
                                disabled: getConnectedSources(this.context.edges, this.id, handleId).length > 0 ||
                                    !this.state[isActiveHandleId] && handleId !== isActiveHandleId
                            } as NodeInputProps}
                        />
                        {handleDef.label && <div>
                            {handleDef.label}
                        </div>}
                    </div>
                }
                {/* {isOut && handleDef.label &&
                    <div style={{ textAlign: 'right' }}>
                        {handleDef.label}
                    </div>
                } */}
                <Tippy
                    className={isOut || handleId === bangInHandleId ? '' : 'hidden'}
                    content={
                        handleId === bangInHandleId ? `${this.actionButtonText} on signal` :
                            handleId === bangOutHandleId ? 'Send signal' :
                                handleDef.label ?? 'Output'
                    }
                    placement="top"
                    arrow={false}
                    animation="fade"
                    duration={[400, 250]}>
                    <Handle
                        type={isOut ? 'source' : 'target'}
                        position={isOut ? Position.Right : Position.Left}
                        id={handleId}
                        style={{
                            border: `2px solid ${color}`,
                            position: 'relative',
                            display: 'flex',
                            flexDirection: isOut ? 'row' : 'row-reverse',
                            alignSelf: 'baseline',
                            height: '10px',
                            width: '10px'
                        }}
                        onConnect={connection => {
                            console.log('connection', connection.sourceHandle, connection.targetHandle, this.id)
                            if (connection.sourceHandle === null || connection.sourceHandle === undefined) throw new Error('Connecting source handle id did not exist');
                            if (connection.targetHandle === null || connection.targetHandle === undefined) throw new Error('Connecting target handle id did not exist');
                            const sourceNode = nodeInstanceRegistry.get(connection.source);
                            if (!sourceNode) throw new Error('Could not find source node in the node registry');
                            sourceNode.onTargetConnected(connection.sourceHandle, connection.target, connection.targetHandle);
                        }}
                        isValidConnection={connection => this.validateConnection(handleId, isOut ? connection.target : connection.source, isOut ? connection.targetHandle : connection.sourceHandle)}
                    />
                </Tippy>

            </div>
        );
    };

    protected renderContent(): ReactNode {
        // console.log('stat', this.state)
        // return <div>Test</div>;
        const output = this.state[outputHandleId];
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
        if (outputHandleId in this.handleDefs) outputs.push(this.getHandleElement(outputHandleId));
        const leftBang = this.isBangable && !this.bangIfOutputNull && this.getHandleElement(bangInHandleId);
        const rightBang = this.isBangable && this.getHandleElement(bangOutHandleId);
        const extraBangOuts = this.getExtraBangoutIds().map(handleId => (this.getHandleElement(handleId)));
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
                </div>
                <div style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingRight: '5px' }}>{inputs}</div>
                        </div>
                        {!this.handleDefs[outputHandleId] ? this.renderContent() :
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
                                {outputs.concat(extraBangOuts)}
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
                {this.isBangable && <div style={{ display: 'flex', alignItems: 'center' }}>
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
                        onClick={() => this.bang()}
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
        nodeInstanceRegistry.set(this.id, this);
        setTimeout(() => {
            this.context.setNodes(nodes => {
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
        nodeInstanceRegistry.delete(this.id);
    }
}

// type NodeInstanceUnion = {
//     [K in NodeTypeName]: NodeBase<K>;
// }[NodeTypeName];

export const nodeInstanceRegistry = new Map<string, NodeBase<HandleDefs>>();
//@ts-ignore
window.reg2 = nodeInstanceRegistry