import { useMemo, useState } from 'react';
import type { HandleData } from '../../types/types';
import { variOutHandleIdPrefix, variInHandleIdPrefix } from '../../const/const';

export type NodeCreatorHandleData = HandleData | Omit<HandleData, 'dataType'>;

class NodeCreatorHandleState {
    inputs: NodeCreatorHandleData[];
    outputs: NodeCreatorHandleData[];
    nextInput = 0;
    nextOutput = 0;
    constructor() {
        this.inputs = [{ id: this.generateHandleId() }];
        this.outputs = [{ id: this.generateHandleId(true) }];
    }

    setInputs(newState: NodeCreatorHandleData[]) {
        this.inputs = newState;
        return newState;
    }

    setOutputs(newState: NodeCreatorHandleData[]) {
        this.inputs = newState;
        return newState;
    }

    generateHandleId(isOut?: boolean) {
        return `${isOut ? variOutHandleIdPrefix : variInHandleIdPrefix}${isOut ? this.nextOutput++ : this.nextInput++}`;
    }
}

export const useNewNodeCreatorState = () => {
    const state = useMemo(() => new NodeCreatorHandleState(), []);
    const [inputs, _setInputs] = useState<NodeCreatorHandleData[]>(state.inputs);
    const [outputs, _setOutputs] = useState<NodeCreatorHandleData[]>(state.outputs);
    const setInputs = (update: (prev: NodeCreatorHandleData[]) => NodeCreatorHandleData[]) => _setInputs(prev => state.setInputs(update(prev)));
    const setOutputs = (update: (prev: NodeCreatorHandleData[]) => NodeCreatorHandleData[]) => _setOutputs(prev => state.setOutputs(update(prev)));
    const generateHandleId = (isOut?: boolean) => state.generateHandleId(isOut);
    const getDataType = (handleData: NodeCreatorHandleData) => 'dataType' in handleData ? handleData.dataType : 'ghost';
    return { inputs, outputs, setInputs, setOutputs, generateHandleId, getDataType };
}