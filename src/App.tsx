import { type FC } from 'react';
import { GraphStateProvider } from './components/GraphStateProvider';
import { FlowGraphEditor } from './components/FlowGraphEditor';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import 'tippy.js/dist/tippy.css'; // still needed for base layout
import './xy-theme.css'
// import './style.css'

export const App: FC<object> = () => {
    return (
        <GraphStateProvider>
            <ReactFlowProvider>
                <FlowGraphEditor />
            </ReactFlowProvider>
        </GraphStateProvider>
    )
}
