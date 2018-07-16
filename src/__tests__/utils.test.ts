import {isValidIndex, replacePathIfHigher} from '../utils';

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
  })
  
  describe('replacePathIfHigher', () => {
    it('should adjust array indeces in the path', () => {
      expect(replacePathIfHigher('/array/6', '/array/', '3')).toBe('/array/5');
      expect(replacePathIfHigher('/array/3', '/array/', '2')).toBe('/array/2');
    });
    it('should not adjust the path', () => {
      expect(replacePathIfHigher('/array/3', '/array/', '3')).toBe('/array/3');
      expect(replacePathIfHigher('/array/3', '/array/', '2')).toBe('/array/2');
      expect(replacePathIfHigher('/array/four', '/array/', '2')).toBe('/array/four');
      expect(replacePathIfHigher('/array/4', '/array/', 'four')).toBe('/array/4');
    });
  });
});
