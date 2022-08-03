# Change Log

## [2.1.0] - 2022-08-03

### Added

Expose `run()` method for executing script lifecycle directly, in cases where the "executable" is not actually exported at the top-level.

## [2.0.0] - 2022-07-05

### Changed

[`StaticEmitter`](https://www.npmjs.com/package/static-emitter) has been updated to extend `EventTarget` rather than `EventEmitter`, for environment-agnostic usage.

This comes with a slight change to the event declaration/emitting interface, which is a breaking change.
