
import JestMockPromise from 'jest-mock-promise';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

// see https://developer.chrome.com/docs/extensions/reference/
export function initChrome(): void {
    Object.defineProperty(global, 'chrome', {
        value: {
            // https://developer.chrome.com/docs/extensions/reference/bookmarks
            bookmarks: {},
            // https://developer.chrome.com/docs/extensions/reference/i18n
            i18n: {},
            // https://developer.chrome.com/docs/extensions/reference/runtime
            runtime: {},
            // https://developer.chrome.com/docs/extensions/reference/tabs
            tabs: {},
            // https://developer.chrome.com/docs/extensions/reference/windows
            windows: {}
        }
    });

    resetChrome();
}

// eslint-disable-next-line no-unused-vars
type BookmarksGetTreeCallback = JestMockPromise<BookmarkTreeNode[]> | null;

let savedBookmarksGetTreeCallback: BookmarksGetTreeCallback;


export function givenChromeBookmarks(bookmarks: BookmarkTreeNode[]) {
    expect(savedBookmarksGetTreeCallback).not.toBeNull();
    savedBookmarksGetTreeCallback!!.resolve(bookmarks);
}

export function resetChrome(): void {
    if (typeof chrome === 'undefined') {
        initChrome();
    }

    savedBookmarksGetTreeCallback = null;

    Object.keys(chrome).forEach(each => {
        const chromeApi = chrome[each];
        Object.keys(chromeApi).forEach(key => delete chromeApi[key]);
    });


    chrome.bookmarks.getTree = function (): Promise<BookmarkTreeNode[]> {
        savedBookmarksGetTreeCallback = new JestMockPromise<BookmarkTreeNode[]>();
        return savedBookmarksGetTreeCallback as unknown as Promise<BookmarkTreeNode[]>;
    };
    chrome.bookmarks.remove = jest.fn(() => new JestMockPromise(resolve => resolve()));

    chrome.i18n.getMessage = (msg: string) => msg;

    chrome.runtime.getURL = () => 'file://../../icons/folder-win.png';

    chrome.tabs.create = jest.fn(() => new JestMockPromise(resolve => resolve()));
    chrome.tabs.update = jest.fn(() => new JestMockPromise(resolve => resolve()));

    chrome.windows.create = jest.fn(() => new JestMockPromise(resolve => resolve()));
}
