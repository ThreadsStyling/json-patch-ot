import JSONPatchOT, {Operation, OpType} from '../index';

describe('JSONPatchOT', function() {
  describe('given different input options', function() {
    const accepted: Operation[] = [{op: OpType.replace, path: '/some/where/a', value: 'a'}];
    const proposed: Operation[] = [{op: OpType.replace, path: '/some/where/b', value: 'b'}];

    it('2 operations arrays without options', function() {
      expect(JSONPatchOT(accepted, proposed)).toEqual(proposed);
    });

    it('2 arrays with options', function() {
      expect(JSONPatchOT(accepted, proposed, {proposedWinsOnEqualPath: true})).toEqual(proposed);
    });
  });

  /**
   * Against Replace
   */
  describe('against `replace` operation, ', function() {
    const againstReplace: Operation = {op: OpType.replace, path: '/some/where', value: 5};

    describe('another operation, with separated `path` (and `from` if applicable)', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/separated/path/a', value: 'a'},
        {op: OpType.add, path: '/separated/path/b', value: 'b'},
        {op: OpType.replace, path: '/separated/path/c', value: 'c'},
        {op: OpType.remove, path: '/separated/path/d'},
        {op: OpType.move, path: '/separated/path/e', from: '/separated/path/f'},
        {op: OpType.copy, path: '/separated/path/g', from: '/separated/path/h'},
      ];

      it('nothing should be changed', function() {
        expect(JSONPatchOT([againstReplace], sequenceJSON)).toEqual(sequenceJSON);
      });
    });

    describe('an `test`, `add`, `replace`, or `remove` operation with `path` that was descendant of replaced object', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/separated/path/a', value: 'a'},
        {op: OpType.test, path: '/some/where/a', value: 'a'},
        {op: OpType.test, path: '/some/where/deeper/a', value: 'a'},
        {op: OpType.add, path: '/some/where/b', value: 'b'},
        {op: OpType.add, path: '/some/where/deeper/b', value: 'b'},
        {op: OpType.replace, path: '/some/where/c', value: 'c'},
        {op: OpType.replace, path: '/some/where/deeper/c', value: 'c'},
        {op: OpType.remove, path: '/some/where/d'},
        {op: OpType.remove, path: '/some/where/deeper/d'},
        {op: OpType.move, path: '/separated/path/e', from: '/separated/path/f'},
        {op: OpType.copy, path: '/separated/path/g', from: '/separated/path/h'},
      ];

      it('operation object should be removed', function() {
        expect(JSONPatchOT([againstReplace], sequenceJSON)).toEqual([
          {op: OpType.test, path: '/separated/path/a', value: 'a'},
          {op: OpType.move, path: '/separated/path/e', from: '/separated/path/f'},
          {op: OpType.copy, path: '/separated/path/g', from: '/separated/path/h'},
        ]);
      });
    });

    describe('an `test`, `add`, `replace`, or `remove` operation with `path` that equal to replaced object', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.add, path: '/some/where', value: 'a'},
        {op: OpType.test, path: '/some/where', value: 'a'},
        {op: OpType.replace, path: '/some/where', value: 'b'},
        {op: OpType.remove, path: '/some/where'},
      ];

      it('nothing should be changed', function() {
        expect(JSONPatchOT([againstReplace], sequenceJSON)).toEqual([
          {op: OpType.add, path: '/some/where', value: 'a'},
          {op: OpType.test, path: '/some/where', value: 'a'},
          {op: OpType.replace, path: '/some/where', value: 'b'},
          {op: OpType.remove, path: '/some/where'},
        ]);
      });
    });

    describe('an `move`, or `copy` operation with `from` that was equal, or descendant of replaced object', function() {
      console.warn('may lead to trouble');
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/separated/path/a', value: 'a'},
        {op: OpType.copy, path: '/separated/path/g', from: '/some/where'},
        {op: OpType.copy, path: '/separated/path/g', from: '/some/where/deeper'},
        {op: OpType.move, path: '/separated/path/e', from: '/some/where'},
        {op: OpType.move, path: '/separated/path/e', from: '/some/where/deeper'},
      ];

      it('operation object should be removed', function() {
        expect(JSONPatchOT([againstReplace], sequenceJSON)).toEqual([
          {op: OpType.test, path: '/separated/path/a', value: 'a'},
        ]);
      });
    });

    describe('an `move`, or `copy` operation with `path` that was equal of replaced object', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/separated/path/a', value: 'a'},
        {op: OpType.copy, path: '/some/where', from: '/separated/path/b'},
        {op: OpType.move, path: '/some/where', from: '/separated/path/c'},
      ];

      it('nothing should be changed', function() {
        expect(JSONPatchOT([againstReplace], sequenceJSON)).toEqual([
          {op: OpType.test, path: '/separated/path/a', value: 'a'},
          {op: OpType.copy, path: '/some/where', from: '/separated/path/b'},
          {op: OpType.move, path: '/some/where', from: '/separated/path/c'},
        ]);
      });
    });

    describe('an `move`, or `copy` operation with `path` that was descendant of replaced object', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/separated/path/a', value: 'a'},
        {op: OpType.copy, path: '/some/where/deeper', from: '/separated/path/b'},
        {op: OpType.move, path: '/some/where/deeper', from: '/separated/path/c'},
      ];

      it('operation object should be removed', function() {
        expect(JSONPatchOT([againstReplace], sequenceJSON)).toEqual([
          {op: OpType.test, path: '/separated/path/a', value: 'a'},
        ]);
      });
    });
  });

  /**
   * Against Remove
   */
  describe('against `remove` operation, ', function() {
    const againstRemove: Operation = {op: OpType.remove, path: '/some/where'};

    describe('another operation, with separated `path` (and `from` if applicable)', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/some/path/a', value: 'a'},
        {op: OpType.add, path: '/some/path/b', value: 'b'},
        {op: OpType.replace, path: '/some/path/c', value: 'c'},
        {op: OpType.remove, path: '/separated/path/d'},
        {op: OpType.move, path: '/separated/path/e', from: '/separated/path/f'},
        {op: OpType.copy, path: '/separated/path/g', from: '/separated/path/h'},
      ];

      it('nothing should be changed', function() {
        expect(JSONPatchOT([againstRemove], sequenceJSON)).toEqual(sequenceJSON);
      });
    });

    describe('an `test`, `add`, `replace`, or `remove` operation with `path` that was descendant of removed object', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/separated/path/a', value: 'a'},
        {op: OpType.test, path: '/some/where/a', value: 'a'},
        {op: OpType.test, path: '/some/where/deeper/a', value: 'a'},
        {op: OpType.add, path: '/some/where/b', value: 'b'},
        {op: OpType.add, path: '/some/where/deeper/b', value: 'b'},
        {op: OpType.replace, path: '/some/where/c', value: 'c'},
        {op: OpType.replace, path: '/some/where/deeper/c', value: 'c'},
        {op: OpType.remove, path: '/some/where/d'},
        {op: OpType.remove, path: '/some/where/deeper/d'},
        {op: OpType.move, path: '/separated/path/e', from: '/separated/path/f'},
        {op: OpType.copy, path: '/separated/path/g', from: '/separated/path/h'},
      ];

      it('operation object should be removed', function() {
        expect(JSONPatchOT([againstRemove], sequenceJSON)).toEqual([
          {op: OpType.test, path: '/separated/path/a', value: 'a'},
          {op: OpType.move, path: '/separated/path/e', from: '/separated/path/f'},
          {op: OpType.copy, path: '/separated/path/g', from: '/separated/path/h'},
        ]);
      });
    });

    describe('a `test`, or `add` operation with `path` that equal to removed object', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.add, path: '/some/where', value: 'a'},
        {op: OpType.test, path: '/some/where', value: 'a'},
      ];

      it('nothing should be changed', function() {
        expect(JSONPatchOT([againstRemove], sequenceJSON)).toEqual([
          {op: OpType.add, path: '/some/where', value: 'a'},
          {op: OpType.test, path: '/some/where', value: 'a'},
        ]);
      });
    });

    describe('a `replace`, or `remove` operation with `path` that equal to removed object', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.add, path: '/smth/else', value: 'a'},
        {op: OpType.replace, path: '/some/where', value: 'b'},
        {op: OpType.remove, path: '/some/where'},
      ];
      it('operation object should be removed', function() {
        expect(JSONPatchOT([againstRemove], sequenceJSON)).toEqual([{op: OpType.add, path: '/smth/else', value: 'a'}]);
      });
    });

    describe('an `move`, or `copy` operation with `from` that was equal, or descendant of replaced object', function() {
      console.warn('may lead to trouble');
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/separated/path/a', value: 'a'},
        {op: OpType.copy, path: '/separated/path/g', from: '/some/where'},
        {op: OpType.copy, path: '/separated/path/g', from: '/some/where/deeper'},
        {op: OpType.move, path: '/separated/path/e', from: '/some/where'},
        {op: OpType.move, path: '/separated/path/e', from: '/some/where/deeper'},
      ];

      it('operation object should be removed', function() {
        expect(JSONPatchOT([againstRemove], sequenceJSON)).toEqual([
          {op: OpType.test, path: '/separated/path/a', value: 'a'},
        ]);
      });
    });

    describe('an `move`, or `copy` operation with `path` that was equal, or descendant of replaced object', function() {
      const sequenceJSON: Operation[] = [
        {op: OpType.test, path: '/separated/path/a', value: 'a'},
        {op: OpType.copy, path: '/some/where', from: '/separated/path/b'},
        {op: OpType.copy, path: '/some/where/deeper', from: '/separated/path/b'},
        {op: OpType.move, path: '/some/where', from: '/separated/path/c'},
        {op: OpType.move, path: '/some/where/deeper', from: '/separated/path/c'},
      ];

      it('operation object should be removed', function() {
        expect(JSONPatchOT([againstRemove], sequenceJSON)).toEqual([
          {op: OpType.test, path: '/separated/path/a', value: 'a'},
        ]);
      });
    });

    /**
     * Arrays
     */
    describe('of array item,', function() {
      const againstRemove: Operation = {op: OpType.remove, path: '/some/where/1'};

      describe('another operation, with `path` or `from` equal or descendant to item above removed one', function() {
        const sequenceJSON: Operation[] = [
          {op: OpType.test, path: '/some/where/0', value: 'a'},
          {op: OpType.test, path: '/some/where/2', value: {smth: 'a'}},
          {op: OpType.test, path: '/some/where/2/smth', value: 'a'},
          {op: OpType.add, path: '/some/where/0', value: 'b'},
          {op: OpType.add, path: '/some/where/2', value: {}},
          {op: OpType.add, path: '/some/where/2/smth', value: 'b'},
          {op: OpType.replace, path: '/some/where/0', value: 'c'},
          {op: OpType.replace, path: '/some/where/2/smth', value: 'c'},
          {op: OpType.replace, path: '/some/where/2', value: 'c'},
          {op: OpType.remove, path: '/some/where/0'},
          {op: OpType.remove, path: '/some/where/2/smth'},
          {op: OpType.remove, path: '/some/where/2/'},
          {op: OpType.move, path: '/some/where/0', from: '/other/path/a'},
          {op: OpType.move, path: '/some/where/2', from: '/other/path/b'},
          {op: OpType.move, path: '/some/where/2/smth', from: '/other/path/c'},
          {op: OpType.move, path: '/other/else/a', from: '/some/where/0'},
          {op: OpType.move, path: '/other/else/b', from: '/some/where/2/smth'},
          {op: OpType.move, path: '/other/else/c', from: '/some/where/2'},
          {op: OpType.copy, path: '/some/where/0', from: '/other/path/a'},
          {op: OpType.copy, path: '/some/where/2', from: '/other/path/b'},
          {op: OpType.copy, path: '/some/where/2/smth', from: '/other/path/c'},
          {op: OpType.copy, path: '/other/else/a', from: '/some/where/0'},
          {op: OpType.copy, path: '/other/else/b', from: '/some/where/2/smth'},
          {op: OpType.copy, path: '/other/else/c', from: '/some/where/2'},
        ];

        it('paths should get shifted down', function() {
          expect(JSONPatchOT([againstRemove], sequenceJSON)).toEqual([
            {op: OpType.test, path: '/some/where/0', value: 'a'},
            {op: OpType.test, path: '/some/where/1', value: {smth: 'a'}},
            {op: OpType.test, path: '/some/where/1/smth', value: 'a'},
            {op: OpType.add, path: '/some/where/0', value: 'b'},
            {op: OpType.add, path: '/some/where/1', value: {}},
            {op: OpType.add, path: '/some/where/1/smth', value: 'b'},
            {op: OpType.replace, path: '/some/where/0', value: 'c'},
            {op: OpType.replace, path: '/some/where/1/smth', value: 'c'},
            {op: OpType.replace, path: '/some/where/1', value: 'c'},
            {op: OpType.remove, path: '/some/where/0'},
            {op: OpType.remove, path: '/some/where/1/smth'},
            {op: OpType.remove, path: '/some/where/1/'},
            {op: OpType.move, path: '/some/where/0', from: '/other/path/a'},
            {op: OpType.move, path: '/some/where/1', from: '/other/path/b'},
            {op: OpType.move, path: '/some/where/1/smth', from: '/other/path/c'},
            {op: OpType.move, path: '/other/else/a', from: '/some/where/0'},
            {op: OpType.move, path: '/other/else/b', from: '/some/where/1/smth'},
            {op: OpType.move, path: '/other/else/c', from: '/some/where/1'},
            {op: OpType.copy, path: '/some/where/0', from: '/other/path/a'},
            {op: OpType.copy, path: '/some/where/1', from: '/other/path/b'},
            {op: OpType.copy, path: '/some/where/1/smth', from: '/other/path/c'},
            {op: OpType.copy, path: '/other/else/a', from: '/some/where/0'},
            {op: OpType.copy, path: '/other/else/b', from: '/some/where/1/smth'},
            {op: OpType.copy, path: '/other/else/c', from: '/some/where/1'},
          ]);
        });
      });
    });
  });
});
