import { E } from './common';

describe('common.js', () => {
  describe('E', () => {
    it('show', () => {
      const span = document.createElement('span');

      E.show(span);

      expect(span.style.display).toBe('block');
    });
    sss
    it('hide', () => {
      const span = document.createElement('span');

      E.hide(span);

      expect(span.style.display).toBe('none');
    });
  });
});
