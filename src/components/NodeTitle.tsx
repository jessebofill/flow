import { type FC, useState } from 'react';
import { NodeTitleEditor } from './NodeTitleEditor';

interface NodeTitleProps {
    name: string;
    label?: string;
    onChange: (title: string) => void;
}
export const NodeTitle: FC<NodeTitleProps> = ({ name, label, onChange }) => {
    const [title, setTitle] = useState(label || name);
    const onTitleChange = (title: string) => {
        setTitle(title);
        onChange(title);
    };

    return <NodeTitleEditor title={title} setTitle={onTitleChange} fallback={name} />;
};
