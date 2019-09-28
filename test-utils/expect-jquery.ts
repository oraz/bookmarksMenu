expect.extend({
  is(el: JQuery<HTMLElement>, selector: string) {
    return {
      message: () =>
        `expected ${el.get().map(each => each.outerHTML)} to be '${selector}'`,
      pass: el.is(selector)
    };
  },

  toBeVisible(el: JQuery<HTMLElement>) {
    return {
      message: () =>
        `expected ${el.get().map(each => each.outerHTML)} has not display none`,
      pass: el.css('display') !== 'none'
    };
  }
});
