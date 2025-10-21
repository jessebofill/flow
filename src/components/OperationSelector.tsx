import { type FC, useState, useRef, type ButtonHTMLAttributes } from 'react';
import { Operator, opMap, type BooleanOp, type MathOp } from './OpIcons copy';
import Tippy from '@tippyjs/react';

interface OperationSelectorProps<Ops extends Operator> {
    operators: Ops[];
    selected: Ops;
    onChange: (op: Ops) => void;
}

export function OperationSelector<Ops extends BooleanOp | MathOp>({ operators, selected: initial, onChange }: OperationSelectorProps<Ops>) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(initial ?? operators[0]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleBlur = (e: React.FocusEvent) => {
        const next = e.relatedTarget as HTMLElement | null;
        if (!next || !dropdownRef.current?.contains(next)) setOpen(false);
    };
    console.log('select render ', open)

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <OpButton op={selected} isMenuButton={true} hideTooltip={open} onClick={() => setOpen((prev) => !prev)} onBlurCapture={handleBlur} />
            {open && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    display: 'flex',
                    padding: 0,
                    margin: 0,
                    zIndex: 1000,
                }}>
                    {operators.map((op) => <OpButton
                        key={op}
                        op={op}
                        onClick={() => {
                            setSelected(op);
                            setOpen(false);
                            onChange(op);
                        }}
                    />)}
                </div>
            )}
        </div>
    );
}

interface OpButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    op: Operator;
    hideTooltip?: boolean;
    isMenuButton?: boolean;
}

const OpButton: FC<OpButtonProps> = ({ op, hideTooltip, isMenuButton, ...buttonProps }) => {
    // console.log()
    const opEntry = opMap[op];

    return (
        <Tippy
            className={hideTooltip ? 'hidden' : ''}
            content={isMenuButton ? 'Select Operation' : opMap[op].name}
            placement="top"
            arrow={false}
            animation="fade"
            duration={[400, 250]}
        >
            <button style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
                {...buttonProps}
            >
                {opEntry.icon}
            </button>
        </Tippy>
    );
};