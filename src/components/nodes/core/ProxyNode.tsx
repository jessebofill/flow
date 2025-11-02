import { type Edge } from '@xyflow/react';
import { bangInHandleId, bangOutHandleId, nodeCreatorNodeId, variInHandleIdPrefix, variOutHandleIdPrefix } from '../../../const/const';
import { coreNodeTypes, registerNodeType, type NodeInstanceRegistry } from '../../../const/nodeTypes';
import { getConnectedSources, getConnectedTargets } from '../../../const/utils';
import { appDb, type GraphState, type GraphStateNode } from '../../../database';
import { isBangInHandleId, NodeBase, type NodeBaseProps } from '../NodeBase';
import { DataTypeNames, type HandleDefs } from '../../../types/types';

export class ProxyNode extends NodeBase<{}> {
    static defNodeName = '';
    protected handleDefs: HandleDefs = {};
    private internalEdges: Edge[] = [];
    private internalNodeInstanceRegistry!: NodeInstanceRegistry;
    constructor(props: NodeBaseProps) {
        super(props);
        this.load();
    }

    protected transform(id: string) {
        if (isBangInHandleId(id)) {
            (async () => {
                await this.exeTargetCallbacksWithEdges(bangInHandleId, this.internalEdges);
                await this.exeTargetCallbacks(bangOutHandleId);
            })();
        } else {
            if (this.getExtraOutIds().includes(id)) this.exeTargetCallbacks(id);
            else this.exeTargetCallbacksWithEdges(id, this.internalEdges);
        }
        return null;
    }

    private load() {
        const { graphId, handleDefs, actionLabel } = appDb.cache.userNodes[this.name];
        this.handleDefs = handleDefs;
        if (actionLabel) this.actionButtonText = actionLabel;
        const graphStateId = this.isVirtualInstance ? this.id : graphId;
        const internalRegistry = this.instantiateVirtualNodes(graphId, graphStateId);
        this.internalNodeInstanceRegistry = internalRegistry;
        internalRegistry.set(this.id, this);
        this.mergeNodeInstanceRegistries(internalRegistry);
        // console.log('reg', this.nodeInstanceRegistry)
        this.initProxyState();
    }

    private initProxyState() {
        const inputHandleIds = Object.entries(this.handleDefs).filter(([id, def]) => id.startsWith(variInHandleIdPrefix) && def.dataType !== DataTypeNames.Bang).map(([id]) => id);
        const outputHandleIds = Object.keys(this.handleDefs).filter((id) => id.startsWith(variOutHandleIdPrefix));
        // console.log(outputHandleIds, this)
        const state: { [id: string]: unknown } = {};
        inputHandleIds.forEach((inputId, index) => {
            // console.log('get targets', index, this.internalEdges, this.id, inputId)
            const { targetNodeId, targetHandleId } = getConnectedTargets(this.internalEdges, this.id, inputId)[0];
            const targetInstance = this.nodeInstanceRegistry.get(targetNodeId)!;
            // console.log('get targets', targetHandleId, inputId, this)
            console.log(`proxy: ${this.constructor.name} got state: ${JSON.stringify(targetInstance.state[targetHandleId!])} for target ${targetInstance.constructor.name}`)
            state[inputId] = targetInstance.state[targetHandleId!];
        });
        outputHandleIds.forEach(outputId => {
            const { sourceNodeId, sourceHandleId } = getConnectedSources(this.internalEdges, this.id, outputId)[0];
            const sourceInstance = this.nodeInstanceRegistry.get(sourceNodeId)!;
            state[outputId] = sourceInstance.state[sourceHandleId!];
        });

        this.state = { ...this.state, ...state };
    }

    private mergeNodeInstanceRegistries(internalNodeInstanceRegistry: NodeInstanceRegistry) {
        const externalNodeInstanceRegistry = this.nodeInstanceRegistry;
        this.nodeInstanceRegistry = new Proxy(new Map(), {
            get(_, prop) {
                if (prop === 'get') {
                    return (key: string) => {
                        return internalNodeInstanceRegistry.get(key) ?? externalNodeInstanceRegistry.get(key);
                    };
                }
                if (prop === 'has') {
                    return (key: string) =>
                        internalNodeInstanceRegistry.has(key) || externalNodeInstanceRegistry.has(key);
                }
                if (prop === 'keys') {
                    return function () {
                        const seen = new Set<string>();
                        const result: string[] = [];

                        for (const map of [internalNodeInstanceRegistry, externalNodeInstanceRegistry]) {
                            for (const key of map.keys()) {
                                if (!seen.has(key)) {
                                    seen.add(key);
                                    result.push(key);
                                }
                            }
                        }
                        return result[Symbol.iterator]();
                    };
                }

                if (prop === 'entries') {
                    return function () {
                        const seen = new Set<string>();
                        const result: [string, unknown][] = [];

                        for (const map of [internalNodeInstanceRegistry, externalNodeInstanceRegistry]) {
                            for (const [key, value] of map.entries()) {
                                if (!seen.has(key)) {
                                    seen.add(key);
                                    result.push([key, value]);
                                }
                            }
                        }
                        return result[Symbol.iterator]();
                    };
                }

                return Reflect.get(new Map(), prop);
            }
        });
    }

    instantiateVirtualNodes(graphId: string, graphStateId?: string) {
        const stateId = graphStateId ?? graphId;
        const graph = appDb.cache.graphs[graphId];
        const graphState = appDb.cache.graphStates[stateId];
        if (!graph) throw new Error(`Graph ${graphId} was not found in the database cache`);
        if (!graphState) throw new Error(`Graph state ${stateId} was not found in the database cache`);
        const nodeInstanceRegistry: NodeInstanceRegistry = new Map<string, NodeBase<HandleDefs>>();
        const edges = graph.edges.map(edge => {
            const newEdge = { ...edge };
            if (newEdge.target === nodeCreatorNodeId) newEdge.target = this.id;
            if (newEdge.source === nodeCreatorNodeId) newEdge.source = this.id;
            return newEdge;
        })
        this.internalEdges = edges;

        Object.entries(graphState.nodes).forEach(([nodeId, nodeData]) => {
            console.log('def name', nodeData.defNodeName)
            const NodeClass = Object.entries(coreNodeTypes).find(([identifier]) => identifier === nodeData.defNodeName)?.[1];
            if (!NodeClass) throw new Error('Could not find the node class to instantiate when loading saved graph. Was its defNodeName changed?');

            const stateSnapshot = { ...nodeData.initState, edges };
            const props: NodeBaseProps = {
                data: { nodeInstanceRegistry },
                id: nodeId,
                stateSnapshot,
                isVirtual: true
            };
            return new NodeClass(props);
        });
        return nodeInstanceRegistry;
    }

    saveSubGraphState() {
        const nodeStateEntries = [...this.internalNodeInstanceRegistry.values()].filter(nodeInstance => nodeInstance.id !== this.id).map(nodeInstance => {
            const state = {
                react: nodeInstance.state,
                other: nodeInstance.saveableState
            };

            return [nodeInstance.id, { defNodeName: nodeInstance.name, initState: state } as GraphStateNode];
        })

        const graphState: GraphState = {
            nodes: Object.fromEntries(nodeStateEntries)
        };
        appDb.putGraphState(this.id, graphState);
    }

    static registerUserNodeType(defNodeName: string, isBangable: boolean) {
        class ProxyWrapper extends ProxyNode {
            static defNodeName = defNodeName;
            static isBangable = isBangable;
        };
        registerNodeType(ProxyWrapper, true);
        return ProxyWrapper;
    }
}