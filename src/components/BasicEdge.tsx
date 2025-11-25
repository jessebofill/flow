import { BaseEdge, getBezierPath, useViewport, type Edge, type EdgeProps } from '@xyflow/react';
import type { FC } from 'react';
import type { DataTypeName } from '../types/types';
import { nodeCreatorNodeId } from '../const/const';

export type TBasicEdge = Edge<{
    dataType: DataTypeName;
}>

export const BasicEdge: FC<EdgeProps<TBasicEdge>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    source,
    target,
    data
}) => {
    const { zoom } = useViewport();
    if (source === nodeCreatorNodeId) {
        sourceX = correctCoord(sourceX, zoom);
        sourceY = correctCoord(sourceY, zoom);
    }
    if (target === nodeCreatorNodeId) {
        targetX = correctCoord(targetX, zoom);
        targetY = correctCoord(targetY, zoom);
    }

    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge className={data?.dataType ?? ''} id={id} path={edgePath} />
        </>
    );
};

const correctCoord = (value: number, zoom: number) => value + 10 / zoom - 10;