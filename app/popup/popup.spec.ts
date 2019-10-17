import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import '../test-utils/expect-jquery';
import { simulateCustomeElements } from '../test-utils/simulate-custom-elements';
import { randomAlphanumeric } from '../test-utils/random-utils';
import { Chrome } from '../test-utils/chrome';
import { BookmarkTreeNode } from '../test-utils/apis/bookmarks-api';
import { Settings } from '../common/settings';

const chrome = new Chrome();
window['chrome'] = chrome;

describe('popup.html', () => {
  const css = readFileSync(resolve(__dirname, 'popup.css'), 'utf-8');
  const html = `<style>${css}</style>` + readFileSync(resolve(__dirname, 'popup.html'), 'utf-8').replace(/(<!DOCTYPE.*$|<\/?html>)$/gm, '<!-- $1 -->');

  beforeAll(() => {
    simulateCustomeElements();
    import('./popup');
  });

  let bookmarksMenu: JQuery<HTMLElement>;
  const nativeWindowClose = window.close;
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
    window.close = nativeWindowClose;
    localStorage.clear();
  });

  describe('root folder content', () => {
    it('#bookmarksMenu exists', () => {
      expect(bookmarksMenu).toHaveLength(1);
      expect(bookmarksMenu).is(':visible');
    });

    it('with bookmarks in toolbar', () => {
      givenBookmakrs([bookmark(), bookmark()]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#1.bookmark:visible');
      expect(bookmarksMenu.children(':nth(1)')).is('#2.bookmark:visible');
      expect(bookmarksMenu.children(':nth(2)')).is('.separator:hidden');
    });

    it('with bookmarks in both parts', () => {
      givenBookmakrs([bookmark()], [bookmark()]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#1.bookmark:visible');
      expect(bookmarksMenu.children(':nth(1)')).is('.separator:visible');
      expect(bookmarksMenu.children(':nth(2)')).is('#2.bookmark:visible');
    });

    it('with bookmarks only in other part', () => {
      givenBookmakrs([], [bookmark(), bookmark()]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('.separator:hidden');
      expect(bookmarksMenu.children(':nth(1)')).is('#1.bookmark:visible');
      expect(bookmarksMenu.children(':nth(2)')).is('#2.bookmark:visible');
    });

    it('with hidden bookmarks in toolbar', () => {
      const first = bookmark();
      hideBookmarks(first);

      givenBookmakrs([first, bookmark()]);

      expect(bookmarksMenu.children()).toHaveLength(2);
      expect(bookmarksMenu.children(':nth(0)')).is('#2.bookmark:visible');
      expect(bookmarksMenu.children(':nth(1)')).is('.separator:hidden');
    });

    it('with hidden bookmarks in both parts', () => {
      const first = bookmark();
      const second = bookmark();
      const third = bookmark();
      const fourth = bookmark();
      hideBookmarks(first, third);

      givenBookmakrs([first, second], [third, fourth]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#2.bookmark:visible');
      expect(bookmarksMenu.children(':nth(1)')).is('.separator:visible');
      expect(bookmarksMenu.children(':nth(2)')).is('#4.bookmark:visible');
    });

    it('with hidden bookmarks only in other part', () => {
      const first = bookmark();
      const second = bookmark();
      hideBookmarks(second);

      givenBookmakrs([], [first, second]);

      expect(bookmarksMenu.children()).toHaveLength(2);
      expect(bookmarksMenu.children(':nth(0)')).is('.separator:hidden');
      expect(bookmarksMenu.children(':nth(1)')).is('#1.bookmark:visible');
    });

    it('all bookmarks in toolbar are hidden', () => {
      const first = bookmark();
      const second = bookmark();
      const third = bookmark();
      const fourth = bookmark();
      hideBookmarks(first, second, third);

      givenBookmakrs([first, second], [third, fourth]);

      expect(bookmarksMenu.children()).toHaveLength(2);
      expect(bookmarksMenu.children(':nth(0)')).is('.separator:hidden');
      expect(bookmarksMenu.children(':nth(1)')).is('#4.bookmark:visible');
    });

    it('all bookmarks in other part are hidden', () => {
      const first = bookmark();
      const second = bookmark();
      const third = bookmark();
      const fourth = bookmark();
      hideBookmarks(third, fourth);

      givenBookmakrs([first, second], [third, fourth]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#1.bookmark:visible');
      expect(bookmarksMenu.children(':nth(1)')).is('#2.bookmark:visible');
      expect(bookmarksMenu.children(':nth(2)')).is('.separator:hidden');
    });
  });

  describe('folder content', () => {
    it('only folder name must be visible', () => {
      const firstInFolder = bookmark();
      const secondInFolder = bookmark();
      const first = bookmark(50);

      const folder = givenFolder(100, 'folder', firstInFolder, secondInFolder);
      givenBookmakrs([folder, first]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#100.folder:visible');
      expect($('#100 > ul')).toHaveLength(0);
      expect(bookmarksMenu.children(':nth(1)')).is('#50.bookmark:visible');
      expect(bookmarksMenu.children(':nth(2)')).is('.separator:hidden');
    });

    it('show folder content', () => {
      const firstInFolder = bookmark();
      const secondInFolder = bookmark();
      const first = bookmark(50);

      const folder = givenFolder(100, 'folder', firstInFolder, secondInFolder);
      givenBookmakrs([folder, first]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#100.folder:visible');
      expect($('#100 > ul')).toHaveLength(0);

      mouseOver(folder);

      const folderContent = $('#100 > ul');
      expect(folderContent).toHaveLength(1);
      expect(folderContent).is(':visible');

      expect(folderContent.children()).toHaveLength(4);
      expect(folderContent.children(':nth(0)')).is('#1.bookmark:visible');
      expect(folderContent.children(':nth(1)')).is('#2.bookmark:visible');
      expect(folderContent.children(':nth(2)')).is('.separator:visible');
      expect(folderContent.children(':nth(3)')).is('.openAllInTabs:visible');
    });

    it('show folder content with one bookmark', () => {
      const firstInFolder = bookmark();
      const first = bookmark(50);

      const folder = givenFolder(100, 'folder', firstInFolder);
      givenBookmakrs([folder, first]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children(':nth(0)')).is('#100.folder:visible');
      expect($('#100 > ul')).toHaveLength(0);

      mouseOver(folder);

      const folderContent = $('#100 > ul');
      expect(folderContent).toHaveLength(1);
      expect(folderContent).is(':visible');

      expect(folderContent.children()).toHaveLength(1);
      expect(folderContent.children()).is('#1.bookmark:visible');
    });

    it('empty folder', () => {
      const first = bookmark(50);
      const folder = givenFolder(100);
      givenBookmakrs([folder, first]);

      expect(bookmarksMenu.children()).toHaveLength(3);
      expect(bookmarksMenu.children()).is('#100.folder:visible');
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

      expect($('#100 > ul')).is(':hidden');
    });

    it('Bug: first folder has empty folder', () => {
      const emptyFolder = givenFolder(101);
      const folder = givenFolder(102, 'folder', emptyFolder, bookmark());
      const first = bookmark();
      const second = bookmark();
      givenBookmakrs([first, second], [folder, bookmark()]);

      mouseOver(first);
      mouseOver(second);
      mouseOver(folder);

      expect($('#102 > ul')).is(':visible');
      expect($('#101')).is(':visible');
      expect($('#101 > ul')).is(':not(:visible)');
    });
  });

  describe.each([[0, 1, 2], [1, 2, 0], [2, 0, 1]])('click with buttonsConfig = [%p, %p, %p]', (leftButton, middleButton, rightButton) => {
    beforeEach(() => {
      localStorage[leftButton] = 0;
      localStorage[middleButton] = 1;
      localStorage[rightButton] = 2;
    });

    describe('click on bookmark (left button)', () => {
      it('open bookmark', () => {
        const first = bookmark();
        givenBookmakrs([], [first, bookmark()]);
        chrome.tabs.update = jest.fn();
        window.close = jest.fn();

        clickOn(first, { button: leftButton });

        expect(chrome.tabs.update).toHaveBeenCalledWith({ url: first.url });
        expect(window.close).toHaveBeenCalled();
      });

      it('open bookmark: js', () => {
        const first = bookmark(1, 'alert', 'javascript:alert("Hello")');
        givenBookmakrs([], [first, bookmark()]);
        chrome.tabs.executeScript = jest.fn();
        window.close = jest.fn();

        clickOn(first, { button: leftButton });

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

        clickOn(second, { button: leftButton, ctrlKey: true });

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

        clickOn(second, { button: leftButton, shiftKey: true });

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
        const folder = givenFolder(100, 'folder', first, second, third);
        givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);
        window.close = jest.fn();
        chrome.tabs.update = jest.fn();
        chrome.tabs.create = jest.fn();

        mouseOver(folder);
        clickOpenAll(folder, { button: leftButton });

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
      it.each([[false, false, false], [false, true, true], [true, false, true], [true, true, true]])(
        'settingSwitchToNewTab = %p, shiftKey: %p => expectedNewTabActive: %p',
        (settingSwitchToNewTab, shiftKey, expectedNewTabActive) => {
          localStorage.switchToNewTab = settingSwitchToNewTab;
          const first = bookmark();
          givenBookmakrs([bookmark(), first, bookmark()]);
          chrome.tabs.create = jest.fn();
          window.close = jest.fn();

          clickOn(first, { button: middleButton, shiftKey });

          expect(chrome.tabs.create).toBeCalledWith({
            url: first.url,
            active: expectedNewTabActive
          });
          expect(window.close).toBeCalled();
        }
      );

      it.each([['click open all in tabs', clickOpenAll], ['click open all (click on folder)', clickOn]])(
        '%s:%p',
        (testName, clickAction: (folder: BookmarkTreeNode, eventInit: MouseEventInit) => void) => {
          const first = bookmark();
          const second = bookmark();
          const third = bookmark();
          const folder = givenFolder(100, 'folder', first, second, third);
          givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);
          window.close = jest.fn();
          chrome.tabs.create = jest.fn();

          mouseOver(folder);
          clickAction(folder, { button: middleButton });

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

    describe('click on bookmark (right button)', () => {
      it('context menu for bookmark must be shown', () => {
        const first = bookmark();
        const second = bookmark();
        const third = bookmark();
        givenBookmakrs([first, second], [third, bookmark()]);

        clickOn(second, { button: rightButton });

        expect($(`#${second.id}`)).is('.hover');
        expect($('#contextMenu')).is('[for=bookmark]:visible');
      });

      it('context menu for folder must be shown', () => {
        const folder = givenFolder(100, 'folder', bookmark(), bookmark());
        givenBookmakrs([bookmark(), bookmark()], [folder, bookmark()]);

        mouseOver(folder);
        clickOn(folder, { button: rightButton });

        expect($(`#${folder.id}`)).is('.hover');
        expect($('#contextMenu')).is('[for=folder]:visible');
      });
    });
  });

  describe('Context Menu', () => {
    describe('show', () => {
      it('show for bookmark', () => {
        const first = bookmark();
        givenBookmakrs([first, bookmark()], [bookmark(), bookmark()]);

        mouseOver(first);
        clickOn(first, { button: 2 });

        expect($('#transparentLayer')).is(':visible');
        expect($('#contextMenu')).is(':visible');
        const expectedItems = [
          '.enabled.forBookmark[data-action="openInNewTab"]',
          '.enabled.forBookmark[data-action="openInNewWindow"]',
          '.enabled.forBookmark[data-action="openInIncognitoWindow"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="reorder"]',
          '.enabled[data-action="remove"]',
          '.enabled.forChromeBookmarks[data-action="openBookmarkManager"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="useGoogleBookmarks"]'
        ];
        const visibleItems = $('#contextMenu > :visible');
        expect(visibleItems).toHaveLength(expectedItems.length);
        expectedItems.forEach((expectedItem, idx) => {
          const item = $(visibleItems.get(idx));
          expect(item).is(expectedItem);
        });
      });

      it('show for the only bookmark in folder', () => {
        const first = bookmark();
        const folder = givenFolder(100, 'folder', first);
        givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);

        mouseOver(folder);
        mouseOver(first);
        clickOn(first, { button: 2 });

        expect($('#transparentLayer')).is(':visible');
        expect($('#contextMenu')).is(':visible');
        const expectedItems = [
          '.enabled.forBookmark[data-action="openInNewTab"]',
          '.enabled.forBookmark[data-action="openInNewWindow"]',
          '.enabled.forBookmark[data-action="openInIncognitoWindow"]',
          '.separator',
          ':not(.enabled).forChromeBookmarks[data-action="reorder"]',
          '.enabled[data-action="remove"]',
          '.enabled.forChromeBookmarks[data-action="openBookmarkManager"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="useGoogleBookmarks"]'
        ];
        const visibleItems = $('#contextMenu > :visible');
        expect(visibleItems).toHaveLength(expectedItems.length);
        expectedItems.forEach((expectedItem, idx) => {
          const item = $(visibleItems.get(idx));
          expect(item).is(expectedItem);
        });
      });

      it.each([
        ['toolbar', bookmark(), true], //
        ['other', bookmark(), false]
      ])('show for the only bookmark in %s', (testName, bookmark: BookmarkTreeNode, inToolbar: boolean) => {
        givenBookmakrs(inToolbar ? [bookmark] : [], inToolbar ? [] : [bookmark]);

        mouseOver(bookmark);
        clickOn(bookmark, { button: 2 });

        expect($('#transparentLayer')).is(':visible');
        expect($('#contextMenu')).is(':visible');
        const expectedItems = [
          '.enabled.forBookmark[data-action="openInNewTab"]',
          '.enabled.forBookmark[data-action="openInNewWindow"]',
          '.enabled.forBookmark[data-action="openInIncognitoWindow"]',
          '.separator',
          // TODO next line must be ':not(.enabled).forChromeBookmarks[data-action="reorder"]',
          '.enabled.forChromeBookmarks[data-action="reorder"]',
          '.enabled[data-action="remove"]',
          '.enabled.forChromeBookmarks[data-action="openBookmarkManager"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="useGoogleBookmarks"]'
        ];
        const visibleItems = $('#contextMenu > :visible');
        expect(visibleItems).toHaveLength(expectedItems.length);
        expectedItems.forEach((expectedItem, idx) => {
          const item = $(visibleItems.get(idx));
          expect(item).is(expectedItem);
        });
      });

      it('show for not empty folder', () => {
        const folder = givenFolder(100, 'folder', bookmark(), bookmark());
        givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);

        mouseOver(folder);
        clickOn(folder, { button: 2 });

        expect($('#transparentLayer')).is(':visible');
        expect($('#contextMenu')).is(':visible');
        const expectedItems = [
          '.enabled.forFolder[data-action="openAllInTabs"]',
          '.enabled.forFolder[data-action="openAllInNewWindow"]',
          '.enabled.forFolder[data-action="openAllInIncognitoWindow"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="reorder"]',
          ':not(.enabled)[data-action="remove"]',
          '.enabled.forChromeBookmarks[data-action="openBookmarkManager"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="useGoogleBookmarks"]'
        ];
        const visibleItems = $('#contextMenu > :visible');
        expect(visibleItems).toHaveLength(expectedItems.length);
        expectedItems.forEach((expectedItem, idx) => {
          const item = $(visibleItems.get(idx));
          expect(item).is(expectedItem);
        });
      });

      it('show for the only folder in folder', () => {
        const subFolder = givenFolder(100, 'subfolder', bookmark());
        const folder = givenFolder(101, 'folder', subFolder);
        givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);

        mouseOver(folder);
        mouseOver(subFolder);
        clickOn(subFolder, { button: 2 });

        expect($('#transparentLayer')).is(':visible');
        expect($('#contextMenu')).is(':visible');
        const expectedItems = [
          '.enabled.forFolder[data-action="openAllInTabs"]',
          '.enabled.forFolder[data-action="openAllInNewWindow"]',
          '.enabled.forFolder[data-action="openAllInIncognitoWindow"]',
          '.separator',
          ':not(.enabled).forChromeBookmarks[data-action="reorder"]',
          ':not(.enabled)[data-action="remove"]',
          '.enabled.forChromeBookmarks[data-action="openBookmarkManager"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="useGoogleBookmarks"]'
        ];
        const visibleItems = $('#contextMenu > :visible');
        expect(visibleItems).toHaveLength(expectedItems.length);
        expectedItems.forEach((expectedItem, idx) => {
          const item = $(visibleItems.get(idx));
          expect(item).is(expectedItem);
        });
      });

      it('show for the only folder(empty) in folder', () => {
        const subFolder = givenFolder(100);
        const folder = givenFolder(101, 'folder', subFolder);
        givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);

        mouseOver(folder);
        mouseOver(subFolder);
        clickOn(subFolder, { button: 2 });

        expect($('#transparentLayer')).is(':visible');
        expect($('#contextMenu')).is(':visible');
        const expectedItems = [
          ':not(.enabled).forFolder[data-action="openAllInTabs"]',
          ':not(.enabled).forFolder[data-action="openAllInNewWindow"]',
          ':not(.enabled).forFolder[data-action="openAllInIncognitoWindow"]',
          '.separator',
          ':not(.enabled).forChromeBookmarks[data-action="reorder"]',
          '.enabled[data-action="remove"]',
          '.enabled.forChromeBookmarks[data-action="openBookmarkManager"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="useGoogleBookmarks"]'
        ];
        const visibleItems = $('#contextMenu > :visible');
        expect(visibleItems).toHaveLength(expectedItems.length);
        expectedItems.forEach((expectedItem, idx) => {
          const item = $(visibleItems.get(idx));
          expect(item).is(expectedItem);
        });
      });

      it.each([
        ['toolbar', givenFolder(100), true], //
        ['other', givenFolder(100), false]
      ])('show for the only folder in %s', (testName, folder: BookmarkTreeNode, inToolbar: boolean) => {
        givenBookmakrs(inToolbar ? [folder] : [], inToolbar ? [] : [folder]);

        mouseOver(folder);
        clickOn(folder, { button: 2 });

        expect($('#transparentLayer')).is(':visible');
        expect($('#contextMenu')).is(':visible');
        const expectedItems = [
          ':not(.enabled).forFolder[data-action="openAllInTabs"]',
          ':not(.enabled).forFolder[data-action="openAllInNewWindow"]',
          ':not(.enabled).forFolder[data-action="openAllInIncognitoWindow"]',
          '.separator',
          // TODO next line must be ':not(.enabled).forChromeBookmarks[data-action="reorder"]',
          '.enabled.forChromeBookmarks[data-action="reorder"]',
          '.enabled[data-action="remove"]',
          '.enabled.forChromeBookmarks[data-action="openBookmarkManager"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="useGoogleBookmarks"]'
        ];
        const visibleItems = $('#contextMenu > :visible');
        expect(visibleItems).toHaveLength(expectedItems.length);
        expectedItems.forEach((expectedItem, idx) => {
          const item = $(visibleItems.get(idx));
          expect(item).is(expectedItem);
        });
      });

      it('show for empty folder', () => {
        const folder = givenFolder(100);
        givenBookmakrs([folder, bookmark()], [bookmark(), bookmark()]);

        mouseOver(folder);
        clickOn(folder, { button: 2 });

        expect($('#transparentLayer')).is(':visible');
        expect($('#contextMenu')).is(':visible');
        const expectedItems = [
          ':not(.enabled).forFolder[data-action="openAllInTabs"]',
          ':not(.enabled).forFolder[data-action="openAllInNewWindow"]',
          ':not(.enabled).forFolder[data-action="openAllInIncognitoWindow"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="reorder"]',
          '.enabled[data-action="remove"]',
          '.enabled.forChromeBookmarks[data-action="openBookmarkManager"]',
          '.separator',
          '.enabled.forChromeBookmarks[data-action="useGoogleBookmarks"]'
        ];
        const visibleItems = $('#contextMenu > :visible');
        expect(visibleItems).toHaveLength(expectedItems.length);
        expectedItems.forEach((expectedItem, idx) => {
          const item = $(visibleItems.get(idx));
          expect(item).is(expectedItem);
        });
      });
    });

    describe('reorder', () => {
      it('sort bookmarks only', () => {
        const first = bookmark(1, 'abc');
        const second = bookmark(4, 'defg');
        const third = bookmark(3, 'hij');
        const fourth = bookmark(2, 'xyz');
        const folder = givenFolder(10, 'folder', third, first, fourth, second);
        givenBookmakrs([folder]);
        chrome.bookmarks.move = jest.fn();

        mouseOver(folder);
        mouseOverAndClickOn(third, { button: 2 });
        chooseContextMenuItem(ContextMenuItem.Reorder);

        const expectedIdOrder = [1, 4, 3, 2];
        expect(chrome.bookmarks.move).toBeCalledTimes(expectedIdOrder.length);
        expectedIdOrder.forEach((id, index) => {
          const nthCall = index + 1;
          expect(chrome.bookmarks.move).toHaveBeenNthCalledWith(nthCall, id.toString(), { index });
        });

        const folderContent = $('#10 > ul');
        expect(folderContent).toHaveLength(1);
        expect(folderContent).is(':visible');
        expect(folderContent.children()).toHaveLength(6);
        expect(folderContent.children(':nth(0)')).is('#1.bookmark:contains("abc"):visible');
        expect(folderContent.children(':nth(1)')).is('#4.bookmark:contains("defg"):visible');
        expect(folderContent.children(':nth(2)')).is('#3.bookmark:contains("hij"):visible');
        expect(folderContent.children(':nth(3)')).is('#2.bookmark:contains("xyz"):visible');
        expect(folderContent.children(':nth(4)')).is('.separator:visible');
        expect(folderContent.children(':nth(5)')).is('.openAllInTabs:visible');
      });

      it('sort bookmarks and folders', () => {
        const first = bookmark(1, 'abc');
        const second = bookmark(4, 'defg');
        const third = bookmark(3, 'hij');
        const fourth = bookmark(2, 'xyz');
        const firstFolder = givenFolder(101, 'first');
        const secondFolder = givenFolder(102, 'second');
        const thirdFolder = givenFolder(100, 'xyz');

        const folder = givenFolder(10, 'folder', third, first, firstFolder, thirdFolder, fourth, second, secondFolder);
        givenBookmakrs([folder]);
        chrome.bookmarks.move = jest.fn();

        mouseOver(folder);
        mouseOverAndClickOn(third, { button: 2 });
        chooseContextMenuItem(ContextMenuItem.Reorder);

        const expectedIdOrder = [101, 102, 100, 1, 4, 3, 2];
        expect(chrome.bookmarks.move).toBeCalledTimes(expectedIdOrder.length);
        expectedIdOrder.forEach((id, index) => {
          const nthCall = index + 1;
          expect(chrome.bookmarks.move).toHaveBeenNthCalledWith(nthCall, id.toString(), { index });
        });

        const folderContent = $('#10 > ul');
        expect(folderContent).toHaveLength(1);
        expect(folderContent).is(':visible');
        expect(folderContent.children()).toHaveLength(9);

        expect(folderContent.children(':nth(0)')).is('#101.folder:contains("first"):visible');
        expect(folderContent.children(':nth(1)')).is('#102.folder:contains("second"):visible');
        expect(folderContent.children(':nth(2)')).is('#100.folder:contains("xyz"):visible');
        expect(folderContent.children(':nth(3)')).is('#1.bookmark:contains("abc"):visible');
        expect(folderContent.children(':nth(4)')).is('#4.bookmark:contains("defg"):visible');
        expect(folderContent.children(':nth(5)')).is('#3.bookmark:contains("hij"):visible');
        expect(folderContent.children(':nth(6)')).is('#2.bookmark:contains("xyz"):visible');
        expect(folderContent.children(':nth(7)')).is('.separator:visible');
        expect(folderContent.children(':nth(8)')).is('.openAllInTabs:visible');
      });

      it('in root folder', () => {
        const firstFolder = givenFolder(100, 'xyz');
        const secondFolder = givenFolder(101, 'abc');
        const thirdFolder = givenFolder(102, 'efg');
        const first = bookmark(1, 'xyz');
        const second = bookmark(2, 'abc');
        const third = bookmark(3, 'efg');
        const firstFolderInOthers = givenFolder(110, 'stuv');
        const secondFolderInOthers = givenFolder(111, 'bcde');
        const thirdFolderInOthers = givenFolder(112, 'opq');
        const firstInOthers = bookmark(4, 'stuv');
        const secondInOthers = bookmark(5, 'bcde');
        const thirdInOthers = bookmark(6, 'opq');
        const fourthInOthers = bookmark(7, 'abc');
        givenBookmakrs(
          [firstFolder, first, second, secondFolder, thirdFolder, third],
          [firstInOthers, fourthInOthers, firstFolderInOthers, thirdFolderInOthers, secondInOthers, thirdInOthers, secondFolderInOthers]
        );
        chrome.bookmarks.move = jest.fn();

        mouseOverAndClickOn(first, { button: 2 });
        chooseContextMenuItem(ContextMenuItem.Reorder);

        const expectedIdOrder = [101, 102, 100, 2, 3, 1, 111, 112, 110, 7, 5, 6, 4];
        expect(chrome.bookmarks.move).toBeCalledTimes(expectedIdOrder.length);
        expectedIdOrder.forEach((id, index) => {
          const nthCall = index + 1;
          const expectedPosition = index >= 6 ? index - 6 : index;
          expect(chrome.bookmarks.move).toHaveBeenNthCalledWith(nthCall, id.toString(), { index: expectedPosition });
        });

        const folderContent = $('#bookmarksMenu');
        expect(folderContent).toHaveLength(1);
        expect(folderContent).is(':visible');
        expect(folderContent.children()).toHaveLength(14);
        expect(folderContent.children(':nth(0)')).is('#101.folder:contains("abc"):visible');
        expect(folderContent.children(':nth(1)')).is('#102.folder:contains("efg"):visible');
        expect(folderContent.children(':nth(2)')).is('#100.folder:contains("xyz"):visible');
        expect(folderContent.children(':nth(3)')).is('#2.bookmark:contains("abc"):visible');
        expect(folderContent.children(':nth(4)')).is('#3.bookmark:contains("efg"):visible');
        expect(folderContent.children(':nth(5)')).is('#1.bookmark:contains("xyz"):visible');
        expect(folderContent.children(':nth(6)')).is('.separator:visible');
        expect(folderContent.children(':nth(7)')).is('#111.folder:contains("bcde"):visible');
        expect(folderContent.children(':nth(8)')).is('#112.folder:contains("opq"):visible');
        expect(folderContent.children(':nth(9)')).is('#110.folder:contains("stuv"):visible');
        expect(folderContent.children(':nth(10)')).is('#7.bookmark:contains("abc"):visible');
        expect(folderContent.children(':nth(11)')).is('#5.bookmark:contains("bcde"):visible');
        expect(folderContent.children(':nth(12)')).is('#6.bookmark:contains("opq"):visible');
        expect(folderContent.children(':nth(13)')).is('#4.bookmark:contains("stuv"):visible');
      });

      it('in root folder with hidden bookmarks or folders', () => {
        const firstFolder = givenFolder(100, 'xyz');
        const secondFolder = givenFolder(101, 'abcd');
        const thirdFolder = givenFolder(102, 'efg');
        const first = bookmark(1, 'xyz12');
        const second = bookmark(2, 'abc');
        const third = bookmark(3, 'efg');
        const firstFolderInOthers = givenFolder(110, 'stuv');
        const secondFolderInOthers = givenFolder(111, 'bcde');
        const thirdFolderInOthers = givenFolder(112, 'opqrst');
        const firstInOthers = bookmark(4, 'stuv');
        const secondInOthers = bookmark(5, 'bcde');
        const thirdInOthers = bookmark(6, 'opq');
        const fourthInOthers = bookmark(7, 'abcdefg');
        [secondFolder, first, thirdFolderInOthers, fourthInOthers].forEach(each => {
          Settings.setBookmarkHidden(each.title, false, true);
        });
        givenBookmakrs(
          [firstFolder, first, second, secondFolder, thirdFolder, third],
          [firstInOthers, fourthInOthers, firstFolderInOthers, thirdFolderInOthers, secondInOthers, thirdInOthers, secondFolderInOthers]
        );
        chrome.bookmarks.move = jest.fn();

        mouseOverAndClickOn(secondInOthers, { button: 2 });
        chooseContextMenuItem(ContextMenuItem.Reorder);

        const folderContent = $('#bookmarksMenu');
        expect(folderContent).toHaveLength(1);
        expect(folderContent).is(':visible');
        expect(folderContent.children()).toHaveLength(10);
        expect(folderContent.children(':nth(0)')).is('#102.folder:contains("efg"):visible');
        expect(folderContent.children(':nth(1)')).is('#100.folder:contains("xyz"):visible');
        expect(folderContent.children(':nth(2)')).is('#2.bookmark:contains("abc"):visible');
        expect(folderContent.children(':nth(3)')).is('#3.bookmark:contains("efg"):visible');
        expect(folderContent.children(':nth(4)')).is('.separator:visible');
        expect(folderContent.children(':nth(5)')).is('#111.folder:contains("bcde"):visible');
        expect(folderContent.children(':nth(6)')).is('#110.folder:contains("stuv"):visible');
        expect(folderContent.children(':nth(7)')).is('#5.bookmark:contains("bcde"):visible');
        expect(folderContent.children(':nth(8)')).is('#6.bookmark:contains("opq"):visible');
        expect(folderContent.children(':nth(9)')).is('#4.bookmark:contains("stuv"):visible');
        const expectedIdOrder = [101, 102, 100, 2, 3, 1, 111, 112, 110, 7, 5, 6, 4];
        expect(chrome.bookmarks.move).toBeCalledTimes(expectedIdOrder.length);
        expectedIdOrder.forEach((id, index) => {
          const nthCall = index + 1;
          const expectedPosition = index >= 6 ? index - 6 : index;
          expect(chrome.bookmarks.move).toHaveBeenNthCalledWith(nthCall, id.toString(), { index: expectedPosition });
        });
      });

      it('in root folder when all items in toolbar are hidden', () => {
        const firstFolder = givenFolder(100, 'xyz');
        const secondFolder = givenFolder(101, 'abcd');
        const thirdFolder = givenFolder(102, 'efg');
        const firstFolderInOthers = givenFolder(110, 'stuv');
        const secondFolderInOthers = givenFolder(111, 'bcde');
        const thirdFolderInOthers = givenFolder(112, 'opqrst');
        [firstFolder, secondFolder, thirdFolder].forEach(each => {
          Settings.setBookmarkHidden(each.title, false, true);
        });
        givenBookmakrs([firstFolder, secondFolder, thirdFolder], [firstFolderInOthers, thirdFolderInOthers, secondFolderInOthers]);
        chrome.bookmarks.move = jest.fn();

        mouseOverAndClickOn(firstFolderInOthers, { button: 2 });
        chooseContextMenuItem(ContextMenuItem.Reorder);

        const folderContent = $('#bookmarksMenu');
        expect(folderContent).toHaveLength(1);
        expect(folderContent).is(':visible');
        expect(folderContent.children()).toHaveLength(4);
        expect(folderContent.children(':nth(0)')).is('.separator:hidden');
        expect(folderContent.children(':nth(1)')).is('#111.folder:contains("bcde"):visible');
        expect(folderContent.children(':nth(2)')).is('#112.folder:contains("opqrst"):visible');
        expect(folderContent.children(':nth(3)')).is('#110.folder:contains("stuv"):visible');
        const expectedIdOrder = [101, 102, 100, 111, 112, 110];
        expect(chrome.bookmarks.move).toBeCalledTimes(expectedIdOrder.length);
        expectedIdOrder.forEach((id, index) => {
          const nthCall = index + 1;
          const expectedPosition = index >= 3 ? index - 3 : index;
          expect(chrome.bookmarks.move).toHaveBeenNthCalledWith(nthCall, id.toString(), { index: expectedPosition });
        });
      });
    });
  });

  enum ContextMenuItem {
    Reorder
  }

  function chooseContextMenuItem(item: ContextMenuItem) {
    let dataAction;
    if (item === ContextMenuItem.Reorder) {
      dataAction = 'reorder';
    } else {
      throw new Error('Not supported ContextMenuItem: ' + item);
    }
    const el = $(`#contextMenu > .enabled.forChromeBookmarks[data-action="${dataAction}"]:visible`);
    mouseOverAndClickOn(el);
  }

  function mouseOverAndClickOn(bookmark: BookmarkTreeNode | JQuery<HTMLElement>, eventInit: MouseEventInit = {}) {
    mouseOver(bookmark);
    clickOn(bookmark, eventInit);
  }

  function clickOn(bookmark: BookmarkTreeNode | JQuery<HTMLElement>, eventInit: MouseEventInit = {}) {
    const evt = new MouseEvent('mouseup', {
      button: 0,
      cancelable: true,
      bubbles: true,
      ...eventInit
    });
    if (isJQueryObject(bookmark)) {
      bookmark.get(0).dispatchEvent(evt);
    } else {
      document.getElementById(bookmark.id).dispatchEvent(evt);
    }
  }

  function isJQueryObject(obj: any): obj is JQuery<HTMLElement> {
    return !!obj.jquery;
  }

  function clickOpenAll(folder: BookmarkTreeNode, eventInit: MouseEventInit = {}) {
    const evt = new MouseEvent('mouseup', {
      button: 0,
      cancelable: true,
      bubbles: true,
      ...eventInit
    });
    document
      .getElementById(folder.id)
      .querySelector('ul > li.openAllInTabs')
      .dispatchEvent(evt);
  }

  function mouseOver(item: BookmarkTreeNode | JQuery<HTMLElement>, eventInit: MouseEventInit = {}) {
    const evt = new MouseEvent('mouseover', {
      cancelable: true,
      bubbles: true,
      ...eventInit
    });
    if (isJQueryObject(item)) {
      item.get(0).dispatchEvent(evt);
    } else {
      document.getElementById(item.id).dispatchEvent(evt);
    }
  }

  function bookmark(id = bookmark.nextId++, title = randomAlphanumeric(), url = `http://${randomAlphanumeric()}`): BookmarkTreeNode {
    return {
      id: '' + id,
      title,
      url
    };
  }
  bookmark.nextId = 1;

  function givenFolder(folderId: number, title: string = randomAlphanumeric(), ...children: BookmarkTreeNode[]): BookmarkTreeNode {
    const id = '' + folderId;
    children.forEach(each => (each.parentId = id));
    return {
      id,
      title,
      children
    };
  }

  function givenBookmakrs(quick: BookmarkTreeNode[], other: BookmarkTreeNode[] = []) {
    quick.forEach(each => (each.parentId = 'quick'));
    other.forEach(each => (each.parentId = 'other'));
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

  function hideBookmarks(...bookmarks: BookmarkTreeNode[]) {
    bookmarks.forEach(each => Settings.setBookmarkHidden(each.title, false, true));
  }
});
