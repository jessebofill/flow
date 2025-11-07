import Dexie from 'dexie';
import type { HandleDefs } from './types/types';
import type { Edge, XYPosition } from '@xyflow/react';

const graphPrimaryKey = 'graphId';
const graphStatePrimaryKey = 'stateId'; //use associated graph id for top level or proxy node id for sub graphs
const createdNodePrimaryKey = 'rfTypeIdentifier';

//graph is just represented by edge connections
export interface Graph {
    edges: Edge[];
};

/**
 * graph state is represented by nodes in a graph with there associated state.
 * this is stored separately from graph since sub graphs (nested proxy nodes) may share the same graph but have their own associated state.
 */
export interface GraphStateNode {
    defNodeName: string;
    position: XYPosition;
    initState: {
        react: object;
        other: object;
    }
};

export interface GraphState {
    nodes: {
        [id: string]: GraphStateNode;
    }
}

export interface CreatedNode {
    [graphPrimaryKey]: string;
    isBangable: boolean;
    handleDefs: HandleDefs;
    actionLabel?: string;
};

type DbGraph = Graph & {
    [graphPrimaryKey]: string;
};

type DbGraphState = GraphState & {
    [graphStatePrimaryKey]: string;
};

type DbCreatedNode = CreatedNode & {
    [createdNodePrimaryKey]: string;
};

interface DbCache {
    userNodes: Record<string, CreatedNode>;
    graphs: Record<string, Graph>;
    graphStates: Record<string, GraphState>;
};

class AppDatabase extends Dexie {
    graphStore!: Dexie.Table<DbGraph, string>;
    graphStateStore!: Dexie.Table<DbGraphState, string>;
    userNodesStore!: Dexie.Table<DbCreatedNode, string>;
    cache: DbCache = {
        userNodes: {},
        graphs: {},
        graphStates: {}
    }

    constructor() {
        super('FlowDatabase');
        this.version(1).stores({
            graphStore: graphPrimaryKey,
            graphStateStore: graphStatePrimaryKey,
            userNodesStore: createdNodePrimaryKey
        });
    }

    async putUserNode(rfTypeIdentifier: string, node: CreatedNode): Promise<void> {
        this.cache.userNodes[rfTypeIdentifier] = node;
        await this.userNodesStore.put({ rfTypeIdentifier, ...node });
    }

    async putGraph(graphId: string, graphData: Graph): Promise<void> {
        this.cache.graphs[graphId] = graphData;
        console.log(`Saved graph: ${graphId} ${JSON.stringify(this.cache.graphs[graphId])}`)
        await this.graphStore.put({ graphId, ...graphData });
    }
    async putGraphState(stateId: string, graphState: GraphState): Promise<void> {
        this.cache.graphStates[stateId] = graphState;
        console.log(`Saved g state: ${stateId} ${JSON.stringify(this.cache.graphStates[stateId])}`)
        await this.graphStateStore.put({ stateId, ...graphState });
    }

    async syncCache() {
        this.cache.userNodes = {};
        this.cache.graphStates = {};
        this.cache.graphs = {};

        await this.userNodesStore.each(node => {
            const { rfTypeIdentifier, ...rest } = node;
            this.cache.userNodes[rfTypeIdentifier] = rest;
        });

        await this.graphStore.each(graph => {
            const { graphId, ...rest } = graph;
            this.cache.graphs[graphId] = rest;
        });

        await this.graphStateStore.each(graphState => {
            const { stateId, ...rest } = graphState;
            this.cache.graphStates[stateId] = rest;
        });
    }
}

export const appDb = new AppDatabase();
window.db = appDb