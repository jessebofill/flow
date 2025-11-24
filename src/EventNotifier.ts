export enum Events {
    UpdateNodeTypes = 'update-node-types',
    UpdateGraphList = 'update-graph-list',
    NodesChange = 'nodes-change',
    NodeUpdate = 'node-update',
    SomeNewEvent = 'some-new-event'
}

// Only some events have payloads
export interface EventPayloads {
    [Events.NodeUpdate]: { id: string };
}

// Helper type: payload if defined, otherwise void
type PayloadOf<K extends Events> = K extends keyof EventPayloads ? EventPayloads[K] : void;

export class EventNotifier {
    private static bus = new EventTarget();

    static dispatch<K extends Events>(
        event: K,
        ...[detail]: PayloadOf<K> extends void ? [] : [PayloadOf<K>]
    ) {
        this.bus.dispatchEvent(new CustomEvent(event, { detail }));
    }

    static listen<K extends Events>(
        event: K,
        callback: PayloadOf<K> extends void ? () => void : (detail: PayloadOf<K>) => void,
        options?: AddEventListenerOptions | boolean
    ) {
        const handler = (e: Event) => {
            const custom = e as CustomEvent<PayloadOf<K>>;
            if (custom.detail !== undefined) {
                (callback as (detail: PayloadOf<K>) => void)(custom.detail);
            } else {
                (callback as () => void)();
            }
        };
        this.bus.addEventListener(event, handler, options);
        return () => this.bus.removeEventListener(event, handler, options);
    }
}
