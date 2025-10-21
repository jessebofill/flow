import { Position, type Node, Handle, type NodeProps } from '@xyflow/react';
import { Component, type ContextType, type ReactElement } from 'react';
import { GraphStateContext } from '../../contexts/GraphStateContext';
import { getConnectedTargets } from '../../const/utils';
import { bangOutHandleId, ouputHandleId, bangInHandleId } from '../../const/const';
import type { DataTypeName, HandleData, DataTypes, NodeTypeName } from '../../types/types';
import { nodeDefines } from '../../const/nodeDefines';
import { NodeInput } from '../NodeInput';


const dataTypeColorMap: { [K in DataTypeName]: string } = {
    bang: '#ef47f1',
    boolean: '#dfca6a',
    number: '#4eb3ff'
}

type NodeRuntimeState<
    Def extends { inputs: Record<string, HandleData>; output?: Omit<HandleData, 'id'> }
> = {
    inputValues: {
        [K in keyof Def['inputs']]?: ResolveInputTypes<Def['inputs']>[K] | undefined;
    };
    outputValue?: ResolveOutputType<Def>;
};

export abstract class NodeBase<
    Type extends NodeTypeName,
    Def extends typeof nodeDefines[Type] = typeof nodeDefines[Type],
    Inputs extends ResolveInputTypes<Def['inputs']> = ResolveInputTypes<Def['inputs']>,
    Output extends (ResolveOutputType<Def>) = ResolveOutputType<Def>
