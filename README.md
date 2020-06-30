# json-patch-ot (beta)

[![CircleCI](https://circleci.com/gh/ThreadsStyling/json-patch-ot.svg?style=svg)](https://circleci.com/gh/ThreadsStyling/json-patch-ot)
[![npm](https://img.shields.io/npm/v/@threads/json-patch-ot.svg)](https://www.npmjs.com/package/@threads/json-patch-ot)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/ef50eb32caf14e689783144b2394184d)](https://www.codacy.com/app/jasoniangreen/json-patch-ot?utm_source=github.com&utm_medium=referral&utm_content=ThreadsStyling/json-patch-ot&utm_campaign=Badge_Coverage)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/ef50eb32caf14e689783144b2394184d)](https://www.codacy.com/app/jasoniangreen/json-patch-ot?utm_source=github.com&utm_medium=referral&utm_content=ThreadsStyling/json-patch-ot&utm_campaign=Badge_Grade)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

Library to reconcile JSON patch changes using Operational Transformation

You must pass the function a list of JSON patches that you want to transform against. These should be your accepted changes that are already accepted by the server, but were not known about at the creation of the second argument, the proposed changes.

Finally you can pass an options object which currently only supports one option. The `acceptedWinsOnEqualPath` option will decide if new `replace` operations should override an accepted `replace` that was made to the exact same `path`.

**Note:** This project only exposes commonjs es2018 modules.

## Example

<!-- prettier-ignore-start -->
```js
import jsonPatchOT, { Operation } from "@threads/json-patch-ot";

// [0, 1, 2, 3, 4, 5, 6]; <- Starting array
const acceptedOps: Operation[] = [
  {op: OpType.remove, path: '/array/1'},
  {op: OpType.add, path: '/array/3', value: 30},
];

// [0, 2, 3, 30, 4, 5, 6]; <- Array after accepted add and remove

// Actions to double some specific values
const proposedOps: Operation[] = [
  {op: OpType.replace, path: '/array/2', value: 4}, // 2 -> 4
  {op: OpType.replace, path: '/array/1', value: 2}, // 1 -> 2
  {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
];

const result = JSONPatchOT(acceptedOps, proposedOps);

// result === [
//   {op: OpType.replace, path: '/array/1', value: 4}, <- index changed
//   // {op: OpType.replace, path: '/array/1', value: 2}, <- removed
//   {op: OpType.replace, path: '/array/5', value: 10}, <- unchanged
// ]

// [0, 4, 3, 30, 4, 10, 6]; <- Array after transformed proposed changes

```

## Example project

The [Book Catalogue](https://github.com/ThreadsStyling/json-patch-ot-example) is a great way to understand how this library works.

This example project implements a simple http server supporting a shared state managed with json-patch-ot.

## Options
> `acceptedWinsOnEqualPath`

For some operation types, the default behaviour is to overwrite if the proposed change has the same path as an accepted change. For example, below, without the option passed, the second replace in the proposedOps would not be remove. This is useful if you want proposed changes only to be able to change a path if they knew the value it had before. Note: `remove` ops in accepted changes always cause proposed operations with the same path to be deleted.

```js
import jsonPatchOT, { Operation } from "@threads/json-patch-ot";

const options = {acceptedWinsOnEqualPath: true};
const acceptedOps: Operation[] = [
  {op: OpType.replace, path: '/toreplace', value: 'new val'}
];
const proposedOps: Operation[] = [
  {op: OpType.replace, path: '/some/other', value: 3},
  {op: OpType.replace, path: '/toreplace', value: 'something else'},
];

const result = JSONPatchOT(acceptedOps, proposedOps, options); // options passed here

// result = [
//   {op: OpType.replace, path: '/some/other', value: 3},
//   // {op: OpType.replace, path: '/toreplace', value: 'something else'}, <- removed
// ]
```

> `redirectOnMove`

By default accepted move operations cancel proposed operations that are targeting elements within their `from` path. In the example below, without the option passed, the proposed replace operation would be discarded. By using `redirectOnMove` the proposed operation will be kept and applied to the moved element on its new path instead.
```js
import jsonPatchOT, { Operation } from "@threads/json-patch-ot";

const options = {redirectOnMove: true};
const acceptedOps: Operation[] = [{op: OpType.move, from: '/frompath', path: '/topath'}];
const proposedOps: Operation[] = [{op: OpType.replace, path: '/frompath', value: 10}];

const result = JSONPatchOT(acceptedOps, proposedOps, options); // options passed here

// result = [
//   {op: OpType.replace, path: '/topath', value: 10},
// ]
```
<!-- prettier-ignore-end -->

## Acknowledgements

Thanks to Palindrom's [JSON-Patch-OT](https://github.com/Palindrom/JSON-Patch-OT/) lib which this was originally built upon.

The reasons we built a new library, rather than contributing back to the one by Palindrom were:

1.  Palindrom obviously needed only a subset of the functionality of JSON Patch as large areas were not implemented. Transforming operations against an `add` to an array, or a `move` into an array are just some of the cases that were not covered at all.
2.  Merging back changes into a lib for a framework that didn't need those changes was always going to be awkward. We needed to move fast.
3.  We wanted to write the whole thing in TypeScript to give us a safer more stable core lib.
4.  There hadn't been much activity on the lib in a while when we were looking at it.

## License

MIT

## Work in progress

**Please note:** This is a work in progress. You are free to use it how you like, but be aware that you do so at your own risk.
