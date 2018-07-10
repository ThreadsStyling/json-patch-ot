import JSONPatchOT from '../index';

describe('JSONPatchOT', () => {
  it('should return a function', () => {
    expect(typeof JSONPatchOT({})).toBe('function');
  });

  it('should resolve where no accepted changes present', () => {

  });

  it('should throw where no new changes present', () => {

  });

  it('should resolve where no conflicts with new changes', () => {

  });

  it('should remove new change where path has been removed', () => {

  });

  describe('arrays', () => {
    it('should resolve array indeces with remove in accepted changes', () => {

    });
  
    it('should resolve array indeces with add in accepted changes', () => {
  
    });
  
    it('should resolve array indeces with move in accepted changes', () => {
  
    });
  });
});
