<div style="text-align:center">

<h1>root-package-json</h1>
<p>Find the root package.json from an npm workspace.</p>

[![npm package](https://badge.fury.io/js/root-package-json.svg)](https://www.npmjs.com/package/root-package-json)
[![License](https://img.shields.io/npm/l/root-package-json.svg)](https://github.com/JacobLey/jacobley/blob/main/common/config/publish/LICENSE)
[![Quality](https://img.shields.io/npms-io/quality-score/root-package-json.svg)](https://github.com/JacobLey/jacobley/blob/main/tools/root-package-json)

</div>

## Contents
- [Introduction](#introduction)
- [Install](#install)
- [Example](#example)
- [Usage](#usage)
- [API](#api)

<a name="Introduction"></a>
## Introduction

Returns the path and contents of the root-most `package.json`.

Package manager agnostic.

Useful for situations where multiple `package.json`s may exist in parent directories, due to `node_modules` or workspaces.

<a name="Install"></a>
## Install

```sh
npm i root-package-json
```

<a name="Example"></a>
## Example

Given file structure
```
/
└─┬ root
  ├─┬ node_modules
  │ └─┬ root-package-json
  │   └── package.json // { name: 'root-package-json' }
  ├─┬ packages
  │ └─┬ my-package
  │   ├── my-file.js
  │   └── package.json // { name: 'my-package' }
  └── package.json // { name: 'monorepo-root' }
                └── example.js
```

`my-file.js`
```ts
import { rootPackageJson } from 'root-package-json';

const rootPackage = await rootPackageJson();

console.log(rootPackage);
// {
//    filePath: '/root/package.json',
//    package: { name: 'monorepo-root' }
// }
```

<a name="Usage"></a>
## Usage

`root-package-json` is an ESM module. That means it _must_ be `import`ed. To load from a CJS module, use dynamic import `const { rootPackageJson } = await import('root-package-json');`.

<a name="Api"></a>
## API

### rootPackageJson(options?)

Returns promise that resolves to either the root package.json, or null if none can be found.

#### options

* cwd
  * Type: `string` or `URL`
  * optional, defaults to `process.cwd()`
  * Directory to use as base directory.
  * See [`parse-cwd`](https://www.npmjs.com/package/parse-cwd).
