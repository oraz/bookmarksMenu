import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import '../test-utils/expect-jquery';

describe('jQueryExtensionForExpect', () => {
  beforeAll(() => {
    document.documentElement.innerHTML = readFileSync(
      resolve(__dirname, 'expect-jquery.spec.html'),
      'utf-8'
    );
  });

  const visibleElements = ['#visible_block', '#visible_block__first'];
  const notVisibleElements = [
    '#invisible_by_style',
    '#invisible_by_style__first',
    '#invisible_by_style__first__first',
    '#visible_block__invisible_by_style',
    '#visible_block__invisible_by_style__first'
  ];

  it.each(visibleElements)('element %p must be :visible', selector => {
    expect($(selector)).is(':visible');
  });

  it.each(notVisibleElements)('element %p must be :not(:visible)', selector => {
    expect($(selector)).is(':not(:visible)');
  });

  it.each(visibleElements)('element %p must be :not(:hidden)', selector => {
    expect($(selector)).is(':not(:hidden)');
  });

  it.each(notVisibleElements)('element %p must be :hidden', selector => {
    expect($(selector)).is(':hidden');
  });
});
