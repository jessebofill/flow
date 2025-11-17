import { useUpdateNodeInternals } from '@xyflow/react';
import { type ReactElement, type FC, useContext, useState, useEffect } from 'react';
import { getConnectedSources } from '../const/utils';
import { GraphStateContext } from '../contexts/GraphStateContext';

export interface VaridicHandleGroup {
    nodeId: string;
    handleGroupId: string;
    initialHandles: string[];
    onHandlesChange: (handleIds: string[]) => void;
    getHandleElement: (handleId: string, appendLabel?: string) => ReactElement;
    generateHandleId: (handleGroupId: string) => string;
};

export const VaridicHandleGroup: FC<VaridicHandleGroup> = ({ nodeId, handleGroupId, initialHandles, onHandlesChange, getHandleElement, generateHandleId }) => {
    const { masterEdges: edges } = useContext(GraphStateContext);
    const updateInternals = useUpdateNodeInternals();
    const [handles, setHandles] = useState(initialHandles);
    useEffect(() => {
        setHandles(handleIds => {
            const newIds = handleIds.flatMap((handleId, index) => {
                const isLast = index === handleIds.length - 1;
                const connectedNodes = getConnectedSources(edges, nodeId, handleId);
                if (!connectedNodes.length) return (isLast) ? handleId : [];
                return isLast ? [handleId, generateHandleId(handleGroupId)] : handleId;
            });
            return JSON.stringify(handleIds) === JSON.stringify(newIds) ? handleIds : newIds;
        });
        updateInternals(nodeId);
    }, [edges]);

    useEffect(() => onHandlesChange(handles), [handles]);

    return handles.map((id, index) => getHandleElement(id, ` ${index}`));
};
