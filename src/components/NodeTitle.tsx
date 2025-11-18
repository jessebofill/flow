import { type FC, useState } from 'react';
import { TitleEditor } from './TitleEditor';

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

    return <TitleEditor title={title} setTitle={onTitleChange} fallback={name} requireButton={true}/>;
};
