
interface ChromeInterface {
    i18n: I18NApi;
    tabs: TabsApi;
    bookmarks: BookmarksApi;
    windows: WindowsApi;
}

declare var chrome: ChromeInterface;

/**
 * @see https://developer.chrome.com/extensions/i18n
 */
interface I18NApi {
    getMessage(messageName: string, substitutions?: any): string;
}

/**
 * @see https://developer.chrome.com/extensions/tabs#toc
 * @see https://developer.chrome.com/extensions/tabs#method-executeScript
 */

interface TabsExecuteScriptData {
    // not all props are here
    code?: string;
}

interface TabsUpdateData {
    // not all props are here
    url?: string;
}

interface TabsCreateProperties {
    windowId?: number;
    index?: number;
    url?: string;
    active?: boolean;
    pinned?: boolean;
    openerTabId?: number;
}

interface TabsApi {
    update(tabsIdOrUpdateProperties: number | TabsUpdateData, updateProperties?: TabsUpdateData): void;

    create(createProperties: TabsCreateProperties): void

    executeScript(tabIdOrExecuteProps: number | TabsExecuteScriptData, details?: TabsExecuteScriptData): void;
}

/**
 * @see https://developer.chrome.com/extensions/bookmarks#toc
 */

interface BookmarkTreeNode {
    id: string;
    title: string;
    children?: BookmarkTreeNode[];
    parentId?: string;
    index?: number;
    url?: string;
    dateAdded?: number;
    dateGroupModified?: number;
}

interface BookmarkMoveData {
    parentId?: string;
    index?: number;
}

interface BookmarksApi {
    getTree(callback: (nodes: BookmarkTreeNode[]) => void): void;

    move(id: string, destination: BookmarkMoveData): void;

    remove(id: String, callback: () => void): void;
}

interface WindowsCreateWindowData {
    url?: string | string[];
    tabId?: number;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    focused?: boolean;
    incognito?: boolean;
    setSelfAsOpener?: boolean;
}

interface WindowsApi {
    create(createData: WindowsCreateWindowData): void;
}
