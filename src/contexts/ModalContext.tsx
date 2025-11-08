import { createContext, type ReactNode } from 'react';

type ModalContextType = {
    showModal: (content: (close: () => void) => ReactNode) => void;
};

export const ModalContext = createContext<ModalContextType>({ showModal: () => { } });