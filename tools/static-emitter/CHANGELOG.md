# Change Log

## [2.0.0] - 2022-07-05

### Changed

Static Emitter now is based off of `EventTarget` for environment-agnostic usage.

`EventTarget` itself only allow `string` for event names, and have a smaller set of native methods. It also requires every event that is emitted extend the `Event` class.

The exports have been split into a two classes:
* A type-only extension `StaticEventTarget` that _is_ `EventTarget` with support for type constraints on events.
* An extension of `StaticEventTarget`, `StaticEmitter` which includes the type constraints, as well as some lightweight helper methods for more "EventEmitter"-esque syntax with symbol support, and non-`Event` bodies. `StaticEmitter` is now a separate class from `EventTarget`, not just a type cast.

Declaring event structure has also been updated. There are now two methods for implementing.

The first is similar to original implementation, of explicitly declaring the `events` property of the emitter.

```ts
import { events, StaticEmitter } from 'static-emitter';

class MyEmitter extends StaticEmitter {

    declare [events]: {
        foo: 123;
    }
}

new MyEmitter().emit('foo', 123);
```
Note that the attributes are no longer arrays, as `EventTarget` does not allow for arbitrary lengths of events.

The second is passing the event syntax via generic parameters. This can be done either when extending the class, or when instantiating the class directly.

```ts
import { StaticEmitter } from 'static-emitter';

new StaticEmitter<{ foo: 123 }>().on('foo', (data: 123) => console.log('My Data', data));
```

`StaticEventTarget` follows the same patterns.
