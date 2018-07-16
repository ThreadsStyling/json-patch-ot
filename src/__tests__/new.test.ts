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
    const options = {proposedWinsOnEqualPath: true};
    const acceptedOps: Operation[] = [{op: OpType.replace, path: '/toreplace', value: 'new val'}];
    const proposedOps: Operation[] = [
      {op: OpType.replace, path: '/some/other', value: 3},
      {op: OpType.replace, path: '/toreplace', value: 'something else'},
    ];

    expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
      {op: OpType.replace, path: '/some/other', value: 3},
    ]);
  });

  it('should do nothing with non transforming accepted actions', () => {
    const options = {proposedWinsOnEqualPath: true};
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

    expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual(proposedOps);
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
});
