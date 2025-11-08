import { useEffect, useLayoutEffect, useRef, useState, type FC } from 'react';
import { LuPencilLine } from 'react-icons/lu';

interface NodeTitleEditorProps {
    title: string;
    setTitle: (title: string) => void;
    showEditIndicator?: boolean;
    animateWidth?: number;
    reverse?: boolean;
    buttonMargin?: string;
}

export const NodeTitleEditor: FC<NodeTitleEditorProps> = ({ title, setTitle, showEditIndicator, animateWidth, reverse, buttonMargin }) => {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);
    const [textWidth, setTextWidth] = useState(0);

    useLayoutEffect(() => {
        if (spanRef.current) {
            const measured = spanRef.current.offsetWidth;
            setTextWidth(title === '' ? focused ? animateWidth ?? 100 : 0 : measured); // add padding
        }
    }, [title, focused, animateWidth]);

    useEffect(() => {
        if (focused && inputRef.current) {
            inputRef.current.focus();
            //   inputRef.current.select();
        }
    }, [focused]);

    return (!reverse ?
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <span
                ref={spanRef}
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    whiteSpace: 'pre',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                }}
            >
                {title}
            </span>
            <input
                ref={inputRef}
                style={{
                    width: textWidth,
                    opacity: textWidth > 0 ? 1 : 0,
                    transition: focused && title === '' ? 'width 0.4s ease, opacity 0.4s ease' : 'none',
                    background: 'transparent',
                    border: 'none',
                    padding: '0',
                    borderBottom: focused ? '0.11rem solid #ccc' : 'none',
                    outline: 'none',
                    textAlign: 'left',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    position: 'relative',
                    left: 0,
                }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            {showEditIndicator && '*'}
            <div
                style={{
                    position: 'absolute',
                    marginLeft: title ? buttonMargin ?? '10px' : 0,
                    display: 'flex',
                    left: textWidth,
                    top: 0,
                    transition: 'left 0.4s ease, opacity 0.4s ease',
                    height: '100%',
                    opacity: focused ? 0 : 1,
                }}
            >
                <button
                    style={{
                        cursor: 'pointer',
                        padding: '5px',
                        pointerEvents: focused ? 'none' : 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        // width: '2.5rem',
                        background: 'none'
                    }}
                    onClick={() => setFocused(true)}
                >
                    <LuPencilLine />
                </button>
            </div>
        </div> :
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <span
                ref={spanRef}
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    whiteSpace: 'pre',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                }}
            >
                {title}
            </span>
            <input
                ref={inputRef}
                style={{
                    width: textWidth,
                    opacity: textWidth > 0 ? 1 : 0,
                    transition: focused && title === '' ? 'width 0.4s ease, opacity 0.4s ease' : 'none',
                    background: 'transparent',
                    border: 'none',
                    padding: '0',
                    borderBottom: focused ? '0.11rem solid #ccc' : 'none',
                    outline: 'none',
                    textAlign: 'right',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    position: 'relative',
                    right: 0,
                }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            <div
                style={{
                    position: 'absolute',
                    marginRight: title ? buttonMargin ?? '10px' : 0,
                    display: 'flex',
                    right: textWidth,
                    top: 0,
                    transition: 'right 0.4s ease, opacity 0.4s ease',
                    height: '100%',
                    opacity: focused ? 0 : 1,
                }}
            >
                <button
                    style={{
                        cursor: 'pointer',
                        padding: '5px',
                        pointerEvents: focused ? 'none' : 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        // width: '2.5rem',
                        background: 'none'
                    }}
                    onClick={() => setFocused(true)}
                >
                    <LuPencilLine />
                </button>
            </div>
        </div>
    );
};
