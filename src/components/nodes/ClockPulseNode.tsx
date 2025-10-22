import { isActiveHandleId } from '../../const/const';
import { registerNodeType } from '../../const/nodeTypes';
import { DataTypeNames } from '../../types/types';
import { defineHandles, isBangOutHandleId, NodeBase } from './NodeBase';

const handles = defineHandles({
    interval: {
        dataType: DataTypeNames.Number,
        label: 'Interval Sec'
    },
    delayedSignal: {
        dataType: DataTypeNames.Bang,
        label: 'Pulsed Signal'
    }
});

@registerNodeType
export class ClockPulseNode extends NodeBase<typeof handles> {
    static defNodeName = 'Clock Pulse';
    protected handleDefs = handles;
    protected isBangable = true;
    protected running = false;
    protected actionButtonText: string = 'Start';
    protected intervalId: number = 0;

    stop() {
        clearInterval(this.intervalId);
        this.running = false;
        this.actionButtonText = 'Start';
    }

    start() {
        const interval = this.state.interval;
        if (interval && interval > 0) {
            this.actionButtonText = 'Stop';
            this.intervalId = setInterval(() => this.bangThroughHandleId(this.getExtraBangoutIds()[0]), interval * 1000);
            this.running = true;
        }
    }

    transform = (id: string) => {
        if (!isBangOutHandleId(id)) {
            if (this.running) {
                this.stop();
                const isActive = this.state[isActiveHandleId];
                if (isActive) this.start();
                if (!this.running) this.forceRender();
            }
            return null;
        }

        if (this.running) this.stop();
        else this.start();
    }
}