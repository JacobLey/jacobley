# Change Log

## [1.1.0] - 2022-05-27

### Added

Better type inference of "true" default import. The input type of `defaultImport` is now just a plain generic, and the response is explicitly calculated in the return-type.

Before response was auto-inferred based on various input shapes, which was not always reliable.

### Changed

Internally tests now assert the type of the response, as well as actual JS response (via [expect-type](https://www.npmjs.com/package/expect-type) and [Chai](https://www.npmjs.com/package/chai)).
