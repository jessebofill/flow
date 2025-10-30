import { BaseEdge, getBezierPath, Position, type Edge, type EdgeProps } from '@xyflow/react';
import type { FC } from 'react';
import type { DataTypeName } from '../types/types';

export type TBasicEdge = Edge<{
    dataType: DataTypeName;
}>

export const BasicEdge: FC<EdgeProps<TBasicEdge>> = ({ id, sourceX, sourceY, targetX, targetY, data }) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition: Position.Right,
        targetX,
        targetY,
        targetPosition: Position.Left,
    });

    return (
        <>
            <BaseEdge className={data?.dataType ?? ''} id={id} path={edgePath} />
        </>
    );
};