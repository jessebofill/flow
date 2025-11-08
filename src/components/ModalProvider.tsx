import { useState, type ReactNode, type FCChildren } from 'react';
import Modal from 'react-modal';
import { ModalContext } from '../contexts/ModalContext';

Modal.setAppElement('#root'); // Ensure accessibility

type ModalEntry = {
    id: string;
    content: () => ReactNode;
};

export const ModalProvider: FCChildren<object> = ({ children }) => {
    const [modals, setModals] = useState<ModalEntry[]>([]);

    const showModal = (content: (close: () => void) => ReactNode) => {
        const id = Math.random().toString(36).slice(2);
        const close = () => setModals((prev) => prev.filter((m) => m.id !== id));
        setModals((prev) => [...prev, { id, content: () => content(close) }]);
    };

    return (
        <ModalContext.Provider value={{ showModal }}>
            {children}
            {modals.map(({ id, content }, index) => {
                return (
                    <Modal
                        key={id}
                        overlayClassName={'modal-overlay'}
                        className={'modal-content'}
                        isOpen
                        onRequestClose={() => setModals((prev) => prev.filter((m) => m.id !== id))}
                        style={{
                            content: { zIndex: 1000 + index }
                        }}
                    >
                        {content()}
                    </Modal>
                )
            })}
        </ModalContext.Provider>
    );
};
