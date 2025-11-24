import { type FC, useEffect, useState } from 'react';
import { TitleEditor } from './TitleEditor';

interface NodeTitleProps {
    name: string;
    label?: string;
    onChange: (title: string) => void;
    requireButton?: boolean;
}
export const NodeTitle: FC<NodeTitleProps> = ({ name, label, requireButton = true, onChange }) => {
    const [title, setTitle] = useState(label || name);
    const onTitleChange = (title: string) => {
        setTitle(title);
        onChange(title);
    };

    useEffect(() => {
        if (!label) setTitle(name);
        else if (label !== title.trim()) setTitle(label);
    }, [label])

    return <TitleEditor title={title} setTitle={onTitleChange} fallback={name} requireButton={requireButton} />;
};
