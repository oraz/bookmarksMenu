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
    throw Error('Not implemented!');
  };

  getTree(callback: (nodes: BookmarkTreeNode[]) => void) {
    this.getTreeCallback = callback;
  }

  givenBookmarks(bookmarks: BookmarkTreeNode[]) {
    this.getTreeCallback(bookmarks);
  }
}
