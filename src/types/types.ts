import type { ReactElement } from 'react';
import type { NodeBase } from '../components/nodes/NodeBase copy';
import type { ouputHandleId } from '../const/const';
import type { nodeTypeNames } from '../const/nodeDefines';

export type DataTypeName = typeof DataTypeNames[keyof typeof DataTypeNames];
export type NodeTypeName = (typeof nodeTypeNames)[number];

export const DataTypeNames = {
    Bang: 'bang',
    Boolean: 'boolean',
    Number: 'number',
} as const;

export type DataTypes = {
    [DataTypeNames.Bang]: never;
    [DataTypeNames.Boolean]: boolean;
    [DataTypeNames.Number]: number;
};

export type HandleData = {
    id: string;
    label?: string;
    dataType: DataTypeName;
};

export type HandleDef = {
    label?: ReactElement | string;
    dataType: DataTypeName; //bang type only used for outputs
};



export type HandleDefs = {
    [id: string]: HandleDef;

} & {
    [ouputHandleId]?: HandleDef;
};

export interface NodeClass {
    new(...args: any[]): NodeBase<HandleDefs>;
    defNodeName: string;
}
