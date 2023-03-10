
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

let saveBookmarksGetTreeCallback: ((nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) | null

export function givenChromeBookmarks(bookmarks: chrome.bookmarks.BookmarkTreeNode[]) {
    expect(saveBookmarksGetTreeCallback).not.toBeNull();
    saveBookmarksGetTreeCallback!!(bookmarks);
}

export function resetChrome(): void {
    if (typeof chrome === 'undefined') {
        initChrome();
    }

    saveBookmarksGetTreeCallback = null;

    Object.keys(chrome).forEach(each => {
        const chromeApi = chrome[each];
        Object.keys(chromeApi).forEach(key => delete chromeApi[key]);
    });

    chrome.bookmarks.getTree = function (callback?: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
        expect(callback).not.toBeNull();
        saveBookmarksGetTreeCallback = callback!!

        return new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve, reject) => {
            resolve([]);
        });
    }

    chrome.i18n.getMessage = (msg: string) => msg;

    chrome.runtime.getURL = (_url: string) => 'file://../../icons/folder-win.png';
}
