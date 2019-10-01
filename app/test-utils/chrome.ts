export interface BookmarkTreeNode {
  id: string;
  title: string;
  children?: BookmarkTreeNode[];
  parentId?: string;
  index?: number;
  url?: string;
  dateAdded?: number;
  dateGroupModified?: number;
}

class I18NApi {}

class TabsApi {
  update(tabsId: number, updateProperties: { url?: string }): void {
    throw Error('Not implemented!');
  }

  create(createProperties: {
    windowId?: number;
    index?: number;
    url?: string;
    active?: boolean;
    pinned?: boolean;
    openerTabId?: number;
  }) {
    throw Error('Not implemented!');
  }
}

class WindowsApi {
  create(createData?: {
    url?: string | string[];
    tabId?: number;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    focused?: boolean;
    incognito?: boolean;
    setSelfAsOpener?: boolean;
  }) {
    throw Error('Not implemented!');
  }
}
class BookmarksApi {
  private getTreeCallback: (nodes: BookmarkTreeNode[]) => void = nodes => {
    throw Error('Not implemented!');
  };

  getTree(callback: (nodes: BookmarkTreeNode[]) => void) {
    this.getTreeCallback = callback;
  }

  givenBookmarks(bookmarks: BookmarkTreeNode[]) {
    this.getTreeCallback(bookmarks);
  }
}

export class Chrome {
  i18n: I18NApi;
  tabs: TabsApi;
  bookmarks: BookmarksApi;
  windows: WindowsApi;

  constructor() {
    this.reset();
  }

  reset() {
    this.i18n = new I18NApi();
    this.tabs = new TabsApi();
    this.bookmarks = new BookmarksApi();
    this.windows = new WindowsApi();
  }
}
