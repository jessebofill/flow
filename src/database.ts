import Dexie from 'dexie';
import type { HandleDefs } from './types/types';
import type { Edge, XYPosition } from '@xyflow/react';

const graphPrimaryKey = 'graphId';
const createdNodePrimaryKey = 'rfTypeIdentifier';

export interface SavedNodeState {
    react: object;
    other: object;
}

export interface SavedGraphNode {
    defNodeName: string;
    position: XYPosition;
    initState: SavedNodeState;
};

export interface SavedGraph {
    name?: string;
    edges: Edge[];
    nodes: {
        [id: string]: SavedGraphNode;
    }
    timestamp?: number;
};

export interface CreatedNode {
    [graphPrimaryKey]: string;
    isBangable: boolean;
    handleDefs: HandleDefs;
    actionLabel?: string;
};

type DbGraph = SavedGraph & {
    [graphPrimaryKey]: string;
};

type DbCreatedNode = CreatedNode & {
    [createdNodePrimaryKey]: string;
};

interface DbCache {
    userNodes: Record<string, CreatedNode>;
    graphs: Record<string, SavedGraph>;
};

class AppDatabase extends Dexie {
    graphStore!: Dexie.Table<DbGraph, string>;
    userNodesStore!: Dexie.Table<DbCreatedNode, string>;
    cache: DbCache = {
        userNodes: {},
        graphs: {},
    }

    constructor() {
        super('FlowDatabase');
        this.version(1).stores({
            graphStore: graphPrimaryKey,
            userNodesStore: createdNodePrimaryKey
        });
    }

    async putUserNode(rfTypeIdentifier: string, node: CreatedNode): Promise<void> {
        this.cache.userNodes[rfTypeIdentifier] = node;
        await this.userNodesStore.put({ rfTypeIdentifier, ...node });
    }

    async removeUserNode(rfTypeIdentifier: string): Promise<void> {
        delete this.cache.userNodes[rfTypeIdentifier];
        await this.userNodesStore.delete(rfTypeIdentifier);
    }

    async putGraph(graphId: string, graphData: SavedGraph): Promise<void> {
        graphData.timestamp = Date.now();
        this.cache.graphs[graphId] = graphData;
        // console.log(`Saved graph: ${graphId} ${JSON.stringify(this.cache.graphs[graphId])}`)
        await this.graphStore.put({ graphId, ...graphData });
    }

    async removeGraph(graphId: string): Promise<void> {
        delete this.cache.graphs[graphId];
        await this.graphStore.delete(graphId);
    }

    async syncCache() {
        this.cache.userNodes = {};
        this.cache.graphs = {};

        await this.userNodesStore.each(node => {
            const { rfTypeIdentifier, ...rest } = node;
            this.cache.userNodes[rfTypeIdentifier] = rest;
        });

        await this.graphStore.each(graph => {
            const { graphId, ...rest } = graph;
            this.cache.graphs[graphId] = rest;
        });
    }
}

export const appDb = new AppDatabase();
window.db = appDb