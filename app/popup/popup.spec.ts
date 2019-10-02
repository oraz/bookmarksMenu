import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import {
  JQueryMatchers,
  jQueryExtensionForExpect
} from '../test-utils/expect-jquery';
import { simulateCustomeElements } from '../test-utils/simulate-custom-elements';
import { randomAlphanumeric } from '../test-utils/random-utils';
import { Chrome } from '../test-utils/chrome';
import { BookmarkTreeNode } from '../test-utils/apis/bookmarks-api';
import { Settings } from '../common/settings';

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
    window.close = () => {
      throw Error('Not implemented!');
    };
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

  describe('folder content', () => {
    it('only folder name must be visible', () => {
      const firstInFolder = bookmark();
      const secondInFolder = bookmark();
      const first = bookmark(50);

      const folder = givenFolder(100, firstInFolder, secondInFolder);
      givenBookmakrs([folder, first]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#100[type=folder]:visible');
      expect($('#100 > ul')).toHaveLength(0);
      expect(bookmarksMenu.children(':nth(1)')).is(
        '#50[type=bookmark]:visible'
      );
      expect(bookmarksMenu.children(':nth(2)')).is('.separator:not(:visible)');
    });

    it('show folder content', () => {
      const firstInFolder = bookmark();
      const secondInFolder = bookmark();
      const first = bookmark(50);

      const folder = givenFolder(100, firstInFolder, secondInFolder);
      givenBookmakrs([folder, first]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#100[type=folder]:visible');
      expect($('#100 > ul')).toHaveLength(0);

      mouseOver(folder);

      const folderContent = $('#100 > ul');
      expect(folderContent).toHaveLength(1);
      expect(folderContent).is(':visible');

      expect(folderContent.children()).toHaveLength(4);
      expect(folderContent.children(':nth(0)')).is('#1[type=bookmark]:visible');
      expect(folderContent.children(':nth(1)')).is('#2[type=bookmark]:visible');
      expect(folderContent.children(':nth(2)')).is('.separator:visible');
      expect(folderContent.children(':nth(3)')).is(
        '[type=openAllInTabs]:visible'
      );
    });

    it('show folder content with one bookmark', () => {
      const firstInFolder = bookmark();
      const first = bookmark(50);

      const folder = givenFolder(100, firstInFolder);
      givenBookmakrs([folder, first]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#100[type=folder]:visible');
      expect($('#100 > ul')).toHaveLength(0);

      mouseOver(folder);

      const folderContent = $('#100 > ul');
      expect(folderContent).toHaveLength(1);
      expect(folderContent).is(':visible');

      expect(folderContent.children()).toHaveLength(1);
      expect(folderContent.children()).is('#1[type=bookmark]:visible');
    });

    it('empty folder', () => {
      const first = bookmark(50);
      const folder = givenFolder(100);
      givenBookmakrs([folder, first]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children()).is('#100[type=folder]:visible');
      expect($('#100 > ul')).toHaveLength(0);

      mouseOver(folder);

      const folderContent = $('#100 > ul');
      expect(folderContent).toHaveLength(1);
      expect(folderContent).is(':visible');

      expect(folderContent.children()).toHaveLength(1);
      expect(folderContent.children().children()).is('.empty:visible');
    });

    it('move mouse to another bookmark', () => {
      const first = bookmark(50);
      const folder = givenFolder(100);
      givenBookmakrs([folder, first]);

      mouseOver(folder);
      mouseOver(first);

      expect($('#100 > ul')).is(':not(:visible)');
    });
  });

  describe('click on bookmark (left button)', () => {
    it('open bookmark', () => {
      const first = bookmark();
      givenBookmakrs([], [first, bookmark()]);
      chrome.tabs.update = jest.fn();
      window.close = jest.fn();

      clickOn(first);

      expect(chrome.tabs.update).toHaveBeenCalledWith({ url: first.url });
      expect(window.close).toHaveBeenCalled();
    });

    it('open bookmark: js', () => {
      const first = bookmark(1, 'alert', 'javascript:alert("Hello")');
      givenBookmakrs([], [first, bookmark()]);
      chrome.tabs.executeScript = jest.fn();
      window.close = jest.fn();

      clickOn(first);

      expect(chrome.tabs.executeScript).toHaveBeenCalledWith({
        code: 'alert("Hello")'
      });
      expect(window.close).toHaveBeenCalled();
    });

    it('open bookmark with ctrlKey', () => {
      const first = bookmark();
      const second = bookmark();
      givenBookmakrs([], [first, second]);
      chrome.tabs.create = jest.fn();
      window.close = jest.fn();

      clickOn(second, { ctrlKey: true });

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: second.url,
        active: false
      });
      expect(window.close).toHaveBeenCalled();
    });

    it('open bookmark with shiftKey', () => {
      const first = bookmark();
      const second = bookmark();
      givenBookmakrs([], [first, second]);
      chrome.windows.create = jest.fn();
      window.close = jest.fn();

      clickOn(second, { shiftKey: true });

      expect(chrome.windows.create).toHaveBeenCalledWith({
        url: second.url,
        incognito: undefined
      });
      expect(window.close).toHaveBeenCalled();
    });

    it('open all', () => {
      const first = bookmark();
      const second = bookmark();
      const third = bookmark();
      const folder = givenFolder(100, first, second, third);
      givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);
      window.close = jest.fn();
      chrome.tabs.update = jest.fn();
      chrome.tabs.create = jest.fn();

      mouseOver(folder);
      clickOpenAll(folder);

      expect(chrome.tabs.update).toBeCalledWith({ url: first.url });
      expect(chrome.tabs.create).toBeCalledTimes(2);
      expect(chrome.tabs.create).toHaveBeenNthCalledWith(1, {
        url: second.url,
        selected: false
      });
      expect(chrome.tabs.create).toHaveBeenNthCalledWith(2, {
        url: third.url,
        selected: false
      });
      expect(window.close).toBeCalled();
    });
  });

  describe('click on bookmark (middle button)', () => {
    it.each([
      [false, false, false],
      [false, true, true],
      [true, false, true],
      [true, true, true]
    ])(
      'settingSwitchToNewTab = %p, shiftKey: %p => expectedNewTabActive: %p',
      (settingSwitchToNewTab, shiftKey, expectedNewTabActive) => {
        localStorage.switchToNewTab = settingSwitchToNewTab;
        const first = bookmark();
        givenBookmakrs([bookmark(), first, bookmark()]);
        chrome.tabs.create = jest.fn();
        window.close = jest.fn();

        clickOn(first, { button: 1, shiftKey });

        expect(chrome.tabs.create).toBeCalledWith({
          url: first.url,
          active: expectedNewTabActive
        });
        expect(window.close).toBeCalled();
      }
    );

    it.each([
      ['click open all in tabs', clickOpenAll],
      ['click open all (click on folder)', clickOn]
    ])(
      '%s:%p',
      (
        testName,
        clickAction: (
          folder: BookmarkTreeNode,
          eventInit: MouseEventInit
        ) => void
      ) => {
        const first = bookmark();
        const second = bookmark();
        const third = bookmark();
        const folder = givenFolder(100, first, second, third);
        givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);
        window.close = jest.fn();
        chrome.tabs.create = jest.fn();

        mouseOver(folder);
        clickAction(folder, { button: 1 });

        expect(chrome.tabs.create).toBeCalledTimes(3);
        expect(chrome.tabs.create).toHaveBeenNthCalledWith(1, {
          url: first.url,
          selected: true
        });
        expect(chrome.tabs.create).toHaveBeenNthCalledWith(2, {
          url: second.url,
          selected: false
        });
        expect(chrome.tabs.create).toHaveBeenNthCalledWith(3, {
          url: third.url,
          selected: false
        });
        expect(window.close).toBeCalled();
      }
    );
  });

  function clickOn(bookmark: BookmarkTreeNode, eventInit: MouseEventInit = {}) {
    const evt = new MouseEvent('mouseup', {
      button: 0,
      cancelable: true,
      bubbles: true,
      ...eventInit
    });
    document.getElementById(bookmark.id).dispatchEvent(evt);
  }

  function clickOpenAll(
    folder: BookmarkTreeNode,
    eventInit: MouseEventInit = {}
  ) {
    const evt = new MouseEvent('mouseup', {
      button: 0,
      cancelable: true,
      bubbles: true,
      ...eventInit
    });
    document
      .getElementById(folder.id)
      .querySelector('ul > li[type=openAllInTabs]')
      .dispatchEvent(evt);
  }

  function mouseOver(item: BookmarkTreeNode, eventInit: MouseEventInit = {}) {
    const evt = new MouseEvent('mouseover', {
      cancelable: true,
      bubbles: true,
      ...eventInit
    });
    document.getElementById(item.id).dispatchEvent(evt);
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

  function givenFolder(
    id: number,
    ...children: BookmarkTreeNode[]
  ): BookmarkTreeNode {
    return {
      id: '' + id,
      title: randomAlphanumeric(),
      children
    };
  }

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
