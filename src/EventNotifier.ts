export class EventNotifier {
    private static bus = new EventTarget();
    static dispatch(event: Events) {
        this.bus.dispatchEvent(new Event(event));
    }
    static listen(event: Events, callback: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean) {
        this.bus.addEventListener(event, callback, options);
        return () => this.bus.removeEventListener(event, callback, options);
    }
}

export enum Events {
    UpdateNodeTypes = 'update-node-types',
    UpdateGraphList = 'update-graph-list',
    NodesChange = 'nodes-change'
}