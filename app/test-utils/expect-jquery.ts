import $ from 'jquery';

// just import this module e.g. import '../test-utils/expect-jquery'

$.extend($.expr[':'], {
  visible: (el: HTMLElement) => {
    const el$ = $(el);
    return (
      el$.css('display') !== 'none' &&
      el$
        .parents()
        .toArray()
        .every(each => $(each).css('display') !== 'none')
    );
  },
  hidden: (el: HTMLElement) => $(el).is(':not(:visible)')
});

expect.extend({
  is(el: JQuery<HTMLElement>, selector: string) {
    return {
      message: () =>
        `expected ${el.get().map(each => each.outerHTML)} to be '${selector}'`,
      pass: el.is(selector)
    };
  }
});

declare global {
  namespace jest {
    interface Matchers<R> {
      is(selector: string): R;
    }
  }
}
