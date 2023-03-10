
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
type BookmarksGetTreeCallback = ((_nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) | null;

let savedBookmarksGetTreeCallback: BookmarksGetTreeCallback;

export function givenChromeBookmarks(bookmarks: chrome.bookmarks.BookmarkTreeNode[]) {
    expect(savedBookmarksGetTreeCallback).not.toBeNull();
    savedBookmarksGetTreeCallback!!(bookmarks);
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

    chrome.bookmarks.getTree = function (callback?: BookmarksGetTreeCallback): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        expect(callback).not.toBeNull();
        savedBookmarksGetTreeCallback = callback!!;

        return Promise.resolve([]);
    };

    chrome.i18n.getMessage = (msg: string) => msg;

    // eslint-disable-next-line no-unused-vars
    chrome.runtime.getURL = (_url: string) => 'file://../../icons/folder-win.png';
}