> extends Component<NodeProps<Node<{ nodeType: Type }>>, NodeRuntimeState<Def>> {
    static contextType = GraphStateContext;
    declare context: ContextType<typeof GraphStateContext>;
    // protected abstract onBang: Type extends NodeTypeName ? () => void : undefined;
    protected abstract transform: (isBang: boolean) => Output | undefined;
    nodeType: Type;
    nodeDef: typeof nodeDefines[Type]
    constructor(props: NodeProps<Node<{ nodeType: Type }>>) {
        super(props);
        this.state = {
            inputValues: {}
        };
        this.nodeType = props.data.nodeType
        this.nodeDef = nodeDefines[this.nodeType];
        console.log('node', this)
    }

    get id() {
        return this.props.id;
    }

    componentDidMount() {
        nodeInstanceRegistry.set(this.id, this as unknown as NodeInstanceUnion);
    }

    componentWillUnmount() {
        nodeInstanceRegistry.delete(this.id);
    }

    setInput = <K extends keyof Inputs>(handleId: K, value: Inputs[K] | undefined) => {
        this.setState(
            (prev) => ({
                inputValues: { ...prev.inputValues ?? {}, [handleId]: value },
            }),
            () => {
                const output = this.transform(false);
                if (output !== undefined) this.setOutput(output);
            }
        );
    };

    setOutput = (value: Output | undefined, onFinish?: () => void) => {
        this.setState(
            (prev) => ({ ...prev, outputValue: value }),
            () => (this.executeTargetCallbacks(ouputHandleId), onFinish?.())
        );
    };

    executeTargetCallbacks = (outboundHandleId: string) => {
        console.log('exe called', this.id)
        const { edges } = this.context;
        const connectedTargets = getConnectedTargets(edges, this.id, outboundHandleId);
        connectedTargets.forEach(target => {
            if (!target.targetHandleId) throw new Error('The connected target did not have an identifiable handle');
            this.executeTargetCallback(outboundHandleId, target.targetNodeId, target.targetHandleId);
        });
    };

    executeTargetCallback(sourceHandleId: string, targetNodeId: string, targetHandleId: string) {
        const node = nodeInstanceRegistry.get(targetNodeId);
        if (!node) throw new Error(`The connected target node could not be found in the registry`);

        if (sourceHandleId === bangOutHandleId) node.bang();
        else (node.setInput as (handleId: string, value: unknown) => void)(targetHandleId, this.state.outputValue);
    };

    bang() {
        const output = this.transform(true);
        console.log(`${this.id}: ${this.nodeType} banged with `, output)
        if (this.nodeType === 'bang') {
            this.executeTargetCallbacks(bangOutHandleId);
        } else {
            if (output !== undefined) {
                this.setOutput(
                    output,
                    () => this.executeTargetCallbacks(bangOutHandleId)
                );
            }
        }
    }

    private validateConnection(thisHandleId: string, connectingNodeId: string, connectingHandleId: string | null | undefined) {
        console.log('connect', thisHandleId, connectingNodeId, connectingHandleId)
        if (thisHandleId === connectingHandleId) return false;
        if (connectingNodeId === this.id) return false;
        if (connectingHandleId === null || connectingHandleId === undefined) throw new Error('Connecting node had no hanlde id to connect to');
        if (thisHandleId === bangInHandleId) return connectingHandleId === bangOutHandleId;
        if (connectingHandleId === bangInHandleId) return thisHandleId === bangOutHandleId;

        console.log('attemp')

        const otherNodeType = nodeInstanceRegistry.get(connectingNodeId)?.nodeType;
        if (!otherNodeType) throw new Error('Could not find connecting node type in the registry');
        const otherNodeDef = nodeDefines[otherNodeType];

        if (thisHandleId === ouputHandleId) {
            if (!(ouputHandleId in this.nodeDef)) throw new Error('This output handle could not find its definition in the map');
            const thisHandleType = this.nodeDef.output.dataType
            const otherHandleType = (otherNodeDef.inputs as Record<string, HandleData>)[connectingHandleId].dataType;
            return thisHandleType === otherHandleType;

        } else {
            if (connectingHandleId !== ouputHandleId) return false;
            const inputs = nodeDefines[this.nodeType].inputs as Record<string, HandleData>;
            const thisHandleType = inputs[thisHandleId].dataType;
            if (!(connectingHandleId in otherNodeDef)) throw new Error('Connecting output handle could not find its definition in the map');
            const otherHandleType = otherNodeDef.output.dataType;
            return thisHandleType === otherHandleType;
        }
    }

    private getHandleElement(handleData: HandleData) {
        const isOut = handleData.id === ouputHandleId || handleData.id === bangOutHandleId;
        const color = dataTypeColorMap[handleData.dataType];


        const key = handleData.id as keyof typeof this.state.inputValues;
        const value = this.state.inputValues[key] as ValueTypeForInputKey<typeof this.nodeDef, keyof typeof this.nodeDef.inputs>;

        return (
            <div key={handleData.id} style={{ display: 'flex', flexDirection: isOut ? 'row' : 'row-reverse', height: '2em', gap: '5px', alignItems: 'center', alignSelf: 'flex-start' }} >
                {!isOut && handleData.dataType !== 'bang' &&
                    <div style={{ display: 'flex' }}>
                        <NodeInput
                            setValue={(v: ValueTypeForDataType<typeof handleData.dataType>) => this.setInput(key, v as typeof value)}
                            dataType={handleData.dataType}
                            value={value}
                        />
                        <div style={{ margin: '0 10px' }}>
                            {handleData.label}
                        </div>
                    </div>
                }
                <Handle
                    type={isOut ? 'source' : 'target'}
                    position={isOut ? Position.Right : Position.Left}
                    id={handleData.id}
                    style={{
                        border: `2px solid ${color}`,
                        position: 'relative',
                        display: 'flex',
                        flexDirection: isOut ? 'row' : 'row-reverse',
                        alignSelf: 'baseline',
                        height: '10px',
                        width: '10px'
                    }}
                    isValidConnection={connection => this.validateConnection(handleData.id, isOut ? connection.target : connection.source, isOut ? connection.targetHandle : connection.sourceHandle)}
                />
            </div>
        );
    };

    private renderContent(): React.ReactNode {
        // console.log('stat', this.state)
        // return <div>Test</div>;
        //@ts-ignore
        return <div>{String(this.state.outputValue)}</div>;
    }

    render() {
        const inputs = Object.values(this.nodeDef.inputs).map((input) => (this.getHandleElement(input)));
        const outputs: ReactElement[] = [];
        if ('output' in this.nodeDef) outputs.push(this.getHandleElement({ id: ouputHandleId, dataType: this.nodeDef.output.dataType }));
        const hasBang = ('bangable' in this.nodeDef && this.nodeDef.bangable);
        const leftBang = hasBang && this.nodeType !== 'bang' && this.getHandleElement({ id: bangInHandleId, dataType: "bang" });
        const righBang = hasBang && this.getHandleElement({ id: bangOutHandleId, dataType: "bang" });
        return (
            <div style={{
                // boxShadow: 'rgb(105 121 248 / 24%) 0px 0px 20px 0px', 
                borderRadius: 8,
                minWidth: '200px',
                background: '#27282d',
                border: '1px solid #6a61d8'
            }}>
                <div style={{
                    textAlign: 'left',
                    padding: '0 20px',
                    background: '#1d1d20',
                    fontSize: '22px',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                }}>Title</div>
                <div style={{ padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5em' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>{inputs}</div>
                        </div>
                        <div style={{ alignContent: 'center' }}>
                            {this.renderContent()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>{outputs}</div>
                        </div>
                    </div>
                </div>
                {hasBang && <div style={{ display: 'flex', alignItems: 'center' }}>
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
                        Run
                    </button>
                    <div style={{ position: 'absolute', right: 0 }}>
                        {righBang}
                    </div>
                </div>}
            </div>
        );
    }
}

type InputsWithMatchingKeys<T extends Record<string, HandleData>> = {
    [K in keyof T]: T[K] & { id: K };
};

type ResolveInputTypes<T extends Record<string, HandleData>> = {
    [K in keyof T]: DataTypes[T[K]['dataType']];
};
type ResolveOutputType<T> = T extends { output: { dataType: keyof DataTypes } } ? DataTypes[T['output']['dataType']] : void;

type ValueTypeForInputKey<
    Def extends { inputs: Record<string, { dataType: DataTypeName }> },
    K extends keyof Def['inputs']
> = DataTypes[Def['inputs'][K]['dataType']];

type ValueTypeForDataType<T extends DataTypeName> = DataTypes[T];



type NodeInstanceUnion = {
    [K in NodeTypeName]: NodeBase<K>;
}[NodeTypeName];

export const nodeInstanceRegistry = new Map<string, NodeInstanceUnion>();
//@ts-ignore
window.reg = nodeInstanceRegistry