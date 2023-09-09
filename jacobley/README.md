# Rush Monorepo

This package represents [Rush](https://rushjs.io/)'s missing root package.json.
Scripts/packages/dependencies that would normally be installed or executed at
the top level can be included here.

Furthermore, the root README is shown on my Github profile, and is confusing to
mix with technical details of this repo.

This package is never published.

Run `npm i -g @microsoft/rush` to install rush _globally_. Then run
`rush install` to get started with this repo.

`rush build` + `rush test` + `rush lint` should get you entirely up to speed
with testing the libraries locally.

## Directory

Packages are maintained in both the [tools](../../tools) and [apps](../../apps)
directories.

While there is not a hard differentiator, `tools` are generally packages that
solve one specific problem (such as
[convenient entry scripts](../../tools/entry-script/)) and are designed to be
modular and extensible. Most "tools" are a few files large at best, and expose a
single method.

`apps` on the other hand are generally more complex, and intend to fully solve a
more complicated problem (such as
[generating JSON Schema in typescript](../../apps//juniper/)). "App" does not
necessarily imply an executable or deployment (although many have a CLI
interface).

Every package has it's own README.md, check those out to get started on each
tool. The build/test steps for each package should be nearly identical, and are
abstracted/handled by Rush tooling.

## Purpose

This monorepo does not have a singular theme, and instead provides some general
tooling to easily add new open source projects.

I strongly believe in strict typing, linting, and test suites with coverage. The
setup for all that boilerplate is exhausting, and tricky to keep up to date
without a single version control system.

Rush is admittedly massive overkill for the demands of this repo (Rush is
intended for large team management of a shared repo, I am but a single person)
it was an opportunity to familiarize myself with the Rush suite of tools, and
hopefully provide example structure for teams looking to use Rush for their
monorepo management.

## Contributions

Everything in this repo is open source, and MIT licensed. Users are welcome to
use this repo as a boilerplate template, and every package as they see fit.

Improvements to existing packages and documentation is strongly encouraged! Fork
this repo and open a pull request with the desired changes. All tests will be
enforced during PR review.

## Releases

Every successful build of merged code is deployed to
[npm](https://www.npmjs.com/). It is published with a `dev` tag and a unique
hash/git commit (determined by the [Rivendell](../../apps/rivendell/) package)
for de-duping. This is my attempt to abide by the twelve factor app to ensure
the exact same software that is built is also the one that is tested and
deployed.

Releases are triggered by git tags, in the format of
`PACKAGE_NAME@MAJOR.MINOR.PATCH`. The corresponding package will download the
matching `dev` package, fix the version number, and re-publish the package as
`latest` otherwise unchanged.

## This package

### Eslint

Eslint is configured with a single [.eslintrc.cjs](./.eslintrc.cjs) for linting
every package. However the eslint package and all its plugins are not installed
at the root level. So they are instead installed/resolved from this package.

Rush's `lint` command is configured to use this project's eslint package.

### CLI

A small CLI script is setup for convenience. Rush has individual commands that
proxy to this cli.

#### get-hash-version

Calculates the command to tag and release the current version of a project.

Uses dev-published packages on npm for metadata.

#### set-dev-version

Overwrites every package to suffix the `version` field in `package.json` with
the hash (determined by [rivendell](../../apps/rivendell/README.md)).

May be run locally to test/inspect, but generally should only be executed as
part of CI deployment, and the result is not checked into git.
