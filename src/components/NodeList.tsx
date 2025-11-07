import type { FC } from 'react';
import { useContext, useRef, useState } from 'react';
import { BiAddToQueue } from 'react-icons/bi';
import { FaTag } from 'react-icons/fa6';
import Tippy from '@tippyjs/react';
import { NodeCreatorCallbacks } from '../contexts/NodeCreatorContext';
import { NodeListContext } from '../contexts/NodeListContext';
import { tags } from '../const/tags';
import { DraggableNodeListPreview } from './NodeListPreview';

export const NodeList: FC<object> = () => {
    const { nodeList } = useContext(NodeListContext);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nodeList.map(node => <DraggableNodeListPreview key={node.defNodeName} nodeClass={node} />)}
        </div>
    );
};

export const NodeListHeader: FC<{}> = () => {
    const { createNode } = useContext(NodeCreatorCallbacks);

    return (
        <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: '1' }}>
                <TagSelector />
            </div>
            <Tippy
                content={'Create Node'}
                placement="top"
                arrow={false}
                animation="fade"
                duration={[400, 250]}>
                <button
                    className='main'
                    onClick={createNode}>
                    <BiAddToQueue />
                </button>
            </Tippy>
        </div>
    );
};

const TagSelector: FC<object> = () => {
    const options = tags;
    const { tag: selectedTag, setTag } = useContext(NodeListContext);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleBlur = (e: React.FocusEvent) => {
        const next = e.relatedTarget as HTMLElement | null;
        if (!next || !dropdownRef.current?.contains(next)) setOpen(false);
    };

    return (
        <div className='dropdown' ref={dropdownRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex' }}>
                <button
                    className='trigger'
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flex: '1',
                        padding: '0 10px',
                        height: '30px',
                        background: '#1d1d20',
                        zIndex: '1001'
                    }}
                    onClick={() => setOpen((prev) => !prev)} onBlurCapture={handleBlur}>
                    {selectedTag}
                    <FaTag />
                </button>
            </div>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                    margin: 0,
                    zIndex: 1000,
                    boxShadow: '#02021d 2px 2px 15px 0px',
                    width: '100%',
                    background: '#1b191c',
                    overflow: 'hidden',
                    borderRadius: '8px'
                }}>
                    {options.map((option) =>
                        <div
                            key={option}
                            className={`option ${selectedTag === option ? 'selected' : ''}`}
                            style={{ padding: '3px 10px' }}
                            onMouseDown={() => {
                                setTag(option);
                                setOpen(false);
                            }}
                        >
                            {option}
                        </div>
                    )}
                </div>
            )}
        </div >
    );
};