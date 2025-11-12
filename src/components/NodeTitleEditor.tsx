import { useEffect, useLayoutEffect, useRef, useState, type FC } from 'react';
import { LuPencilLine } from 'react-icons/lu';

interface NodeTitleEditorProps {
    title: string;
    setTitle: (title: string) => void;
    fallback?: string;
    showEditIndicator?: boolean;
    animateWidth?: number;
    reverse?: boolean;
    buttonMargin?: string;
}

export const NodeTitleEditor: FC<NodeTitleEditorProps> = ({ title, setTitle, fallback, showEditIndicator, animateWidth, reverse, buttonMargin }) => {
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [textWidth, setTextWidth] = useState(0);
    const [buttonWidth, setButtonWidth] = useState(0);
    const _buttonMargin = buttonMargin ?? '10px';

    useLayoutEffect(() => {
        if (spanRef.current) {
            const measured = spanRef.current.offsetWidth;
            setTextWidth(title === '' ? focused ? animateWidth ?? 100 : 0 : measured); // add padding
        }
    }, [title, focused, animateWidth]);

    useEffect(() => { if (buttonRef.current) setButtonWidth(buttonRef.current.offsetWidth) }, []);

    useEffect(() => {
        if (focused && inputRef.current) {
            inputRef.current.focus();
            //   inputRef.current.select();
        }
    }, [focused]);

    useEffect(() => {
        if (!focused && fallback && !title) {
            setTitle(fallback);
        }
    }, [fallback, focused, setTitle, title]);

    return (!reverse ?
        <div className='title-editor' style={{ position: 'relative', display: 'inline-block', marginRight: `calc(${buttonWidth}px + ${_buttonMargin})` }}>
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
                    marginLeft: title ? _buttonMargin : 0,
                    display: 'flex',
                    left: textWidth,
                    top: 0,
                    transition: 'left 0.4s ease, opacity 0.4s ease',
                    height: '100%',
                    opacity: focused ? 0 : 1,
                }}
            >
                <button
                    ref={buttonRef}
                    style={{
                        cursor: 'pointer',
                        padding: '5px',
                        pointerEvents: focused ? 'none' : 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onClick={() => setFocused(true)}
                >
                    <LuPencilLine />
                </button>
            </div>
        </div> :
        <div className='title-editor' style={{ position: 'relative', display: 'inline-block', marginLeft: `calc(${buttonWidth}px + ${_buttonMargin})` }}>
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
                    marginRight: title ? _buttonMargin : 0,
                    display: 'flex',
                    right: textWidth,
                    top: 0,
                    transition: 'right 0.4s ease, opacity 0.4s ease',
                    height: '100%',
                    opacity: focused ? 0 : 1,
                }}
            >
                <button
                    ref={buttonRef}
                    style={{
                        cursor: 'pointer',
                        padding: '5px',
                        pointerEvents: focused ? 'none' : 'auto',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    onClick={() => setFocused(true)}
                >
                    <LuPencilLine />
                </button>
            </div>
        </div>
    );
};
