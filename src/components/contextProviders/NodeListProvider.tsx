import { useEffect, useState, type FCChildren } from 'react';
import { NodeListContext } from '../../contexts/NodeListContext';
import { coreNodeTypes } from '../../const/nodeTypes';
import { EventNotifier, Events } from '../../EventNotifier';
import { Tags } from '../../const/tags';

export const NodeListProvider: FCChildren<object> = ({ children }) => {
    const initialTag = Tags.All;
    const getList = (tag: Tags) => Object.values(coreNodeTypes).filter(node => node.tags.includes(tag));
    const [update, setUpdate] = useState(0);
    const [nodeList, setNodeList] = useState(getList(initialTag));
    const [tag, setTag] = useState(initialTag);

    useEffect(() => EventNotifier.listen(Events.UpdateNodeTypes, () => setUpdate(prev => prev + 1)), []);
    useEffect(() => setNodeList(getList(tag)), [tag, update]);

    return (
        <NodeListContext.Provider value={{ nodeList, tag, setTag }}>
            {children}
        </NodeListContext.Provider>
    );
};