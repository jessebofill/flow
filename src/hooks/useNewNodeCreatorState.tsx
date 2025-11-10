import { useMemo, useState } from 'react';
import type { HandleData, HandleDefs } from '../types/types';
import { variOutHandleIdPrefix, variInHandleIdPrefix } from '../const/const';

export type NodeCreatorHandleData = HandleData | Omit<HandleData, 'dataType'>;

class NodeCreatorHandleState {
    inputs: NodeCreatorHandleData[] = [];
    outputs: NodeCreatorHandleData[] = [];
    nextInput = 0;
    nextOutput = 0;
    constructor(initialHandles?: HandleDefs) {
        if (initialHandles) {
            this.useInitial(initialHandles, false);
            this.useInitial(initialHandles, true);
        } else {
            this.inputs = [{ id: this.generateHandleId() }];
            this.outputs = [{ id: this.generateHandleId(true) }];
        }
    }

    useInitial(handles: HandleDefs, isOut: boolean) {
        const dataArrayKey = isOut ? 'outputs' : 'inputs';
        const prefix = isOut ? variOutHandleIdPrefix : variInHandleIdPrefix;
        const entries = Object.entries(handles).filter(([handleId]) => handleId.startsWith(prefix));
        if (!entries.length) return this[dataArrayKey] = [{ id: this.generateHandleId(isOut) }];

        const nextKey = isOut ? 'nextOutput' : 'nextInput';
        const toNumber = (handleId: string) => Number(handleId.replace(prefix, ''));
        const sorted = entries.sort(([handleId1], [handleId2]) => toNumber(handleId1) - toNumber(handleId2));
        this[dataArrayKey] = sorted.map(([handleId, handle]) => ({ id: handleId, ...handle }));
        const lastEntry = entries.at(-1)?.[0];
        this[nextKey] = lastEntry ? toNumber(lastEntry) + 1 : 0;
    }

    setInputs(newState: NodeCreatorHandleData[]) {
        this.inputs = newState;
        return newState;
    }

    setOutputs(newState: NodeCreatorHandleData[]) {
        this.outputs = newState;
        return newState;
    }

    generateHandleId(isOut?: boolean) {
        return `${isOut ? variOutHandleIdPrefix : variInHandleIdPrefix}${isOut ? this.nextOutput++ : this.nextInput++}`;
    }
}

export const useNewNodeCreatorState = (initialHandles?: HandleDefs) => {
    const state = useMemo(() => new NodeCreatorHandleState(initialHandles), []);
    const [inputs, _setInputs] = useState<NodeCreatorHandleData[]>(state.inputs);
    const [outputs, _setOutputs] = useState<NodeCreatorHandleData[]>(state.outputs);
    const setInputs = (update: (prev: NodeCreatorHandleData[]) => NodeCreatorHandleData[]) => _setInputs(prev => state.setInputs(update(prev)));
    const setOutputs = (update: (prev: NodeCreatorHandleData[]) => NodeCreatorHandleData[]) => _setOutputs(prev => state.setOutputs(update(prev)));
    const generateHandleId = (isOut?: boolean) => state.generateHandleId(isOut);
    const getDataType = (handleData: NodeCreatorHandleData) => 'dataType' in handleData ? handleData.dataType : 'ghost';
    return { inputs, outputs, setInputs, setOutputs, generateHandleId, getDataType };
}