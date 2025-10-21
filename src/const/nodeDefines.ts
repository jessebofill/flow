import type { HandleData, NodeTypeName } from '../types/types';

export const dataTypeNames = ['bang', 'boolean', 'number'] as const;
export const nodeTypeNames = ['bang', 'rng', 'chancePercent', 'chanceThresh', 'add'] as const;

//define Node shapes here
export const nodeDefines = defineNodes({
    bang: {
        inputs: {},
        bangable: true
    },
    rng: {
        inputs: {
            min: {
                id: 'min',
                dataType: 'number'
            },
            max: {
                id: 'max',
                dataType: 'number'
            }
        },
        output: {
            dataType: 'number'
        },
        bangable: true
    },
    chancePercent: {
        inputs: {
            percent: {
                id: 'percent',
                dataType: 'number',
                label: '% Chance'
            }
        },
        output: {
            dataType: 'boolean'
        },
        bangable: true
    },
    chanceThresh: {
        inputs: {
            min: {
                id: 'min',
                dataType: 'number',
                label: 'Min'
            },
            max: {
                id: 'max',
                dataType: 'number',
                label: 'Max'
            },
            pass: {
                id: 'pass',
                dataType: 'number',
                label: 'Pass'
            }
        },
        output: {
            dataType: 'boolean'
        },
        bangable: true
    },
    add: {
        inputs: {
            p1: {
                id: 'p1',
                dataType: 'number'
            },
            p2: {
                id: 'p2',
                dataType: 'number'
            }
        },
        output: {
            dataType: 'number'
        }
    }
} as const);

type ExactKeys<T, K extends keyof T> = Exclude<keyof T, K> extends never ? T : never;
type NodeDefinition = {
    inputs: Record<string, HandleData>;
    output?: Omit<HandleData, 'id'>;
    bangable?: boolean;
};
export function defineNodes<T extends Record<NodeTypeName, NodeDefinition>>(defs: ExactKeys<T, NodeTypeName>): T {
    return defs;
}

