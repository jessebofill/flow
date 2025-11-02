import { type FC } from 'react';
import { GraphStateProvider } from './components/GraphStateProvider';
import { FlowGraphEditor } from './components/FlowGraphEditor';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import 'tippy.js/dist/tippy.css'; // still needed for base layout
import './xy-theme.css'
import { WatchViewProvider } from './components/WatchViewProvider';
import { onAppLoad } from './const/utils';
import { NodeCreatorContextProvider } from './components/NodeCreatorContextProvider';
import { Toaster } from 'sonner';
import { NodeListProvider } from './components/NodeListProvider';
// import './style.css'

export const App: FC<object> = () => {
    return (
        <GraphStateProvider>
            <WatchViewProvider>
                <NodeCreatorContextProvider>
                    <NodeListProvider>
                        <ReactFlowProvider>
                            <Toaster richColors position="bottom-right" />
                            <FlowGraphEditor />
                        </ReactFlowProvider>
                    </NodeListProvider>
                </NodeCreatorContextProvider>
            </WatchViewProvider>
        </GraphStateProvider>
    );
};

onAppLoad();
