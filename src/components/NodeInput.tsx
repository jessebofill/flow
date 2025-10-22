import type { DataTypeName, DataTypes } from '../types/types';

export type NodeInputProps = {
    [K in Exclude<DataTypeName, 'bang'>]: {
        dataType: K;
        value: DataTypes[K] | undefined;
        setValue: (value: DataTypes[K]) => void;
        disabled?: boolean;
    };
}[Exclude<DataTypeName, 'bang'>];

export function NodeInput<Props extends NodeInputProps>({ dataType, value, disabled, setValue }: Props) {
    switch (dataType) {
        case 'number':
            return (
                <input
                    value={value ?? 0}
                    className="nodrag nopan"
                    type="number"
                    onChange={(e) => setValue(parseFloat(e.target.value))}
                    style={{ maxWidth: '50px', height: '20px' }}
                    disabled={disabled}
                />
            );
        case 'boolean':
            return (
                <label className="switch">
                    <input
                        checked={value}
                        type="checkbox"
                        onChange={(e) => setValue(e.target.checked)}
                        style={{ margin: 0 }}
                        disabled={disabled}
                    />
                    <span className="slider">
                        <span className='dot' />
                    </span>
                </label>
            );
    }
}
