import JSONPatchOT, {Operation, OpType} from '../index';

describe('JSONPatchOT', () => {
  it('should cancel changes against a remove at the same level', () => {
    const acceptedOps: Operation[] = [
      {op: OpType.remove, path: '/toremove'},
      {op: OpType.remove, path: '/removed/array/3'},
    ];
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/some/other', value: 3},
      {op: OpType.replace, path: '/toremove', value: 86},
      {op: OpType.replace, path: '/removed/array/3', value: 86},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.replace, path: '/some/other', value: 3},
    ]);
  });

  it('should cancel changes against a replace at the same level', () => {
    const options = {acceptedWinsOnEqualPath: true};
    const acceptedOps: Operation[] = [{op: OpType.replace, path: '/toreplace', value: 'new val'}];
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/some/other', value: 3},
      {op: OpType.replace, path: '/toreplace', value: 'something else'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
      {op: OpType.replace, path: '/some/other', value: 3},
    ]);
  });

  it('should remove actions against add at same level with acceptedWinsOnEqualPath', () => {
    const options = {acceptedWinsOnEqualPath: true};
    const acceptedOps: Operation[] = [
      {op: OpType.add, path: '/something/else', value: 'new val'},
      {op: OpType.add, path: '/something/here', value: 'new val'},
      {op: OpType.add, path: '/another', value: 'hello'},
    ];

    // This shouldn't happen, should be prevented by client
    const proposedOps: Operation[] = [
      {op: OpType.add, path: '/something/else', value: 'change name'},
      {op: OpType.add, path: '/something/here', value: 'something else'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([]);
  });

  it('should handle path without slash', () => {
    const acceptedOps: Operation[] = [
      {op: OpType.remove, path: ''},
    ];

    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '', value: 'change name'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([]);
  });

  it('should handle add to the same path', () => {
    const acceptedOps: Operation[] = [
      {op: OpType.add, path: '/title', value: 'Hello!'},
    ];

    const proposedOps: Operation[] = [
      {op: OpType.add, path: '/title', value: 'Hi World!'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.add, path: '/title', value: 'Hi World!'},
    ]);
  });

  it('should handle add to the same path with options', () => {
    const options = {acceptedWinsOnEqualPath: true};
    const acceptedOps: Operation[] = [
      {op: OpType.add, path: '/title', value: 'Hello!'},
    ];

    const proposedOps: Operation[] = [
      {op: OpType.add, path: '/title', value: 'Hi World!'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([]);
  });

  it('should handle mutliple array index changes', () => {
    const acceptedOps: Operation[] = [
      {op: OpType.remove, path: '/array/3'},
      {op: OpType.remove, path: '/array/5'},
    ];

    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/array/4', value: 'change name'},
      {op: OpType.replace, path: '/array/7', value: 'change name'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.replace, path: '/array/3', value: 'change name'},
      {op: OpType.replace, path: '/array/5', value: 'change name'},
    ]);
  });

  it('should handle array index changes with accepted adds', () => {
    // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
    const acceptedOps: Operation[] = [
      {op: OpType.add, path: '/array/3', value: 20},
      {op: OpType.add, path: '/array/5', value: 30},
    ];

    // [0, 1, 2, 20, 3, 30, 4, 5, 6]; <- Array after accepted adds

    // Actions to double some specific values
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/array/3', value: 6}, // 3 -> 6
      {op: OpType.replace, path: '/array/4', value: 8}, // 4 -> 8
      {op: OpType.replace, path: '/array/6', value: 12}, // 6 -> 12
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.replace, path: '/array/4', value: 6},
      {op: OpType.replace, path: '/array/6', value: 8},
      {op: OpType.replace, path: '/array/8', value: 12},
    ]);
  });

  it('should handle array index changes with accepted adds and removes', () => {
    // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
    const acceptedOps: Operation[] = [
      {op: OpType.remove, path: '/array/1'},
      {op: OpType.add, path: '/array/3', value: 30},
    ];

    // [0, 2, 3, 30, 4, 5, 6]; <- Array after accepted adds

    // Actions to double some specific values
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/array/2', value: 4}, // 2 -> 4
      {op: OpType.replace, path: '/array/1', value: 2}, // 1 -> 2
      {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.replace, path: '/array/1', value: 4},
      // {op: OpType.replace, path: '/array/1', value: 2}, <- removed
      {op: OpType.replace, path: '/array/5', value: 10},
    ]);
  });
});
