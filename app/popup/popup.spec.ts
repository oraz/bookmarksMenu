import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import '../test-utils/expect-jquery';
import { randomAlphanumeric } from '../test-utils/random-utils';
import { Settings } from '../common/settings';
import { givenChromeBookmarks, initChrome, resetChrome } from '../test-utils/chrome-mock';

describe('popup.html', () => {
    /* eslint-disable no-unused-vars */
    enum ContextMenuItem {
        Reorder = 'reorder',
        OpenInNewTab = 'openInNewTab',
        OpenInNewWindow = 'openInNewWindow',
        OpenInIncognitoWindow = 'openInIncognitoWindow',
        OpenAllInTabs = 'openAllInTabs',
        OpenAllInNewWindow = 'openAllInNewWindow',
        OpenAllInIncognitoWindow = 'openAllInIncognitoWindow',
        Remove = 'remove'
    }
    /* eslint-enable */

    const css = readFileSync(resolve(__dirname, 'popup.css'), 'utf-8');
    const html = `<style>${css}</style>` + readFileSync(resolve(__dirname, 'popup.html'), 'utf-8').replace(/(<!DOCTYPE.*$|<\/?html>)$/gm, '<!-- $1 -->');

    beforeAll(() => {
        initChrome();
        import('./popup');
    });

    let bookmarksMenu: JQuery<HTMLElement>;
    const nativeWindowClose = window.close;
    beforeEach(() => {
        resetChrome();
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
        window.close = nativeWindowClose;
        localStorage.clear();
    });

    describe('root folder content', () => {
        it('#bookmarksMenu exists', () => {
            expect(bookmarksMenu).toHaveLength(1);
            expect(bookmarksMenu).is(':visible');
        });

        it('with bookmarks in toolbar', () => {
            givenBookmarks([bookmark(), bookmark()]);

            expect(bookmarksMenu.children()).toHaveLength(3);
            expect(bookmarksMenu.children(':nth(0)')).is('#1.bookmark:visible');
            expect(bookmarksMenu.children(':nth(1)')).is('#2.bookmark:visible');
            expect(bookmarksMenu.children(':nth(2)')).is('.separator:hidden');
        });

        it('with bookmarks in both parts', () => {
            givenBookmarks([bookmark()], [bookmark()]);

            expect(bookmarksMenu.children()).toHaveLength(3);
            expect(bookmarksMenu.children(':nth(0)')).is('#1.bookmark:visible');
            expect(bookmarksMenu.children(':nth(1)')).is('.separator:visible');
            expect(bookmarksMenu.children(':nth(2)')).is('#2.bookmark:visible');
        });

        it('with bookmarks only in other part', () => {
            givenBookmarks([], [bookmark(), bookmark()]);

            expect(bookmarksMenu.children()).toHaveLength(3);
            expect(bookmarksMenu.children(':nth(0)')).is('.separator:hidden');
            expect(bookmarksMenu.children(':nth(1)')).is('#1.bookmark:visible');
            expect(bookmarksMenu.children(':nth(2)')).is('#2.bookmark:visible');
        });

        it('with hidden bookmarks in toolbar', () => {
            const first = bookmark();
            hideBookmarks(first);

            givenBookmarks([first, bookmark()]);

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

            givenBookmarks([first, second], [third, fourth]);

            expect(bookmarksMenu.children()).toHaveLength(3);
            expect(bookmarksMenu.children(':nth(0)')).is('#2.bookmark:visible');
            expect(bookmarksMenu.children(':nth(1)')).is('.separator:visible');
            expect(bookmarksMenu.children(':nth(2)')).is('#4.bookmark:visible');
        });

        it('with hidden bookmarks only in other part', () => {
            const first = bookmark();
            const second = bookmark();
            hideBookmarks(second);

            givenBookmarks([], [first, second]);

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

            givenBookmarks([first, second], [third, fourth]);

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

            givenBookmarks([first, second], [third, fourth]);

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
            givenBookmarks([folder, first]);

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
            givenBookmarks([folder, first]);

            expect(bookmarksMenu.children()).toHaveLength(3);
            expect(bookmarksMenu.children(':nth(0)')).is('#100.folder:visible');
            expect($('#100 > ul')).toHaveLength(0);

            mouseOver(folder);

            const folderContent = $('#100 > ul');
            expect(folderContent).toHaveLength(1);
            expect(folderContent).is(':visible');

            expect(folderContent.children()).toHaveLength(5);
            expect(folderContent.children(':nth(0)')).is('#1.bookmark:visible');
            expect(folderContent.children(':nth(1)')).is('#2.bookmark:visible');
            expect(folderContent.children(':nth(2)')).is('.separator:visible');
            expect(folderContent.children(':nth(3)')).is('.openAllInTabs:visible');
            expect(folderContent.children(':nth(4)')).is('.empty:hidden');
        });

        it('show folder content with one bookmark', () => {
            const firstInFolder = bookmark();
            const first = bookmark(50);

            const folder = givenFolder(100, 'folder', firstInFolder);
            givenBookmarks([folder, first]);

            expect(bookmarksMenu.children()).toHaveLength(3);
            expect(bookmarksMenu.children(':nth(0)')).is('#100.folder:visible');
            expect($('#100 > ul')).toHaveLength(0);

            mouseOver(folder);

            const folderContent = $('#100 > ul');
            expect(folderContent).toHaveLength(1);
            expect(folderContent).is(':visible');

            expect(folderContent.children(':visible')).toHaveLength(1);
            expect(folderContent.children(':visible')).is('#1.bookmark:visible');
        });

        it('empty folder', () => {
            const first = bookmark(50);
            const folder = givenFolder(100);
            givenBookmarks([folder, first]);

            expect(bookmarksMenu.children()).toHaveLength(3);
            expect(bookmarksMenu.children()).is('#100.folder:visible');
            expect($('#100 > ul')).toHaveLength(0);

            mouseOver(folder);

            const folderContent = $('#100 > ul');
            expect(folderContent).toHaveLength(1);
            expect(folderContent).is(':visible');

            expect(folderContent.children(':visible')).toHaveLength(1);
            expect(folderContent.children(':visible')).is('.empty');
        });

        it('move mouse to another bookmark', () => {
            const first = bookmark(50);
            const folder = givenFolder(100);
            givenBookmarks([folder, first]);

            mouseOver(folder);
            mouseOver(first);

            expect($('#100 > ul')).is(':hidden');
        });

        it('Bug: first folder has empty folder', () => {
            const emptyFolder = givenFolder(101);
            const folder = givenFolder(102, 'folder', emptyFolder, bookmark());
            const first = bookmark();
            const second = bookmark();
            givenBookmarks([first, second], [folder, bookmark()]);

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
                givenBookmarks([], [first, bookmark()]);
                window.close = jest.fn();

                clickOn(first, { button: leftButton });

                expect(chrome.tabs.update).toHaveBeenCalledWith({ url: first.url });
                expect(window.close).toHaveBeenCalled();
            });

            it('open bookmark: js', () => {
                const first = bookmark(1, 'alert', 'javascript:alert("Hello")');
                givenBookmarks([], [first, bookmark()]);
                window.alert = jest.fn();
                window.close = jest.fn();

                clickOn(first, { button: leftButton });

                expect(window.alert).toHaveBeenCalledWith('Bookmarklets are not supported since v2023.03.05 because of Manifest V3. For more details see https://developer.chrome.com/docs/extensions/mv3/mv3-migration/#executing-arbitrary-strings');
                expect(window.close).toHaveBeenCalledTimes(0);
            });

            it('open bookmark with ctrlKey', () => {
                const first = bookmark();
                const second = bookmark();
                givenBookmarks([], [first, second]);
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
                givenBookmarks([], [first, second]);
                window.close = jest.fn();

                clickOn(second, { button: leftButton, shiftKey: true });

                expect(chrome.windows.create).toHaveBeenCalledWith({
                    url: second.url,
                    incognito: false
                });
                expect(window.close).toHaveBeenCalled();
            });

            it('open all', () => {
                const first = bookmark();
                const second = bookmark();
                const third = bookmark();
                const folder = givenFolder(100, 'folder', first, second, third);
                givenBookmarks([folder, bookmark()], [bookmark(), bookmark()]);
                window.close = jest.fn();

                mouseOver(folder);
                clickOpenAll(folder, { button: leftButton });

                expect(chrome.tabs.update).toBeCalledWith({ url: first.url });
                expect(chrome.tabs.create).toBeCalledTimes(2);
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(1, { url: second.url, active: false });
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(2, { url: third.url, active: false });
                expect(window.close).toBeCalled();
            });
        });

        describe('click on bookmark (middle button)', () => {
            it.each([
                [false, false, false],
                [false, true, true],
                [true, false, true],
                [true, true, true]
            ])('settingSwitchToNewTab = %p, shiftKey: %p => expectedNewTabActive: %p', (settingSwitchToNewTab, shiftKey, expectedNewTabActive) => {
                localStorage.switchToNewTab = settingSwitchToNewTab;
                const first = bookmark();
                givenBookmarks([bookmark(), first, bookmark()]);
                window.close = jest.fn();

                clickOn(first, { button: middleButton, shiftKey });

                expect(chrome.tabs.create).toBeCalledWith({
                    url: first.url,
                    active: expectedNewTabActive
                });
                expect(window.close).toBeCalled();
            });

            it.each([
                ['click open all in tabs', clickOpenAll],
                ['click open all (click on folder)', clickOn]
            ])('%s:%p', (_testName, clickAction: (folder: chrome.bookmarks.BookmarkTreeNode, eventInit: MouseEventInit) => void) => { // eslint-disable-line no-unused-vars
                const first = bookmark();
                const second = bookmark();
                const third = bookmark();
                const folder = givenFolder(100, 'folder', first, second, third);
                givenBookmarks([folder, bookmark()], [bookmark(), bookmark()]);
                window.close = jest.fn();

                mouseOver(folder);
                clickAction(folder, { button: middleButton });

                expect(chrome.tabs.create).toBeCalledTimes(3);
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(1, { url: first.url, active: true });
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(2, { url: second.url, active: false });
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(3, { url: third.url, active: false });
                expect(window.close).toBeCalled();
            }
            );
        });

        describe('click on bookmark (right button)', () => {
            it('context menu for bookmark must be shown', () => {
                const first = bookmark();
                const second = bookmark();
                const third = bookmark();
                givenBookmarks([first, second], [third, bookmark()]);

                clickOn(second, { button: rightButton });

                expect($(`#${second.id}`)).is('.hover');
                expect($('#contextMenu')).is('[for=bookmark]:visible');
            });

            it('context menu for folder must be shown', () => {
                const folder = givenFolder(100, 'folder', bookmark(), bookmark());
                givenBookmarks([bookmark(), bookmark()], [folder, bookmark()]);

                mouseOver(folder);
                clickOn(folder, { button: rightButton });

                expect($(`#${folder.id}`)).is('.hover');
                expect($('#contextMenu')).is('[for=folder]:visible');
            });
        });
    });

    describe('Context Menu', () => {
        it('all children must be .separator or .contextMenuItem', () => {
            const contextMenu = $('#contextMenu');
            contextMenu.children().each((_, el) => {
                const each = $(el);
                expect(each.is('.separator:not(.contextMenuItem)') || each.is('.contextMenuItem:not(.separator)')).toBeTruthy();
            });
        });

        describe('show', () => {
            it('show for bookmark', () => {
                const first = bookmark();
                givenBookmarks([first, bookmark()], [bookmark(), bookmark()]);

                mouseOver(first);
                clickOn(first, { button: 2 });

                expect($('#transparentLayer')).is(':visible');
                expect($('#contextMenu')).is(':visible');
                const expectedItems = [
                    '.enabled.forBookmark[data-action="openInNewTab"]',
                    '.enabled.forBookmark[data-action="openInNewWindow"]',
                    '.enabled.forBookmark[data-action="openInIncognitoWindow"]',
                    '.separator',
                    '.enabled[data-action="reorder"]',
                    '.enabled[data-action="remove"]',
                    '.enabled[data-action="openBookmarkManager"]'
                ];
                const visibleItems = $('#contextMenu > :visible');
                expect(visibleItems).toHaveLength(expectedItems.length);
                expectedItems.forEach((expectedItem, idx) => {
                    const item = $(visibleItems[idx]);
                    expect(item).is(expectedItem);
                });
            });

            it('show for the only bookmark in folder', () => {
                const first = bookmark();
                const folder = givenFolder(100, 'folder', first);
                givenBookmarks([folder, bookmark()], [bookmark(), bookmark()]);

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
                    ':not(.enabled)[data-action="reorder"]',
                    '.enabled[data-action="remove"]',
                    '.enabled[data-action="openBookmarkManager"]'
                ];
                const visibleItems = $('#contextMenu > :visible');
                expect(visibleItems).toHaveLength(expectedItems.length);
                expectedItems.forEach((expectedItem, idx) => {
                    const item = $(visibleItems[idx]);
                    expect(item).is(expectedItem);
                });
            });

            it.each([
                ['toolbar', bookmark(), true], //
                ['other', bookmark(), false]
            ])('show for the only bookmark in %s', (testName, bookmark: chrome.bookmarks.BookmarkTreeNode, inToolbar: boolean) => {
                givenBookmarks(inToolbar ? [bookmark] : [], inToolbar ? [] : [bookmark]);

                mouseOver(bookmark);
                clickOn(bookmark, { button: 2 });

                expect($('#transparentLayer')).is(':visible');
                expect($('#contextMenu')).is(':visible');
                const expectedItems = [
                    '.enabled.forBookmark[data-action="openInNewTab"]',
                    '.enabled.forBookmark[data-action="openInNewWindow"]',
                    '.enabled.forBookmark[data-action="openInIncognitoWindow"]',
                    '.separator',
                    ':not(.enabled)[data-action="reorder"]',
                    '.enabled[data-action="remove"]',
                    '.enabled[data-action="openBookmarkManager"]'
                ];
                const visibleItems = $('#contextMenu > :visible');
                expect(visibleItems).toHaveLength(expectedItems.length);
                expectedItems.forEach((expectedItem, idx) => {
                    const item = $(visibleItems[idx]);
                    expect(item).is(expectedItem);
                });
            });

            it('show for not empty folder', () => {
                const folder = givenFolder(100, 'folder', bookmark(), bookmark());
                givenBookmarks([folder, bookmark()], [bookmark(), bookmark()]);

                mouseOver(folder);
                clickOn(folder, { button: 2 });

                expect($('#transparentLayer')).is(':visible');
                expect($('#contextMenu')).is(':visible');
                const expectedItems = [
                    '.enabled.forFolder[data-action="openAllInTabs"]',
                    '.enabled.forFolder[data-action="openAllInNewWindow"]',
                    '.enabled.forFolder[data-action="openAllInIncognitoWindow"]',
                    '.separator',
                    '.enabled[data-action="reorder"]',
                    ':not(.enabled)[data-action="remove"]',
                    '.enabled[data-action="openBookmarkManager"]'
                ];
                const visibleItems = $('#contextMenu > :visible');
                expect(visibleItems).toHaveLength(expectedItems.length);
                expectedItems.forEach((expectedItem, idx) => {
                    const item = $(visibleItems[idx]);
                    expect(item).is(expectedItem);
                });
            });

            it('show for the only folder in folder', () => {
                const subFolder = givenFolder(100, 'subfolder', bookmark());
                const folder = givenFolder(101, 'folder', subFolder);
                givenBookmarks([folder, bookmark()], [bookmark(), bookmark()]);

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
                    ':not(.enabled)[data-action="reorder"]',
                    ':not(.enabled)[data-action="remove"]',
                    '.enabled[data-action="openBookmarkManager"]'
                ];
                const visibleItems = $('#contextMenu > :visible');
                expect(visibleItems).toHaveLength(expectedItems.length);
                expectedItems.forEach((expectedItem, idx) => {
                    const item = $(visibleItems[idx]);
                    expect(item).is(expectedItem);
                });
            });

            it('show for the only folder(empty) in folder', () => {
                const subFolder = givenFolder(100);
                const folder = givenFolder(101, 'folder', subFolder);
                givenBookmarks([folder, bookmark()], [bookmark(), bookmark()]);

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
                    ':not(.enabled)[data-action="reorder"]',
                    '.enabled[data-action="remove"]',
                    '.enabled[data-action="openBookmarkManager"]'
                ];
                const visibleItems = $('#contextMenu > :visible');
                expect(visibleItems).toHaveLength(expectedItems.length);
                expectedItems.forEach((expectedItem, idx) => {
                    const item = $(visibleItems[idx]);
                    expect(item).is(expectedItem);
                });
            });

            it.each([
                ['toolbar', givenFolder(100), true], //
                ['other', givenFolder(100), false]
            ])('show for the only folder in %s', (testName, folder: chrome.bookmarks.BookmarkTreeNode, inToolbar: boolean) => {
                givenBookmarks(inToolbar ? [folder] : [], inToolbar ? [] : [folder]);

                mouseOver(folder);
                clickOn(folder, { button: 2 });

                expect($('#transparentLayer')).is(':visible');
                expect($('#contextMenu')).is(':visible');
                const expectedItems = [
                    ':not(.enabled).forFolder[data-action="openAllInTabs"]',
                    ':not(.enabled).forFolder[data-action="openAllInNewWindow"]',
                    ':not(.enabled).forFolder[data-action="openAllInIncognitoWindow"]',
                    '.separator',
                    ':not(.enabled)[data-action="reorder"]',
                    '.enabled[data-action="remove"]',
                    '.enabled[data-action="openBookmarkManager"]'
                ];
                const visibleItems = $('#contextMenu > :visible');
                expect(visibleItems).toHaveLength(expectedItems.length);
                expectedItems.forEach((expectedItem, idx) => {
                    const item = $(visibleItems[idx]);
                    expect(item).is(expectedItem);
                });
            });

            it('show for empty folder', () => {
                const folder = givenFolder(100);
                givenBookmarks([folder, bookmark()], [bookmark(), bookmark()]);

                mouseOver(folder);
                clickOn(folder, { button: 2 });

                expect($('#transparentLayer')).is(':visible');
                expect($('#contextMenu')).is(':visible');
                const expectedItems = [
                    ':not(.enabled).forFolder[data-action="openAllInTabs"]',
                    ':not(.enabled).forFolder[data-action="openAllInNewWindow"]',
                    ':not(.enabled).forFolder[data-action="openAllInIncognitoWindow"]',
                    '.separator',
                    '.enabled[data-action="reorder"]',
                    '.enabled[data-action="remove"]',
                    '.enabled[data-action="openBookmarkManager"]'
                ];
                const visibleItems = $('#contextMenu > :visible');
                expect(visibleItems).toHaveLength(expectedItems.length);
                expectedItems.forEach((expectedItem, idx) => {
                    const item = $(visibleItems[idx]);
                    expect(item).is(expectedItem);
                });
            });
        });

        describe('reorder', () => {
            it('sort bookmarks only', () => {
                const first = bookmark(1, 'abc');
                const second = bookmark(4, 'de');
                const third = bookmark(3, 'hij');
                const fourth = bookmark(2, 'xyz');
                const folder = givenFolder(10, 'folder', third, first, fourth, second);
                givenBookmarks([folder]);
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
                expect(folderContent.children()).toHaveLength(7);
                expect(folderContent.children(':nth(0)')).is('#1.bookmark:contains("abc"):visible');
                expect(folderContent.children(':nth(1)')).is('#4.bookmark:contains("de"):visible');
                expect(folderContent.children(':nth(2)')).is('#3.bookmark:contains("hij"):visible');
                expect(folderContent.children(':nth(3)')).is('#2.bookmark:contains("xyz"):visible');
                expect(folderContent.children(':nth(4)')).is('.separator:visible');
                expect(folderContent.children(':nth(5)')).is('.openAllInTabs:visible');
                expect(folderContent.children(':nth(6)')).is('.empty:hidden');
            });

            it('sort bookmarks and folders', () => {
                const first = bookmark(1, 'abc');
                const second = bookmark(4, 'de');
                const third = bookmark(3, 'hij');
                const fourth = bookmark(2, 'xyz');
                const firstFolder = givenFolder(101, 'first');
                const secondFolder = givenFolder(102, 'second');
                const thirdFolder = givenFolder(100, 'xyz');

                const folder = givenFolder(10, 'folder', third, first, firstFolder, thirdFolder, fourth, second, secondFolder);
                givenBookmarks([folder]);
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
                expect(folderContent.children()).toHaveLength(10);

                expect(folderContent.children(':nth(0)')).is('#101.folder:contains("first"):visible');
                expect(folderContent.children(':nth(1)')).is('#102.folder:contains("second"):visible');
                expect(folderContent.children(':nth(2)')).is('#100.folder:contains("xyz"):visible');
                expect(folderContent.children(':nth(3)')).is('#1.bookmark:contains("abc"):visible');
                expect(folderContent.children(':nth(4)')).is('#4.bookmark:contains("de"):visible');
                expect(folderContent.children(':nth(5)')).is('#3.bookmark:contains("hij"):visible');
                expect(folderContent.children(':nth(6)')).is('#2.bookmark:contains("xyz"):visible');
                expect(folderContent.children(':nth(7)')).is('.separator:visible');
                expect(folderContent.children(':nth(8)')).is('.openAllInTabs:visible');
                expect(folderContent.children(':nth(9)')).is('.empty:hidden');
            });

            it('in root folder', () => {
                const firstFolder = givenFolder(100, '6th');
                const secondFolder = givenFolder(101, '1st');
                const thirdFolder = givenFolder(102, '3rd');
                const first = bookmark(1, '6th');
                const second = bookmark(2, '1st');
                const third = bookmark(3, '3rd');
                const firstFolderInOthers = givenFolder(110, '5th');
                const secondFolderInOthers = givenFolder(111, '2nd');
                const thirdFolderInOthers = givenFolder(112, '4th');
                const firstInOthers = bookmark(4, '5th');
                const secondInOthers = bookmark(5, '2nd');
                const thirdInOthers = bookmark(6, '4th');
                const fourthInOthers = bookmark(7, '1st');
                givenBookmarks(
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
                expect(folderContent.children(':nth(0)')).is('#101.folder:contains("1st"):visible');
                expect(folderContent.children(':nth(1)')).is('#102.folder:contains("3rd"):visible');
                expect(folderContent.children(':nth(2)')).is('#100.folder:contains("6th"):visible');
                expect(folderContent.children(':nth(3)')).is('#2.bookmark:contains("1st"):visible');
                expect(folderContent.children(':nth(4)')).is('#3.bookmark:contains("3rd"):visible');
                expect(folderContent.children(':nth(5)')).is('#1.bookmark:contains("6th"):visible');
                expect(folderContent.children(':nth(6)')).is('.separator:visible');
                expect(folderContent.children(':nth(7)')).is('#111.folder:contains("2nd"):visible');
                expect(folderContent.children(':nth(8)')).is('#112.folder:contains("4th"):visible');
                expect(folderContent.children(':nth(9)')).is('#110.folder:contains("5th"):visible');
                expect(folderContent.children(':nth(10)')).is('#7.bookmark:contains("1st"):visible');
                expect(folderContent.children(':nth(11)')).is('#5.bookmark:contains("2nd"):visible');
                expect(folderContent.children(':nth(12)')).is('#6.bookmark:contains("4th"):visible');
                expect(folderContent.children(':nth(13)')).is('#4.bookmark:contains("5th"):visible');
            });

            it('in root folder with hidden bookmarks or folders', () => {
                const firstFolder = givenFolder(100, '6th');
                const secondFolder = givenFolder(101, '1st hidden');
                const thirdFolder = givenFolder(102, '3rd');
                const first = bookmark(1, '6th hidden');
                const second = bookmark(2, '1st');
                const third = bookmark(3, '3rd');
                const firstFolderInOthers = givenFolder(110, '5th');
                const secondFolderInOthers = givenFolder(111, '2nd');
                const thirdFolderInOthers = givenFolder(112, '4th hidden');
                const firstInOthers = bookmark(4, '5th');
                const secondInOthers = bookmark(5, '2nd');
                const thirdInOthers = bookmark(6, '4th');
                const fourthInOthers = bookmark(7, '1st hidden');
                [secondFolder, first, thirdFolderInOthers, fourthInOthers].forEach(each => {
                    Settings.setBookmarkHidden(each.title, true);
                });
                givenBookmarks(
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
                expect(folderContent.children(':nth(0)')).is('#102.folder:contains("3rd"):visible');
                expect(folderContent.children(':nth(1)')).is('#100.folder:contains("6th"):visible');
                expect(folderContent.children(':nth(2)')).is('#2.bookmark:contains("1st"):visible');
                expect(folderContent.children(':nth(3)')).is('#3.bookmark:contains("3rd"):visible');
                expect(folderContent.children(':nth(4)')).is('.separator:visible');
                expect(folderContent.children(':nth(5)')).is('#111.folder:contains("2nd"):visible');
                expect(folderContent.children(':nth(6)')).is('#110.folder:contains("5th"):visible');
                expect(folderContent.children(':nth(7)')).is('#5.bookmark:contains("2nd"):visible');
                expect(folderContent.children(':nth(8)')).is('#6.bookmark:contains("4th"):visible');
                expect(folderContent.children(':nth(9)')).is('#4.bookmark:contains("5th"):visible');
                const expectedIdOrder = [101, 102, 100, 2, 3, 1, 111, 112, 110, 7, 5, 6, 4];
                expect(chrome.bookmarks.move).toBeCalledTimes(expectedIdOrder.length);
                expectedIdOrder.forEach((id, index) => {
                    const nthCall = index + 1;
                    const expectedPosition = index >= 6 ? index - 6 : index;
                    expect(chrome.bookmarks.move).toHaveBeenNthCalledWith(nthCall, id.toString(), { index: expectedPosition });
                });
            });

            it('in root folder when all items in toolbar are hidden', () => {
                const firstFolder = givenFolder(100, '6th hidden');
                const secondFolder = givenFolder(101, '1st hidden');
                const thirdFolder = givenFolder(102, '3rd hidden');
                const firstFolderInOthers = givenFolder(110, '5th');
                const secondFolderInOthers = givenFolder(111, '2nd');
                const thirdFolderInOthers = givenFolder(112, '4th');
                [firstFolder, secondFolder, thirdFolder].forEach(each => {
                    Settings.setBookmarkHidden(each.title, true);
                });
                givenBookmarks([firstFolder, secondFolder, thirdFolder], [firstFolderInOthers, thirdFolderInOthers, secondFolderInOthers]);
                chrome.bookmarks.move = jest.fn();

                mouseOverAndClickOn(firstFolderInOthers, { button: 2 });
                chooseContextMenuItem(ContextMenuItem.Reorder);

                const folderContent = $('#bookmarksMenu');
                expect(folderContent).toHaveLength(1);
                expect(folderContent).is(':visible');
                expect(folderContent.children()).toHaveLength(4);
                expect(folderContent.children(':nth(0)')).is('.separator:hidden');
                expect(folderContent.children(':nth(1)')).is('#111.folder:contains("2nd"):visible');
                expect(folderContent.children(':nth(2)')).is('#112.folder:contains("4th"):visible');
                expect(folderContent.children(':nth(3)')).is('#110.folder:contains("5th"):visible');
                const expectedIdOrder = [101, 102, 100, 111, 112, 110];
                expect(chrome.bookmarks.move).toBeCalledTimes(expectedIdOrder.length);
                expectedIdOrder.forEach((id, index) => {
                    const nthCall = index + 1;
                    const expectedPosition = index >= 3 ? index - 3 : index;
                    expect(chrome.bookmarks.move).toHaveBeenNthCalledWith(nthCall, id.toString(), { index: expectedPosition });
                });
            });

        });

        describe('open bookmark', () => {
            it.each([false, true])('just open when option switchToNewTab = %p', (optionSwitchToNewTab: Boolean) => {
                localStorage.switchToNewTab = optionSwitchToNewTab;
                const first = bookmark();
                givenBookmarks([bookmark(), first, bookmark()]);
                window.close = jest.fn();

                mouseOverAndClickOn(first, { button: 2 });
                chooseContextMenuItem(ContextMenuItem.OpenInNewTab);

                expect(chrome.tabs.create).toBeCalledTimes(1);
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(1, { url: first.url, active: optionSwitchToNewTab });
                expect(window.close).toHaveBeenCalled();
            });

            it.each([
                ['in new window', ContextMenuItem.OpenInNewWindow, false],
                ['in incognito window', ContextMenuItem.OpenInIncognitoWindow, true],
            ])('%s', (testName, contextMenuItem: ContextMenuItem, expectedInIncognito) => {
                const first = bookmark();
                givenBookmarks([bookmark(), first, bookmark()]);
                window.close = jest.fn();

                mouseOverAndClickOn(first, { button: 2 });
                chooseContextMenuItem(contextMenuItem);

                expect(chrome.windows.create).toBeCalledTimes(1);
                expect(chrome.windows.create).toHaveBeenCalledWith({ url: first.url, incognito: expectedInIncognito });
                expect(window.close).toHaveBeenCalled();
            });
        });

        describe('open all bookmarks', () => {
            it('in tabs', () => {
                const first = bookmark();
                const second = bookmark();
                const third = bookmark();
                const folder = givenFolder(100, 'some folder', first, second, third, givenFolder(101, 'sub folder', bookmark(), bookmark()));
                givenBookmarks([folder, givenFolder(102, 'yet another folder', bookmark(), bookmark())]);
                window.close = jest.fn();

                mouseOverAndClickOn(folder, { button: 2 });
                chooseContextMenuItem(ContextMenuItem.OpenAllInTabs);

                expect(chrome.tabs.create).toBeCalledTimes(3);
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(1, { url: first.url, active: true });
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(2, { url: second.url, active: false });
                expect(chrome.tabs.create).toHaveBeenNthCalledWith(3, { url: third.url, active: false });
                expect(window.close).toHaveBeenCalled();
            });

            it.each([
                ['in new window', ContextMenuItem.OpenAllInNewWindow, false],
                ['in incognito window', ContextMenuItem.OpenAllInIncognitoWindow, true],
            ])('%s', (testName, contextMenuItem: ContextMenuItem, expectedInIncognito) => {
                const first = bookmark();
                const second = bookmark();
                const third = bookmark();
                const folder = givenFolder(100, 'some folder', first, second, third, givenFolder(101, 'sub folder', bookmark(), bookmark()));
                givenBookmarks([folder, givenFolder(102, 'yet another folder', bookmark(), bookmark())]);
                window.close = jest.fn();

                mouseOverAndClickOn(folder, { button: 2 });
                chooseContextMenuItem(contextMenuItem);

                expect(chrome.windows.create).toBeCalledTimes(1);
                expect(chrome.windows.create).toHaveBeenCalledWith({ url: [first.url, second.url, third.url], incognito: expectedInIncognito });
                expect(window.close).toHaveBeenCalled();
            });
        });

        describe('remove', () => {
            it('remove bookmark', () => {
                const first = bookmark(1, 'first');
                const second = bookmark(2, 'second');
                const third = bookmark(3, 'third');

                givenBookmarks([first, second, third]);

                mouseOverAndClickOn(second, { button: 2 });
                chooseContextMenuItem(ContextMenuItem.Remove);

                expect(chrome.bookmarks.remove).toBeCalledWith(second.id);
                const folderContent = $('#bookmarksMenu');
                expect(folderContent).is(':visible');
                expect(folderContent.children()).toHaveLength(3);
                expect(folderContent.children(':nth(0)')).is('#1.bookmark:contains("first"):visible');
                expect(folderContent.children(':nth(1)')).is('#3.bookmark:contains("third"):visible');
                expect(folderContent.children(':nth(2)')).is('.separator:hidden');
            });
        });
    });

    function chooseContextMenuItem(item: ContextMenuItem) {
        const el = $(`#contextMenu > .enabled[data-action="${item}"]:visible`);
        mouseOverAndClickOn(el);
    }

    function mouseOverAndClickOn(bookmark: chrome.bookmarks.BookmarkTreeNode | JQuery<HTMLElement>, eventInit: MouseEventInit = {}) {
        mouseOver(bookmark);
        clickOn(bookmark, eventInit);
    }

    function clickOn(bookmark: chrome.bookmarks.BookmarkTreeNode | JQuery<HTMLElement>, eventInit: MouseEventInit = {}) {
        const evt = new MouseEvent('mouseup', {
            button: 0,
            cancelable: true,
            bubbles: true,
            ...eventInit
        });
        if (isJQueryObject(bookmark)) {
            bookmark[0].dispatchEvent(evt);
        } else {
            document.getElementById(bookmark.id)!!.dispatchEvent(evt);
        }
    }

    function isJQueryObject(obj: any): obj is JQuery<HTMLElement> {
        return !!obj.jquery;
    }

    function clickOpenAll(folder: chrome.bookmarks.BookmarkTreeNode, eventInit: MouseEventInit = {}) {
        const evt = new MouseEvent('mouseup', {
            button: 0,
            cancelable: true,
            bubbles: true,
            ...eventInit
        });
        document
            .getElementById(folder.id)!!
            .querySelector('ul > li.openAllInTabs')!!
            .dispatchEvent(evt);
    }

    function mouseOver(item: chrome.bookmarks.BookmarkTreeNode | JQuery<HTMLElement>, eventInit: MouseEventInit = {}) {
        const evt = new MouseEvent('mouseover', {
            cancelable: true,
            bubbles: true,
            ...eventInit
        });
        if (isJQueryObject(item)) {
            item[0].dispatchEvent(evt);
        } else {
            document.getElementById(item.id)!!.dispatchEvent(evt);
        }
    }

    function bookmark(id = bookmark.nextId++, title = randomAlphanumeric(), url = `http://${randomAlphanumeric()}`): chrome.bookmarks.BookmarkTreeNode {
        return {
            id: '' + id,
            title,
            url
        };
    }
    bookmark.nextId = 1;

    function givenFolder(folderId: number, title: string = randomAlphanumeric(), ...children: chrome.bookmarks.BookmarkTreeNode[]): chrome.bookmarks.BookmarkTreeNode {
        const id = '' + folderId;
        children.forEach(each => (each.parentId = id));
        return {
            id,
            title,
            children
        };
    }

    function givenBookmarks(quick: chrome.bookmarks.BookmarkTreeNode[], other: chrome.bookmarks.BookmarkTreeNode[] = []) {
        quick.forEach(each => (each.parentId = 'quick'));
        other.forEach(each => (each.parentId = 'other'));
        givenChromeBookmarks([
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

    function hideBookmarks(...bookmarks: chrome.bookmarks.BookmarkTreeNode[]) {
        bookmarks.forEach(each => Settings.setBookmarkHidden(each.title, true));
    }
});
