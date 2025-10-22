import type { ReactNode } from 'react';
import { AndIcon, DecIcon, DivideIcon, IncIcon, MinusIcon, MultiplyIcon, OrIcon, PlusIcon } from '../components/OpIcons';

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
    Increment = '++',
    Decrement = '--',
    Mod = '%',
}

export type BooleanOp = Operator.And | Operator.Or;
export type MathOp = Operator.Add | Operator.Subtract | Operator.Multiply | Operator.Divide;
export type CountOp = Operator.Increment | Operator.Decrement;
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
        operation: (...args: number[]) => args.length === 0 ? 0 : args.reduce((a, b) => (b === 0 ? NaN : a / b)),
    },
    [Operator.Increment]: {
        name: 'Increment',
        icon: <IncIcon />,
        operation: (p1: number, p2: number) => p1 + p2,
    },
    [Operator.Decrement]: {
        name: 'Decrement',
        icon: <DecIcon />,
        operation: (p1: number, p2: number) => p1 - p2,
    },
    [Operator.Mod]: {
        name: 'Modulus',
        icon: '',
        operation: (p1: number, p2: number) => p1 % p2
    }
} as const);

function defineOps<Map extends { [Key in Operator]: OpEntry<boolean> | OpEntry<number> }>(map: Map): Map {
    return map;
}