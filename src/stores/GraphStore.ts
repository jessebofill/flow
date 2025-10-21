import { create } from 'zustand';

export type NodeRuntimeState = {
  value?: any;
  triggered?: boolean;
  [key: string]: any;
};

type GraphStore = {
  nodeStates: Record<string, NodeRuntimeState>;
  setNodeState: (nodeId: string, state: Partial<NodeRuntimeState>) => void;
  getNodeState: (nodeId: string) => NodeRuntimeState | undefined;
};

export const useGraphStore = create<GraphStore>((set, get) => ({
  nodeStates: {},
  setNodeState: (nodeId, state) =>
    set((s) => ({
      nodeStates: {
        ...s.nodeStates,
        [nodeId]: {
          ...s.nodeStates[nodeId],
          ...state,
        },
      },
    })),
  getNodeState: (nodeId) => get().nodeStates[nodeId],
}));
