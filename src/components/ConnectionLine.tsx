import { getBezierPath, Position, type ConnectionLineComponentProps, type Edge } from '@xyflow/react';
import type { FC } from 'react';
import type { DataTypeName } from '../types/types';
import { globalNodeInstanceRegistry } from '../const/nodeTypes';

export type TBasicEdge = Edge<{
    dataType: DataTypeName;
}>

export const ConnectionLine: FC<ConnectionLineComponentProps> = ({ fromNode, fromHandle, fromX, fromY, toX, toY }) => {
    const isFromSource = fromHandle.type === 'source';

    const [edgePath] = getBezierPath(isFromSource ? {
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: Position.Right,
        targetX: toX,
        targetY: toY,
        targetPosition: Position.Left,
    } : {
        sourceX: toX,
        sourceY: toY,
        sourcePosition: Position.Right,
        targetX: fromX,
        targetY: fromY,
        targetPosition: Position.Left,
    });
    const type = globalNodeInstanceRegistry.get(fromNode.id)?.getHandleType(fromHandle.id!);

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