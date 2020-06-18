import JSONPatchOT, {Operation, OpType} from '../index';

describe('JSONPatchOT', () => {
  it('should handle path without slash', () => {
    const acceptedOps: Operation[] = [{op: OpType.remove, path: ''}];
    const proposedOps: Operation[] = [{op: OpType.replace, path: '', value: 'change name'}];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([]);
  });

  it('should return unchanged operations if no translation function defined', () => {
    const acceptedOps: Operation[] = [{op: OpType.test, path: '/test', value: 'test'}];
    const proposedOps: Operation[] = [{op: OpType.replace, path: '/test', value: 'change name'}];

    expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual(proposedOps);
  });

  describe('against remove', () => {
    it('should cancel changes at the same level', () => {
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

    it('should cancel changes at higher levels', () => {
      const acceptedOps: Operation[] = [{op: OpType.remove, path: '/removed/array/3'}];
      const proposedOps: Operation[] = [
        {op: OpType.replace, path: '/removed/array/3/subarray/0', value: 86},
        {op: OpType.replace, path: '/removed/array/3/subarray/1', value: 86},
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([]);
    });

    it('should transpose array indices', () => {
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

    it('should transpose array indices for operations at higher level', () => {
      const acceptedOps: Operation[] = [
        {op: OpType.remove, path: '/array/0'},
        {op: OpType.remove, path: '/array/5'},
      ];
      const proposedOps: Operation[] = [
        {op: OpType.replace, path: '/array/4/subarray/0', value: 'change name'},
        {op: OpType.replace, path: '/array/7/subarray/1', value: 'change name'},
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.replace, path: '/array/3/subarray/0', value: 'change name'},
        {op: OpType.replace, path: '/array/5/subarray/1', value: 'change name'},
      ]);
    });
  });

  describe('against replace', () => {
    it('should accept changes at the same level', () => {
      const acceptedOps: Operation[] = [{op: OpType.replace, path: '/toreplace', value: 'new val'}];
      const proposedOps: Operation[] = [
        {op: OpType.replace, path: '/some/other', value: 3},
        {op: OpType.replace, path: '/toreplace', value: 'something else'},
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.replace, path: '/some/other', value: 3},
        {op: OpType.replace, path: '/toreplace', value: 'something else'},
      ]);
    });

    describe('with acceptedWinsOnEqualPath', () => {
      it('should cancel changes at the same level', () => {
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
    });
  });

  describe('against add', () => {
    it('should handle add to the same path', () => {
      const acceptedOps: Operation[] = [{op: OpType.add, path: '/title', value: 'Hello!'}];
      const proposedOps: Operation[] = [{op: OpType.add, path: '/title', value: 'Hi World!'}];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([{op: OpType.add, path: '/title', value: 'Hi World!'}]);
    });

    it('should transpose multiple array indices', () => {
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

    it('should transpose multiple array indices for higher level ops', () => {
      // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
      const acceptedOps: Operation[] = [
        {op: OpType.add, path: '/array/3', value: 20},
        {op: OpType.add, path: '/array/5', value: 30},
      ];

      // [0, 1, 2, 20, 3, 30, 4, 5, 6]; <- Array after accepted adds

      // Actions to double some specific values
      const proposedOps: Operation[] = [
        {op: OpType.replace, path: '/array/2/subarray/0', value: 6}, // 3 -> 6
        {op: OpType.replace, path: '/array/3/subarray/1', value: 8}, // 4 -> 8
        {op: OpType.replace, path: '/array/6/subarray/2', value: 12}, // 6 -> 12
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.replace, path: '/array/2/subarray/0', value: 6},
        {op: OpType.replace, path: '/array/4/subarray/1', value: 8},
        {op: OpType.replace, path: '/array/8/subarray/2', value: 12},
      ]);
    });

    describe('with acceptedWinsOnEqualPath', () => {
      it('should cancel actions at same level', () => {
        const options = {acceptedWinsOnEqualPath: true};
        const acceptedOps: Operation[] = [
          {op: OpType.add, path: '/something/else', value: 'new val'},
          {op: OpType.add, path: '/something/here', value: 'new val'},
          {op: OpType.add, path: '/another', value: 'hello'},
        ];

        const proposedOps: Operation[] = [
          {op: OpType.add, path: '/something/else', value: 'change name'},
          {op: OpType.add, path: '/something/here', value: 'something else'},
          {op: OpType.add, path: '/unrelated/path', value: 'something else'},
        ];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
          {op: OpType.add, path: '/unrelated/path', value: 'something else'},
        ]);
      });

      it('should transpose array index of replace action at same level', () => {
        const options = {acceptedWinsOnEqualPath: true};
        const acceptedOps: Operation[] = [{op: OpType.add, path: '/something/1', value: 'new val'}];

        const proposedOps: Operation[] = [{op: OpType.replace, path: '/something/1', value: 'change name'}];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
          {op: OpType.replace, path: '/something/2', value: 'change name'},
        ]);
      });

      it('should transpose array index of replace action against multiple adds at same level', () => {
        const options = {acceptedWinsOnEqualPath: true};
        const acceptedOps: Operation[] = [
          {op: OpType.add, path: '/something/1', value: 'new val'},
          {op: OpType.add, path: '/something/1', value: 'new val'},
          {op: OpType.add, path: '/something/1', value: 'new val'},
          {op: OpType.add, path: '/something/1', value: 'new val'},
        ];

        const proposedOps: Operation[] = [{op: OpType.replace, path: '/something/1', value: 'change name'}];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
          {op: OpType.replace, path: '/something/5', value: 'change name'},
        ]);
      });

      it('should cancel a replace against an add on path including array index but ending with a prop', () => {
        const options = {acceptedWinsOnEqualPath: true};
        const acceptedOps: Operation[] = [{op: OpType.add, path: '/something/1/name', value: 'new val'}];

        const proposedOps: Operation[] = [{op: OpType.replace, path: '/something/1/name', value: 'change name'}];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([]);
      });
    });
  });

  describe('against copy', () => {
    it('should transpose multiple array indices', () => {
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
  });

  describe('against move', () => {
    it('should redirect to moved key', () => {
      const acceptedOps: Operation[] = [{op: OpType.move, path: '/someval', from: '/array/5'}];

      const proposedOps: Operation[] = [
        {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([{op: OpType.replace, path: '/someval', value: 10}]);
    });

    it('should redirect to a moved key within a subpath', () => {
      const acceptedOps: Operation[] = [{op: OpType.move, path: '/rows/5', from: '/rows/0'}];

      const proposedOps: Operation[] = [{op: OpType.replace, path: '/rows/0/columns/0/modules/2', value: 'Hello'}];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.replace, path: '/rows/5/columns/0/modules/2', value: 'Hello'},
      ]);
    });

    it('should redirect to a moved key within a subpath after consecutive moves', () => {
      const acceptedOps: Operation[] = [
        {op: OpType.move, path: '/rows/1', from: '/rows/0'},
        {op: OpType.move, path: '/rows/2', from: '/rows/1'},
        {op: OpType.move, path: '/rows/3', from: '/rows/2'},
        {op: OpType.move, path: '/rows/4', from: '/rows/3'},
        {op: OpType.move, path: '/rows/5', from: '/rows/4'},
      ];

      const proposedOps: Operation[] = [{op: OpType.replace, path: '/rows/0/columns/0/modules/2', value: 'Hello'}];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.replace, path: '/rows/5/columns/0/modules/2', value: 'Hello'},
      ]);
    });

    it('redirect higher level paths after moving lower levels (moving to front)', () => {
      const acceptedOps: Operation[] = [{op: OpType.move, from: '/rows/6', path: '/rows/0'}];

      const proposedOps: Operation[] = [
        {op: OpType.move, from: '/rows/4/columns/0/modules/2', path: '/rows/6/columns/0/modules/1'},
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.move, from: '/rows/5/columns/0/modules/2', path: '/rows/0/columns/0/modules/1'},
      ]);
    });

    it('redirect higher level paths after moving lower levels (moving to back)', () => {
      const acceptedOps: Operation[] = [{op: OpType.move, from: '/rows/0', path: '/rows/6'}];

      const proposedOps: Operation[] = [
        {op: OpType.move, from: '/rows/4/columns/0/modules/2', path: '/rows/0/columns/0/modules/1'},
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.move, from: '/rows/3/columns/0/modules/2', path: '/rows/6/columns/0/modules/1'},
      ]);
    });

    it('should transpose array index with accepted moves into array', () => {
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

    it('should transpose array indices with accepted moves within an array', () => {
      // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
      const acceptedOps: Operation[] = [
        {op: OpType.move, path: '/array/3', from: '/array/5'}, // acts like an add and remove
      ];

      // [0, 1, 2, 5, 3, 4, 6]; <- Array after accepted copies

      // Actions to double some specific values
      const proposedOps: Operation[] = [
        {op: OpType.replace, path: '/array/1', value: 2}, // 1 -> 2
        {op: OpType.replace, path: '/array/3/title', value: 6}, // 3 -> 6
        {op: OpType.replace, path: '/array/4', value: 8}, // 4 -> 8
        {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
        {op: OpType.replace, path: '/array/6', value: 12}, // 6 -> 12
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.replace, path: '/array/1', value: 2}, // <- unchanged
        {op: OpType.replace, path: '/array/4/title', value: 6},
        {op: OpType.replace, path: '/array/5', value: 8},
        {op: OpType.replace, path: '/array/3', value: 10}, // <- 3 -> 10 instead of 5 -> 10
        {op: OpType.replace, path: '/array/6', value: 12}, // <- unchanged
      ]);
    });

    it('should transpose array indices with consecutive accepted moves within an array', () => {
      // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
      const acceptedOps: Operation[] = [
        {op: OpType.move, path: '/array/4', from: '/array/5'},
        {op: OpType.move, path: '/array/3', from: '/array/4'},
        {op: OpType.move, path: '/array/2', from: '/array/3'},
      ];

      // [0, 1, 5, 2, 3, 4, 6]; <- Array after accepted copies

      // Actions to double some specific values
      const proposedOps: Operation[] = [
        {op: OpType.replace, path: '/array/1', value: 2}, // 1 -> 2
        {op: OpType.replace, path: '/array/2', value: 4}, // 3 -> 6
        {op: OpType.replace, path: '/array/3', value: 6}, // 3 -> 6
        {op: OpType.replace, path: '/array/4', value: 8}, // 4 -> 8
        {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
        {op: OpType.replace, path: '/array/6', value: 12}, // 6 -> 12
      ];

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.replace, path: '/array/1', value: 2}, // <- unchanged
        {op: OpType.replace, path: '/array/3', value: 4}, // 3 -> 6
        {op: OpType.replace, path: '/array/4', value: 6},
        {op: OpType.replace, path: '/array/5', value: 8},
        {op: OpType.replace, path: '/array/2', value: 10}, // 5 -> 10 to 2 -> 10
        {op: OpType.replace, path: '/array/6', value: 12}, // <- unchanged
      ]);
    });

    describe('with acceptedWinsOnEqualPath', () => {
      it('should transpose array index during a swap/move', () => {
        const options = {acceptedWinsOnEqualPath: true};

        // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
        const acceptedOps: Operation[] = [
          {op: OpType.move, path: '/array/3', from: '/array/2'}, // a swap
        ];
        // [0, 1, 3, 2, 4, 5, 6]; <- Array after accepted copies

        // Actions to double some specific values
        const proposedOps: Operation[] = [
          {op: OpType.replace, path: '/array/3', value: 6}, // 3 -> 6
        ];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
          {op: OpType.replace, path: '/array/2', value: 6},
        ]);
      });

      it('should transpose array indices with accepted moves within an array', () => {
        const options = {acceptedWinsOnEqualPath: true};

        // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
        const acceptedOps: Operation[] = [
          {op: OpType.move, path: '/array/3', from: '/array/5'}, // acts like an add and remove
        ];

        // [0, 1, 2, 5, 3, 4, 6]; <- Array after accepted copies

        // Actions to double some specific values
        const proposedOps: Operation[] = [
          {op: OpType.replace, path: '/array/1', value: 2}, // 1 -> 2
          {op: OpType.replace, path: '/array/3', value: 6}, // 3 -> 6
          {op: OpType.replace, path: '/array/4', value: 8}, // 4 -> 8
          {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
          {op: OpType.replace, path: '/array/6', value: 12}, // 6 -> 12
        ];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
          {op: OpType.replace, path: '/array/1', value: 2}, // <- unchanged
          {op: OpType.replace, path: '/array/4', value: 6},
          {op: OpType.replace, path: '/array/5', value: 8},
          {op: OpType.replace, path: '/array/3', value: 10}, // 5 -> 10 to 3-> 10
          {op: OpType.replace, path: '/array/6', value: 12}, // <- unchanged
        ]);
      });

      it('should transpose array indices with consecutive backward accepted moves within an array', () => {
        const options = {acceptedWinsOnEqualPath: true};

        // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
        const acceptedOps: Operation[] = [
          {op: OpType.move, path: '/array/4', from: '/array/5'},
          {op: OpType.move, path: '/array/3', from: '/array/4'},
          {op: OpType.move, path: '/array/2', from: '/array/3'},
        ];

        // [0, 1, 5, 2, 3, 4, 6]; <- Array after accepted copies

        // Actions to double some specific values
        const proposedOps: Operation[] = [
          {op: OpType.replace, path: '/array/1', value: 2}, // 1 -> 2
          {op: OpType.replace, path: '/array/2', value: 4}, // 3 -> 6
          {op: OpType.replace, path: '/array/3', value: 6}, // 3 -> 6
          {op: OpType.replace, path: '/array/4', value: 8}, // 4 -> 8
          {op: OpType.replace, path: '/array/5', value: 10}, // 5 -> 10
          {op: OpType.replace, path: '/array/6', value: 12}, // 6 -> 12
        ];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
          {op: OpType.replace, path: '/array/1', value: 2}, // <- unchanged
          {op: OpType.replace, path: '/array/3', value: 4}, // 3 -> 6
          {op: OpType.replace, path: '/array/4', value: 6},
          {op: OpType.replace, path: '/array/5', value: 8},
          {op: OpType.replace, path: '/array/2', value: 10}, // 5 -> 10 to 2 -> 10
          {op: OpType.replace, path: '/array/6', value: 12}, // <- unchanged
        ]);
      });

      it('should transpose array index and sub property with consecutive accepted moves within an array', () => {
        const options = {acceptedWinsOnEqualPath: true};

        // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
        const acceptedOps: Operation[] = [
          {op: OpType.move, path: '/array/4', from: '/array/5'},
          {op: OpType.move, path: '/array/3', from: '/array/4'},
          {op: OpType.move, path: '/array/2', from: '/array/3'},
        ];

        // [0, 1, 5, 2, 3, 4, 6]; <- Array after accepted copies

        // Actions to double some specific values
        const proposedOps: Operation[] = [
          {op: OpType.replace, path: '/array/4/title', value: 'wow'}, // sub property
        ];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
          {op: OpType.replace, path: '/array/5/title', value: 'wow'},
        ]);
      });

      it('should transpose array index with consecutive forward accepted moves within an array', () => {
        const options = {acceptedWinsOnEqualPath: true};

        // [0, 1, 2, 3, 4, 5, 6]; <- Starting array
        const acceptedOps: Operation[] = [
          {op: OpType.move, path: '/array/1', from: '/array/0'},
          {op: OpType.move, path: '/array/2', from: '/array/1'},
          {op: OpType.move, path: '/array/3', from: '/array/2'},
          {op: OpType.move, path: '/array/4', from: '/array/3'},
        ];

        // [1, 2, 3, 4, 0, 5, 6]; <- Array after accepted copies

        // Actions to double some specific values
        const proposedOps: Operation[] = [{op: OpType.replace, path: '/array/2/blah', value: 4}];

        expect(JSONPatchOT(acceptedOps, proposedOps, options)).toEqual([
          {op: OpType.replace, path: '/array/1/blah', value: 4},
        ]);
      });
    });
  });

  describe('against multiple', () => {
    it('should transpose array indices against accepted adds and removes', () => {
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

    it('should transpose array indices against accepted adds and removes in different order', () => {
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

    it('should transpose array indices against many different accepted changes', () => {
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

    it('should redirect or cancel move and copy operations given different conflicts', () => {
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

      expect(JSONPatchOT(acceptedOps, proposedOps)).toEqual([
        {op: OpType.copy, from: '/one/where', path: '/to/path'},
        {op: OpType.move, from: '/one/where', path: '/another/path'},
      ]);
    });
  });
});
