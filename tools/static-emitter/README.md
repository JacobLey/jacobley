<div style="text-align:center">

<h1>static-emitter</h1>
<p>Statically typed event emitter.</p>

[![npm package](https://badge.fury.io/js/static-emitter.svg)](https://www.npmjs.com/package/static-emitter)
[![License](https://img.shields.io/npm/l/static-emitter.svg)](https://github.com/JacobLey/jacobley/blob/main/common/config/publish/LICENSE)
[![Quality](https://img.shields.io/npms-io/quality-score/enum-to-array)](https://www.npmjs.com/package/enum-to-array)

</div>

## Contents
- [Introduction](#introduction)
- [Install](#install)
- [Example](#example)
- [Usage](#usage)
- [API](#api)

<a name="Introduction"></a>
## Introduction

NodeJS's EventEmitter with support for static type enforcement of events.

Most of NodeJS's default event emitter allows for any `string | symbol` as the event name, and the data as `any[]`. So knowing/using type information is impossible without extra (unnecessary) validations, or manual casting (risky).

StaticEmitter is a type-only wrapper of EventEmitter that enforces event format via static type declarations.

<a name="Install"></a>
## Install

```sh
npm i static-emitter
```

<a name="Example"></a>
## Example

```ts
import { type events, StaticEmitter } from 'static-emitter';

class MyEmitter extends StaticEmitter {
    declare public [events]: {
        foo: [boolean, number[]];
        bar: [string];
    }
}

const myEmitter = new MyEmitter();
myEmitter.on('foo', (bool, nums) => {
    console.log(bool); // typed as boolean!
    console.log(nums); // typed as number!
});
myEmitter.emit('foo', true, [123]); // success!

myEmitter.emit('bar', { wrong: null }); // Typescript error!
```

<a name="usage"></a>
## Usage

static-emitter is an ESM module. That means it _must_ be `import`ed. To load from a CJS module, use dynamic import `const { StaticEmitter } = await import('static-emitter');`.

The `StaticEmitter` is a re-typing of NodeJS's [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter). It provides _no_ extra functionality in javascript-land. Therefore, it is highly recommended this class be used in Typescript to gain any benefit from static typing.

<a name="api"></a>
## API

### StaticEmitter

Re-export of [EventEmitter](https://nodejs.org/api/events.html#class-eventemitter). It is the same literal value, with no runtime extension (`StaticEmitter === EventEmitter`).

All methods are implemented via NodeJS's native code, only type enforcement occurs in `StaticEmitter`. Usage should look exactly the same as a normal `EventEmitter`.

To declare types, use the `events` symbol exported from `static-emitter`.

```ts
import { type events, StaticEmitter } from 'static-emitter';

class MyEmitter extends StaticEmitter {
    declare public [events]: {
        foo: [boolean, number[]];
        bar: [string];
    }
}

const eventSymbol = Symbol('eventSymbol');
class MyFancierEmitter extends MyEmitter {
    declare public [events]: MyEmitter[typeof events] & {
        eventSymbol: { data: number }[];
    }
}

const myFancierEmitter = new MyFancierEmitter();

myFancierEmitter.on('foo', (bool, nums) => {
    console.log(bool); // typed as boolean!
    console.log(nums); // typed as number!
});
myFancierEmitter.emit(eventSymbol, { data: 1 }, { data: 2 }, { data: 3 });

myEmitter.on(
    '<invalid>', // Typescript error!
    unknownData => {}
);
myFancierEmitter.emit(
    Symbol('DifferentSymbol'), // Typescript error!
    { unknownData: true }
);
```

### events

Symbol to declare types on StaticEmitter. Symbol does not exist at runtime!
Only accessible as a type.

Ensure any usage is via the `declare` or `typeof` keywords.
