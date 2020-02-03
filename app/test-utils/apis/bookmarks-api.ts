/**
 * @see https://developer.chrome.com/extensions/bookmarks#toc
 */
/// <reference path="../../common/chrome-api.d.ts"/>

export class BookmarksApiImpl implements BookmarksApi {
  private getTreeCallback: (nodes: BookmarkTreeNode[]) => void = nodes => {
    throw new Error('Not implemented!');
  };

  getTree(callback: (nodes: BookmarkTreeNode[]) => void) {
    this.getTreeCallback = callback;
  }

  givenBookmarks(bookmarks: BookmarkTreeNode[]) {
    this.getTreeCallback(bookmarks);
  }

  move(id: string, destination: BookmarkMoveData): void {
    throw new Error('Not implemented!');
  }

  remove(id: String, callback: () => void) {
    throw new Error('Not implemented!');
  }
}
