import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import {
  JQueryMatchers,
  jQueryExtensionForExpect
} from '../test-utils/expect-jquery';
import { simulateCustomeElements } from '../test-utils/simulate-custom-elements';
import { randomAlphanumeric } from '../test-utils/random-utils';
import { BookmarkTreeNode, Chrome } from '../test-utils/chrome';

window.close = () => {};
const chrome = new Chrome();
window['chrome'] = chrome;

expect.extend(jQueryExtensionForExpect);
declare global {
  namespace jest {
    interface Matchers<R> extends JQueryMatchers<R> {}
  }
}

describe('popup.html', () => {
  const css = readFileSync(resolve(__dirname, 'popup.css'), 'utf-8');
  const html =
    `<style>${css}</style>` +
    readFileSync(resolve(__dirname, 'popup.html'), 'utf-8').replace(
      /(<!DOCTYPE.*$|<\/?html>)$/gm,
      '<!-- $1 -->'
    );

  beforeAll(() => {
    simulateCustomeElements();
    import('./popup');
  });

  let bookmarksMenu: JQuery<HTMLElement>;
  beforeEach(() => {
    document.documentElement.innerHTML = html;
    document.dispatchEvent(new Event('DOMContentLoaded'));
    bookmarksMenu = $('#bookmarksMenu');
    bookmark.nextId = 1;
  });

  afterEach(() => {
    $(document.documentElement).empty();
    chrome.reset();
  });

  it('#bookmarksMenu exists', () => {
    expect(bookmarksMenu).toHaveLength(1);
    expect(bookmarksMenu).is(':visible');
  });

  it('with bookmarks in toolbar', () => {
    givenBookmakrs([bookmark(), bookmark()]);

    expect(bookmarksMenu.children()).toHaveLength(3);
    expect(bookmarksMenu.children(':nth(0)')).is('#1[type=bookmark]:visible');
    expect(bookmarksMenu.children(':nth(1)')).is('#2[type=bookmark]:visible');
    expect(bookmarksMenu.children(':nth(2)')).is('.separator:not(:visible)');
  });

  it('with bookmarks in both parts', () => {
    givenBookmakrs([bookmark()], [bookmark()]);

    expect(bookmarksMenu.children()).toHaveLength(3);
    expect(bookmarksMenu.children(':nth(0)')).is('#1[type=bookmark]:visible');
    expect(bookmarksMenu.children(':nth(1)')).is('.separator:visible');
    expect(bookmarksMenu.children(':nth(2)')).is('#2[type=bookmark]:visible');
  });

  it('with bookmarks only in other part', () => {
    givenBookmakrs([], [bookmark(), bookmark()]);

    expect(bookmarksMenu.children()).toHaveLength(3);
    expect(bookmarksMenu.children(':nth(0)')).is('.separator:not(:visible)');
    expect(bookmarksMenu.children(':nth(1)')).is('#1[type=bookmark]:visible');
    expect(bookmarksMenu.children(':nth(2)')).is('#2[type=bookmark]:visible');
  });

  describe('click on bookmark', () => {
    it('open bookmark', () => {
      const first = bookmark();
      givenBookmakrs([], [first, bookmark()]);
      chrome.tabs.update = jest.fn();

      clickOn(first);

      expect(chrome.tabs.update).toHaveBeenCalledWith(null, {
        url: first.url
      });
    });
  });

  function clickOn(bookmark: BookmarkTreeNode, button = 0) {
    const evt = new MouseEvent('mouseup', {
      button,
      bubbles: true,
      cancelable: true
    });
    document.getElementById(bookmark.id).dispatchEvent(evt);
  }

  function bookmark(
    id = bookmark.nextId++,
    title = randomAlphanumeric(),
    url = `http://${randomAlphanumeric()}`
  ): BookmarkTreeNode {
    return {
      id: '' + id,
      title,
      url
    };
  }
  bookmark.nextId = 1;

  function givenBookmakrs(
    quick: BookmarkTreeNode[],
    other: BookmarkTreeNode[] = []
  ) {
    chrome.bookmarks.givenBookmarks([
      {
        id: 'root',
        title: 'root',
        children: [
          {
            id: 'quick',
            title: 'quick',
            children: quick
          },
          {
            id: 'other',
            title: 'other',
            children: other
          }
        ]
      }
    ]);
  }
});
