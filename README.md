# json-patch-ot

Library to reconcile JSON patch changes using Operational Transformation

You must pass the function a list of JSON patches that you want to transform against. These should be your accepted changes that are already accepted by the server, but were not known about at the creation of the second argument, the proposed changes.

Finally you can pass an options object which currently only supports one option. The `acceptedWinsOnEqualPath` option will decide if new `replace` operations should override an accepted `replace` that was made to the exact same `path`.

## Example

<!-- prettier-ignore-start -->
```js
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
<!-- prettier-ignore-end -->
