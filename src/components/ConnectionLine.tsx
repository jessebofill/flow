import { getBezierPath, useViewport, type ConnectionLineComponentProps, type Edge } from '@xyflow/react';
import type { FC } from 'react';
import { DataTypeNames, type DataTypeName } from '../types/types';
import { globalNodeInstanceRegistry } from '../const/nodeTypes';
import { bangInHandleId, nodeCreatorNodeId } from '../const/const';

export type TBasicEdge = Edge<{
    dataType: DataTypeName;
}>

export const ConnectionLine: FC<ConnectionLineComponentProps> = ({
    fromNode,
    toNode,
    fromHandle,
    fromX,
    fromY,
    toX,
    toY,
    fromPosition,
    toPosition
}) => {
    const { zoom } = useViewport();
    if (fromNode.id === nodeCreatorNodeId) {
        fromX = correctCoord(fromX, zoom);
        fromY = correctCoord(fromY, zoom);
    }
    if (toNode?.id === nodeCreatorNodeId) {
        toX = correctCoord(toX, zoom);
        toY = correctCoord(toY, zoom);
    }

    const [edgePath] = getBezierPath({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition,
    });

    const type = fromNode.id === nodeCreatorNodeId && fromHandle.id === bangInHandleId ? DataTypeNames.Bang :
        globalNodeInstanceRegistry.get(fromNode.id)?.getHandleType(fromHandle.id!);

    return (
        <g>
            <path
                fill="none"
                stroke={'white'}
                strokeWidth={2}
                className={`animated ${type ?? 'no-color'}`}
                d={edgePath}
            />
        </g>
    );
};

const correctCoord = (value: number, zoom: number) => value + 10 / zoom - 10;