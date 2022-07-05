import { TypedEventTarget } from '../../typed-event-target.js';
import type { ServerEvent } from './server-event.js';

/**
 * @override
 */
export class ExtendTarget extends TypedEventTarget<{
    foo: 123;
    bar: ServerEvent<'bar'>;
}> {}
