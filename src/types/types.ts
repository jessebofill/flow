import type { ReactElement } from 'react';
import type { NodeBase } from '../components/nodes/NodeBase';
import type { mainOutputHandleId } from '../const/const';
import type { Tags } from '../const/tags';

export type DataTypeName = typeof DataTypeNames[keyof typeof DataTypeNames];

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


export type HandleDef = {
    label?: ReactElement | string;
    dataType: DataTypeName; //bang type only used for outputs
};

export type HandleData = HandleDef & {
    id: string;
};

export type HandleDefs = {
    [id: string]: HandleDef;
} & {
    [mainOutputHandleId]?: HandleDef;
};

export interface NodeClass {
    new(...args: ConstructorParameters<typeof NodeBase>): NodeBase<HandleDefs>;
    isBangable: boolean;
    tags: Tags[];
    defNodeName: string;
};

// export type GraphState = {
//     edges: Edge[];
//     nodes: {
//         [id: string]: {
//             rfTypeIndentifier: string;
//             initState: {
//                 react: object;
//                 other: object;
//             }
//         }
//     }
// };