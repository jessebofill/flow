import { type FC } from 'react';
import { GraphStateProvider } from './components/GraphStateProvider';
import { FlowGraphEditor } from './components/FlowGraphEditor';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import 'tippy.js/dist/tippy.css'; // still needed for base layout
import './xy-theme.css'
import { WatchViewProvider } from './components/WatchViewProvider';
// import './style.css'

export const App: FC<object> = () => {
    return (
        <GraphStateProvider>
            <WatchViewProvider>
                <ReactFlowProvider>
                    <FlowGraphEditor />
                </ReactFlowProvider>
            </WatchViewProvider>
        </GraphStateProvider>
    )
}
