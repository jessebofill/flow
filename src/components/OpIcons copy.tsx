import type { ReactNode } from 'react';
import { AndIcon, DivideIcon, MinusIcon, MultiplyIcon, OrIcon, PlusIcon } from './OpIcons';

export interface OpEntry<Type extends boolean | number> {
    name: string;
    icon: ReactNode;
    operation: (...args: Type[]) => Type;
};

export enum Operator {
    Or = '|',
    And = '&',
    Add = '+',
    Subtract = '-',
    Multiply = '*',
    Divide = '/',
}

export type BooleanOp = Operator.And | Operator.Or;
export type MathOp = Operator.Add | Operator.Subtract | Operator.Multiply | Operator.Divide;

export const opMap = defineOps({
    [Operator.Or]: {
        name: 'Or',
        icon: <OrIcon />,
        operation: (...args: boolean[]) => args.some(Boolean),
    },
    [Operator.And]: {
        name: 'And',
        icon: <AndIcon />,
        operation: (...args: boolean[]) => args.every(Boolean),
    },
    [Operator.Add]: {
        name: 'Add',
        icon: <PlusIcon />,
        operation: (...args: number[]) => args.reduce((a, b) => a + b, 0),
    },
    [Operator.Subtract]: {
        name: 'Subtract',
        icon: <MinusIcon />,
        operation: (...args: number[]) =>
            args.length === 0 ? 0 : args.reduce((a, b) => a - b),
    },
    [Operator.Multiply]: {
        name: 'Multiply',
        icon: <MultiplyIcon />,
        operation: (...args: number[]) => args.reduce((a, b) => a * b, 1),
    },
    [Operator.Divide]: {
        name: 'Divide',
        icon: <DivideIcon />,
        operation: (...args: number[]) =>
            args.length === 0
                ? 0
                : args.reduce((a, b) => (b === 0 ? NaN : a / b)),
    },
} as const);

function defineOps<Map extends { [Key in Operator]: OpEntry<boolean> | OpEntry<number> }>(map: Map): Map {
    return map;
}