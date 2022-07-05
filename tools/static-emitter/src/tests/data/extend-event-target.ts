import { StaticEventTarget } from '../../static-event-target.js';
import type { ServerEvent } from './server-event.js';

/**
 * @override
 */
export class NativeEvent extends Event {
    public nativeData = 123;
}

/**
 * @override
 */
export class ExtendTarget extends StaticEventTarget<{
    foo: 123;
    bar: ServerEvent<'bar'>;
    onStuff: NativeEvent;
}> {}
