import {isValidIndex, replacePathIndices} from '../utils';

describe('Utils', () => {
  describe('isIndexValid', () => {
    it('should return true if valid index passed', () => {
      expect(isValidIndex('0'));
      expect(isValidIndex('10'));
      expect(isValidIndex('45'));
    });

    it('should return false if invalid index passed', () => {
      expect(isValidIndex('')).not.toBe(true);
      expect(isValidIndex('04')).not.toBe(true);
      expect(isValidIndex('4.5')).not.toBe(true);
      expect(isValidIndex('/')).not.toBe(true);
      expect(isValidIndex('wef')).not.toBe(true);
    });
  });

  describe('replacePathIndices', () => {
    // Use for remove
    it('should adjust array indices in the path', () => {
      expect(replacePathIndices('/array/6', '/array/', '3')).toBe('/array/5');
      expect(replacePathIndices('/array/6/long/path', '/array/', '3')).toBe('/array/5/long/path');
      expect(replacePathIndices('/array/3/', '/array/', '2')).toBe('/array/2/');
    });
    it('should not adjust the path', () => {
      expect(replacePathIndices('/array/3', '/array/', '3')).toBe('/array/3');
      expect(replacePathIndices('/array/3', '/array/', '2')).toBe('/array/2');
      expect(replacePathIndices('/array/four', '/array/', '2')).toBe('/array/four');
      expect(replacePathIndices('/array/4', '/array/', 'four')).toBe('/array/4');
    });

    // Used for add
    it('should adjust array indices in the path with increment up option passed', () => {
      expect(replacePathIndices('/array/6', '/array/', '3', true)).toBe('/array/7');
      expect(replacePathIndices('/array/4/', '/array/', '3', true)).toBe('/array/5/');
      expect(replacePathIndices('/array/3/long/path', '/array/', '3', true)).toBe('/array/4/long/path');
      expect(replacePathIndices('/array/3', '/array/', '3', true)).toBe('/array/4');
    });
    it('should not adjust the path with increment up option passed', () => {
      expect(replacePathIndices('/array/2', '/array/', '3', true)).toBe('/array/2');
      expect(replacePathIndices('/array/four', '/array/', '3', true)).toBe('/array/four');
      expect(replacePathIndices('/array/four/', '/array/', '3', true)).toBe('/array/four/');
    });
  });
});
