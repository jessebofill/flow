import { type FC } from 'react';
import { GraphStateProvider } from './components/contextProviders/GraphStateProvider';
import { FlowGraphEditor } from './components/FlowGraphEditor';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import 'tippy.js/dist/tippy.css'; // still needed for base layout
import './xy-theme.css'
import { WatchViewProvider } from './components/contextProviders/WatchViewProvider';
import { onAppLoad } from './const/utils';
import { NodeCreatorProvider } from './components/contextProviders/NodeCreatorProvider';
import { Toaster } from 'sonner';
import { NodeListProvider } from './components/contextProviders/NodeListProvider';
// import './style.css'

export const App: FC<object> = () => {
    return (
        <GraphStateProvider>
            <WatchViewProvider>
                <NodeCreatorProvider>
                    <NodeListProvider>
                        <ReactFlowProvider>
                            <Toaster richColors position="bottom-right" />
                            <FlowGraphEditor />
                        </ReactFlowProvider>
                    </NodeListProvider>
                </NodeCreatorProvider>
            </WatchViewProvider>
        </GraphStateProvider>
    );
};

onAppLoad();
