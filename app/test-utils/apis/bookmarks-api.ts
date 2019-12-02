/**
 * @see https://developer.chrome.com/extensions/bookmarks#toc
 */

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

export class BookmarksApi {
  private getTreeCallback: (nodes: BookmarkTreeNode[]) => void = nodes => {
    throw new Error('Not implemented!');
  };

  getTree(callback: (nodes: BookmarkTreeNode[]) => void) {
    this.getTreeCallback = callback;
  }

  givenBookmarks(bookmarks: BookmarkTreeNode[]) {
    this.getTreeCallback(bookmarks);
  }

  move(
    id: string,
    destination: {
      parentId?: string;
      index?: number;
    }
  ): void {
    throw new Error('Not implemented!');
  }

  remove(id: String, callback: () => void) {
    throw new Error('Not implemented!');
  }
}
