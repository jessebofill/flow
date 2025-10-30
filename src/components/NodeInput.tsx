import { DataTypeNames, type DataTypeName, type DataTypes } from '../types/types';

export type NodeInputProps = {
    [K in DataTypeName]: {
        dataType: K;
        value: DataTypes[K] | undefined;
        setValue: (value: DataTypes[K]) => void;
        label?: string;
        disabled?: boolean;
    };
}[DataTypeName];

export function NodeInput<Props extends NodeInputProps>({ dataType, value, label, disabled, setValue }: Props) {
    switch (dataType) {
        case DataTypeNames.Number:
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
        case DataTypeNames.Boolean:
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
        case DataTypeNames.Bang:
            return (
                <button
                    onClick={setValue}
                >
                    {label || 'Run'}
                </button>
            )
    }
}
