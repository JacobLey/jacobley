<div style="text-align:center">

<h1>packages-list</h1>
<p>List all packages in a monorepo.</p>

[![npm package](https://badge.fury.io/js/packages-list.svg)](https://www.npmjs.com/package/packages-list)
[![License](https://img.shields.io/npm/l/packages-list.svg)](https://github.com/JacobLey/jacobley/blob/main/common/config/publish/LICENSE)
[![Quality](https://img.shields.io/npms-io/quality-score/packages-list.svg)](https://github.com/JacobLey/jacobley/blob/main/tools/packages-list)

</div>

## Contents
- [Introduction](#introduction)
- [Supported Package Managers](#supported-package-managers)
- [Install](#install)
- [Example](#example)
- [Usage](#usage)
- [API](#api)

<a name="Introduction"></a>
## Introduction

Lists all packages in a monorepo.

Includes directory, name, and contents of package.json. Order is non-deterministic.

Can be called from any location inside a monorepo.

<a name="Supported Package Managers"></a>
## Supported Package Managers

Package managers that are supported for finding/parsing packages are:

* ✅ [Lerna](https://lerna.js.org/)
* ✅ [NPM](https://docs.npmjs.com/cli/v8/using-npm/workspaces)
* ✅ [Nx](https://nx.dev/configuration/projectjson#workspace-json)
* ✅ [Rush](https://rushjs.io/pages/configs/rush_json/)
* ✅ [Yarn](https://yarnpkg.com/features/workspaces)

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

<a name="Usage"></a>
## Usage

`packages-list` is an ESM module. That means it _must_ be `import`ed. To load from a CJS module, use dynamic import `const { listPackages } = await import('packages-list');`.

<a name="Api"></a>
## API

### listPackages(options?)

Returns a promise that resolves to an array of packages. Every package contains:
```json
{
    "directory": "string",
    "name": "string",
    "packageJson": { "name": "string", "version": "..." }
}
```

#### options

* cwd
  * Type: `string` or `URL`
  * optional, defaults to `process.cwd()`
  * Directory to use as base directory.
  * See [`parse-cwd`](https://www.npmjs.com/package/parse-cwd).

* manager
  * Specify package manager to use
  * `'lerna'` | `'npm'` | `'nx'` | `'rush'` | `'yarn'`
  * If omitted, will try all and take first found
    * e.g. would use `lerna.json` to load packages if found, but can be forced to use npm workspaces if `manager = 'npm'`
