<div style="text-align:center">

<h1>dependency-order</h1>
<p>Generate a dependency graph of packages in a monorepo</p>

[![npm package](https://badge.fury.io/js/dependency-order.svg)](https://www.npmjs.com/package/dependency-order)
[![License](https://img.shields.io/github/license/JacobLey/jacobley.svg)](https://github.com/JacobLey/jacobley/blob/main/common/config/publish/LICENSE)
[![Quality](https://img.shields.io/npms-io/quality-score/dependency-order.svg)](https://www.npmjs.com/package/dependency-order)

</div>

## Contents
- [Introduction](#introduction)
- [Install](#install)
- [Example](#example)
- [Usage](#usage)
- [API](#api)

<a name="Introduction"></a>
## Introduction

Generates a dependency list of packages in a monorepo.

Explicitly lists all monorepo (dev)dependencies in order, chunking into "stages" of
similar dependency depth. Order of results in deterministic by `stage` and alphabetical order.

Can be called from any location inside a monorepo.

<a name="Install"></a>
## Install

```sh
npm i dependency-order
```

<a name="Example"></a>
## Example

Given file structure
```
/
└─┬ packages
  ├─┬ my-package-a
  │ └── package.json // { dependencies: { my-package-b: 'file:../my-package-b' } }
  ├─┬ my-package-b
  │ └── package.json // { devDependencies: { my-package-c: 'file:../my-package-b' } }
  └─┬ my-package-c
    └── package.json // { dependencies: { external-package: '1.2.3' } }
```

```ts
import { dependencyOrder } from 'dependencyOrder';

const order = await dependencyOrder();

console.log(order);
// [
//     {
//         "packageName": "my-package-c",
//         "stage": 0,
//         "dependencies": [],
//         "devDependencies": []
//     },
//     {
//         "packageName": "my-package-b",
//         "stage": 1,
//         "dependencies": [],
//         "devDependencies": ["my-package-c"]
//     },
//     {
//         "packageName": "my-package-a",
//         "stage": 2,
//         "dependencies": ["my-package-b"],
//         "devDependencies": []
//     },
// ]
```

<a name="usage"></a>
## Usage

`dependency-order` is an ESM module. That means it _must_ be `import`ed. To load from a CJS module, use dynamic import `const { dependencyOrder } = await import('dependency-order');`.

Currently, this library assumes all packages are referenced by their package name.

For example, a package.json of:
```json
{
    "name": "abc",
    "dependencies": {
        "foo": "file:../bar",
    }
}
```
would fail because the package at `bar` is assumed to be named as such.

This library is also not capable of handling circular dependencies and will throw.

<a name="api"></a>
## API

### dependencyOrder(options?)

Returns a promise that resolves to a list of packages in the monorepo, in dependency order.
```json
[
    {
        "packageName": "string",
        "stage": 2,
        "dependencies": ["<package-a>"],
        "devDependencies": ["<package-b>"]
    }
]
```

Each package explicitly declares each package it is internally dependent on, defined via
`package.json`'s `dependencies`, `devDependencies`, and `optionalDependencies` (interpreted as `dependencies`).
These values are computed deeply, so A depends on B depends on C -> A depends on B + C.

A dependent packages `devDependencies` will not impact `dependencies, but not vice versa.
e.g. A depends on B dev-depends on C -> A depends on B. A dev-depends on B depends on C -> A dev-depends on B + C.

Note `peerDependencies` is omitted from this list,
as it is assumed that any usage is "inherited" by a parent package.
It is recommended `peerDependent` packages are also used in `devDependencies` if
it should explicitly impact dependency order.

Outputted `devDependencies` and `dependencies` will have no overlap.

For simplicity, dependency order is defined as a `stage` (0-based).
A packages `stage` is equal to `MAX(allDependencies.stage) + 1`.

The results are in order of increasing `stage`, with parallel packages in alphabetical order.

#### options
See [`packages-list` options](https://www.npmjs.com/package/packages-list).

### dependencyOrderByPackage(dependencies)

Convenience method for mapping dependencies by package name.
Parameter is response from `dependencyOrder`.
```json
{
    "package-a>": {
        "packageName": "<package-a>",
        "stage": 2,
        "dependencies": ["<package-b>"],
        "devDependencies": ["<package-c>"]
    }
}
```

### dependencyOrderByStage(dependencies)

Convenience method for grouping dependencies by stage.
Parameter is response from `dependencyOrder`.
```json
[
    [
        {
            "packageName": "<package-a>",
            "stage": 0,
            "dependencies": [],
            "devDependencies": []
        },
    ],
    [
        {
            "packageName": "<package-b>",
            "stage": 1,
            "dependencies": ["<package-a>"],
            "devDependencies": []
        },
    ]
]
```
