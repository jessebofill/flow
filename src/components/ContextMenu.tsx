import { useState, type FCChildren, type RefObject } from 'react';
import { useMenuState, ControlledMenu, type ControlledMenuProps } from '@szhsin/react-menu';

interface ContextMenuProps extends ControlledMenuProps {
    handleMenuOpenRef?: RefObject<((x: number, y: number) => void) | null>;
    elementContextMenuRef?: RefObject<HTMLElement | null>;
}

export const ContextMenu: FCChildren<ContextMenuProps> = ({ handleMenuOpenRef, elementContextMenuRef, children, ...props }) => {
    const [menuProps, toggleMenu] = useMenuState({ transition: true });
    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
    const openMenu = (x: number, y: number) => {
        setAnchorPoint({ x, y });
        toggleMenu(true);
    }

    if (handleMenuOpenRef) handleMenuOpenRef.current = openMenu;

    if (elementContextMenuRef?.current) {
        elementContextMenuRef.current.oncontextmenu = (e) => {
            e.preventDefault();
            openMenu(e.clientX, e.clientY);
        }
    }

    return (
        <ControlledMenu
            {...menuProps}
            // portal={true}
            anchorPoint={anchorPoint}
            onClose={() => toggleMenu(false)}
            direction='top'
            position='auto'
            align='center'
            gap={15}
            viewScroll='close'
            arrow={true}
            menuStyle={{ zIndex: 10000 }}
            {...props}
        >
            {children}
        </ControlledMenu>
    );
};