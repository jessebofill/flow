import { isActiveHandleId, variOutHandleIdPrefix } from '../../../const/const';
import { registerNodeType } from '../../../const/nodeTypes';
import { DataTypeNames } from '../../../types/types';
import { defineHandles, isBangInHandleId, NodeBase } from '../NodeBase';

const pulseSignalOutKey = `${variOutHandleIdPrefix}pulse`

const handles = defineHandles({
    interval: {
        dataType: DataTypeNames.Number,
        label: 'Interval Sec'
    },
    [pulseSignalOutKey]: {
        dataType: DataTypeNames.Bang,
        label: 'Pulsed Signal'
    }
});

@registerNodeType
export class ClockPulseNode extends NodeBase<typeof handles> {
    static defNodeName = 'Clock Pulse';
    static isBangable = true;
    protected handleDefs = handles;
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
            this.intervalId = setInterval(() => this.exeTargetCallbacks(pulseSignalOutKey), interval * 1000);
            this.running = true;
        }
    }

    protected transform(id: string) {
        if (!isBangInHandleId(id)) {
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