<div style="text-align:center">

<h1>packages-list</h1>
<p>List all packages in a monorepo.</p>

[![npm package](https://badge.fury.io/js/packages-list.svg)](https://www.npmjs.com/package/packages-list)
[![License](https://img.shields.io/npm/l/packages-list.svg)](https://github.com/JacobLey/jacobley/blob/main/common/config/publish/LICENSE)
[![Quality](https://img.shields.io/npms-io/quality-score/packages-list.svg)](https://www.npmjs.com/package/packages-list)

</div>

## Contents
- [Introduction](#introduction)
- [Install](#install)
- [Example](#example)
- [Usage](#usage)
- [API](#api)

<a name="Introduction"></a>
## Introduction

Lists all packages in a monorepo.

Includes directory, name, and contents of package.json. Order is non-deterministic.

Can be called from any location inside a monorepo.

<a name="Install"></a>
## Install

```sh
npm i packages-list
```

<a name="Example"></a>
## Example

Given file structure
```
/
└─┬ packages
  ├─┬ my-package-a
  │ └── package.json
  ├─┬ my-package-b
  │ └── package.json
  └─┬ my-package-c
    └── package.json
```

```ts
import { listPackages } from 'packagesList';

const packages = await listPackages();

console.log(packages);
// [
//     {
//         "directory": "/packages/my-package-a",
//         "name": "my-package-a",
//         "packageJson": { "name": "my-package-a" }
//     },
//     {
//         "directory": "/packages/my-package-b",
//         "name": "my-package-b",
//         "packageJson": { "name": "my-package-b" }
//     },
//     {
//         "directory": "/packages/my-package-c",
//         "name": "my-package-c",
//         "packageJson": { "name": "my-package-c" }
//     }
// ]
```

<a name="usage"></a>
## Usage

`packages-list` is an ESM module. That means it _must_ be `import`ed. To load from a CJS module, use dynamic import `const { listPackages } = await import('packages-list');`.

<a name="api"></a>
## API

### listPackages(options?)

Returns a promise that resolves to a list of packages. Every package contains:
```json
{
    "directory": "string",
    "name": "string",
    "packageJson": { "name": "string", "version": "..." }
}
```

#### options
See [`root-package-json` options](https://www.npmjs.com/package/root-package-json).
