import { TypedEvent } from '../../typed-event.js';

/**
 * @override
 */
export class ServerEvent<T extends string> extends TypedEvent<T> {

    public readonly serverData: string;

    public constructor(type: T, serverData: string) {
        super(type);
        this.serverData = serverData;
    }
}
