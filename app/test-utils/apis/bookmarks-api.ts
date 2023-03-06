/**
 * @see https://developer.chrome.com/extensions/bookmarks#toc
 */

export class BookmarksApiImpl {
  private getTreeCallback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void = nodes => {
    throw new Error('Not implemented!');
  };

  getTree(callback: (nodes: chrome.bookmarks.BookmarkTreeNode[]) => void) {
    this.getTreeCallback = callback;
  }

  givenBookmarks(bookmarks: chrome.bookmarks.BookmarkTreeNode[]) {
    this.getTreeCallback(bookmarks);
  }

  move(id: string, destination: chrome.bookmarks.BookmarkDestinationArg): void {
    throw new Error('Not implemented!');
  }

  remove(id: String, callback: () => void) {
    throw new Error('Not implemented!');
  }
}
