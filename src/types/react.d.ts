import { FunctionComponent, PropsWithChildren } from 'react';

declare module 'react' {
    type FCChildren<P = object> = FunctionComponent<PropsWithChildren<P>>;
}