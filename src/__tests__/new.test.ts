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

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([{op: OpType.replace, path: '/some/other', value: 3}]);
  });

  it('should handle types without a translation function', () => {
    const acceptedOps: Operation[] = [{op: OpType.test, path: '/test', value: 'test'}];

    const proposedOps: Operation[] = [{op: OpType.replace, path: '/test', value: 'change name'}];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual(proposedOps);
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

    const proposedOps: Operation[] = [
      {op: OpType.add, path: '/something/else', value: 'change name'},
      {op: OpType.add, path: '/something/here', value: 'something else'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([]);
  });

  it('should handle path without slash', () => {
    const acceptedOps: Operation[] = [{op: OpType.remove, path: ''}];

    const proposedOps: Operation[] = [{op: OpType.replace, path: '', value: 'change name'}];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([]);
  });

  it('should handle add to the same path', () => {
    const acceptedOps: Operation[] = [{op: OpType.add, path: '/title', value: 'Hello!'}];

    const proposedOps: Operation[] = [{op: OpType.add, path: '/title', value: 'Hi World!'}];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([{op: OpType.add, path: '/title', value: 'Hi World!'}]);
  });

  it('should handle add to the same path with options', () => {
    const options = {acceptedWinsOnEqualPath: true};
    const acceptedOps: Operation[] = [{op: OpType.add, path: '/title', value: 'Hello!'}];

    const proposedOps: Operation[] = [{op: OpType.add, path: '/title', value: 'Hi World!'}];

    expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([]);
  });

  it('should handle mutliple array index changes', () => {
    const acceptedOps: Operation[] = [{op: OpType.remove, path: '/array/3'}, {op: OpType.remove, path: '/array/5'}];

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

  it('should handle array index changes with accepted copies', () => {
    // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
    const acceptedOps: Operation[] = [
      {op: OpType.copy, path: '/array/3', from: '/someval'},
      {op: OpType.copy, path: '/array/5', from: '/someval'},
    ];

    // [0, 1, 2, val, 3, val, 4, 5, 6]; <- Array after accepted copies

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

  it('should handle array index changes with accepted moves out of array', () => {
    // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
    const acceptedOps: Operation[] = [
      {op: OpType.move, path: '/someval', from: '/array/5'}, // acts like a remove
    ];

    // [0, 1, 2, 3, 4, 6]; <- Array after accepted copies

    // Actions to double some specific value
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([]);
  });

  it('should handle array index changes with accepted moves into array', () => {
    // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
    const acceptedOps: Operation[] = [
      {op: OpType.move, path: '/array/3', from: '/someval'}, // acts like an add
    ];

    // [0, 1, 2, val, 3, 5, 6]; <- Array after accepted copies

    // Actions to double some specific values
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/array/3', value: 6}, // 3 -> 6
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([{op: OpType.replace, path: '/array/4', value: 6}]);
  });

  it('should handle array index changes with accepted moves within an array', () => {
    // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
    const acceptedOps: Operation[] = [
      {op: OpType.move, path: '/array/3', from: '/array/5'}, // acts like an add
    ];

    // [0, 1, 2, val, 3, 5, 6]; <- Array after accepted copies

    // Actions to double some specific values
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/array/1', value: 2}, // 1 -> 2
      {op: OpType.replace, path: '/array/3', value: 6}, // 3 -> 6
      {op: OpType.replace, path: '/array/4', value: 8}, // 4 -> 8
      {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
      {op: OpType.replace, path: '/array/6', value: 12}, // 6 -> 12
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.replace, path: '/array/1', value: 2}, // <- unchanged
      {op: OpType.replace, path: '/array/4', value: 6},
      {op: OpType.replace, path: '/array/5', value: 8},
      // {op: OpType.replace, path: '/array/5', value: 10}, <- removed
      {op: OpType.replace, path: '/array/6', value: 12}, // <- unchanged
    ]);
  });

  it('should handle array index changes with accepted adds and removes', () => {
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

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.replace, path: '/array/1', value: 4},
      // {op: OpType.replace, path: '/array/1', value: 2}, <- removed
      {op: OpType.replace, path: '/array/5', value: 10},
    ]);
  });

  it('should handle array index changes with accepted adds and removes in different order', () => {
    // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
    const acceptedOps: Operation[] = [
      {op: OpType.add, path: '/array/1', value: 30},
      {op: OpType.remove, path: '/array/2'},
    ];

    // [0, 30, 2, 3, 4, 5, 6]; <- Array after accepted add and remove

    // Actions to double some specific values
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/array/2', value: 4}, // 2 -> 4
      {op: OpType.replace, path: '/array/1', value: 2}, // 1 -> 2
      {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.replace, path: '/array/2', value: 4},
      // {op: OpType.replace, path: '/array/1', value: 2}, <- removed
      {op: OpType.replace, path: '/array/5', value: 10},
    ]);
  });

  it('should handle array index changes with many different accepted changes', () => {
    // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
    const acceptedOps: Operation[] = [
      {op: OpType.add, path: '/array/1', value: 30},
      {op: OpType.move, path: '/array/1', from: '/array/6'},
      {op: OpType.copy, path: '/array/2', from: '/array/6'},
      {op: OpType.remove, path: '/array/0'},
    ];

    // [6, 4, 30, 1, 2, 3, 4, 5]; <- Array after accepted add and remove

    // Actions to double some specific values
    const proposedOps: Operation[] = [
      {op: OpType.move, from: '/array/2', path: '/array/4'},
      {op: OpType.remove, path: '/array/1'},
      {op: OpType.remove, path: '/array/0'},
      {op: OpType.add, path: '/array/0', value: 50},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
      {op: OpType.move, from: '/array/4', path: '/array/6'},
      {op: OpType.remove, path: '/array/3'},
      // {op: OpType.remove, path: '/array/0'}, <- removed
      {op: OpType.add, path: '/array/0', value: 50},
    ]);
  });

  it('should remove move and copy operations given different conflicts', () => {
    const acceptedOps: Operation[] = [
      {op: OpType.move, from: '/one/path', path: '/one/where'},
      {op: OpType.move, from: '/two/where', path: '/two/path'},
      {op: OpType.remove, path: '/three/path'},
    ];

    const proposedOps: Operation[] = [
      {op: OpType.copy, from: '/one/path', path: '/to/path'},
      {op: OpType.move, from: '/one/path', path: '/another/path'},
      {op: OpType.copy, from: '/two/path', path: '/another/two'},
      {op: OpType.move, from: '/two/path', path: '/another/two'},
      {op: OpType.copy, from: '/three/path', path: '/another/two'},
      {op: OpType.move, from: '/three/path', path: '/another/two'},
      {op: OpType.copy, from: '/something/else', path: '/three/path'},
      {op: OpType.move, from: '/something/else', path: '/three/path'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([]); // all removed
  });
});
