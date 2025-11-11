import { type Edge } from '@xyflow/react';
import { bangInHandleId, bangOutHandleId, variInHandleIdPrefix, variOutHandleIdPrefix } from '../../../const/const';
import { coreNodeTypes, registerNodeType, type NodeInstanceRegistry } from '../../../const/nodeTypes';
import { getConnectedSources, getConnectedTargets, retrieveGraph } from '../../../const/utils';
import { appDb, type SavedNodeState } from '../../../database';
import { isBangInHandleId, NodeBase, type NodeBaseProps } from '../NodeBase';
import { DataTypeNames, type HandleDefs } from '../../../types/types';

export class ProxyNode extends NodeBase<{}> {
    static defNodeName = '';
    protected handleDefs: HandleDefs = {};
    private internalEdges: Edge[] = [];
    private internalNodeInstanceRegistry!: NodeInstanceRegistry;
    declare saveableState: { initialGraphState: Record<string, SavedNodeState> };
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
        const { edges, nodeInstanceRegistry: internalRegistry } = this.instantiateVirtualNodes(graphId);
        this.internalEdges = edges;
        this.internalNodeInstanceRegistry = internalRegistry;
        internalRegistry.set(this.id, this);
        this.mergeNodeInstanceRegistries(internalRegistry);
        if (!this.isInSubGraph) this.initProxyState();
    }

    private initProxyState() {
        const inputHandleIds = Object.entries(this.handleDefs).filter(([id, def]) => id.startsWith(variInHandleIdPrefix) && def.dataType !== DataTypeNames.Bang).map(([id]) => id);
        const outputHandleIds = Object.keys(this.handleDefs).filter((id) => id.startsWith(variOutHandleIdPrefix));
        const state: { [id: string]: unknown } = {};
        inputHandleIds.forEach((inputId) => {
            const { targetNodeId, targetHandleId } = getConnectedTargets(this.internalEdges, this.id, inputId)[0];
            const targetInstance = this.nodeInstanceRegistry.get(targetNodeId)!;
            console.log(`proxy: ${this.constructor.name} got state: ${JSON.stringify(targetInstance.state[targetHandleId!])} for target ${targetInstance.constructor.name} ${targetInstance.id}`)
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

    instantiateVirtualNodes(graphId: string) {
        const { nodes, edges, nodeInstanceRegistry } = retrieveGraph(true, graphId, false, this.id, this.saveableState.initialGraphState);
        nodes.forEach(([defNodeName, props]) => {
            const NodeClass = Object.entries(coreNodeTypes).find(([identifier]) => identifier === defNodeName)?.[1];
            if (!NodeClass) throw new Error('Could not find the node class to instantiate when loading saved graph. Was its defNodeName changed?');
            new NodeClass(props);
        });

        return { nodeInstanceRegistry, edges };
    }

    saveSubGraphState() {
        const nodeStateEntries = [...this.internalNodeInstanceRegistry.values()].filter(nodeInstance => nodeInstance.id !== this.id).map(nodeInstance => {
            if (nodeInstance instanceof ProxyNode) nodeInstance.saveSubGraphState();
            const state: SavedNodeState = {
                react: structuredClone(nodeInstance.state),
                other: structuredClone(nodeInstance.saveableState)
            };

            return [nodeInstance.id, state] as const;
        });
        this.saveableState.initialGraphState = Object.fromEntries(nodeStateEntries);
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