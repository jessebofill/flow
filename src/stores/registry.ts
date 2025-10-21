export type CallbackRegistry = Map<
  string, // `${nodeId}:${handleId}`
  (value: unknown) => void
>;


export type RegisteredNodeCallbacks = {
    setInput: (handleId: string, value: unknown) => void;
    bang?: () => void;
};
export const callbackRegistry = new Map<string, RegisteredNodeCallbacks>();
