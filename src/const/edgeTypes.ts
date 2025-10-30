import { type EdgeTypes } from '@xyflow/react';
import { basicEdgeTypeName } from './const';
import { BasicEdge } from '../components/BasicEdge';

export const edgeTypes: EdgeTypes = {
    [basicEdgeTypeName]: BasicEdge
};

// export function registerEdgeType(component: ComponentType<EdgeProps>, rfTypeIndentifier: string) {
//     edgeTypes[rfTypeIndentifier] = component;
// }