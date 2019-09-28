import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import '../../test-utils/expect-jquery';
import { simulateCustomeElements } from '../../test-utils/simulate-custom-elements';
import { JQueryMatchers } from '../../test-utils/expect-jquery';

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

let getTreeCallback: (nodes: BookmarkTreeNode[]) => void;
window['chrome'] = {
  i18n: {},
  bookmarks: {
    getTree(callback: (nodes: BookmarkTreeNode[]) => void) {
      getTreeCallback = callback;
    }
  }
};

declare global {
  namespace jest {
    interface Matchers<R> extends JQueryMatchers<R> {}
  }
}

describe('popup.html', () => {
  const css = readFileSync(resolve(__dirname, 'popup.css'), 'utf-8');
  const html =
    `<style>${css}</style>` +
    readFileSync(resolve(__dirname, 'popup.html'), 'utf-8').replace(
      /(<!DOCTYPE.*$|<\/?html>)$/gm,
      '<!-- $1 -->'
    );

  beforeAll(() => {
    simulateCustomeElements();
    import('./popup');
  });

  let bookmarksMenu: JQuery<HTMLElement>;
  beforeEach(() => {
    getTreeCallback = nodes => {
      throw Error('Not implemented');
    };
    document.documentElement.innerHTML = html;
    document.dispatchEvent(new Event('DOMContentLoaded'));
    bookmarksMenu = $('#bookmarksMenu');
  });

  afterEach(() => {
    $(document.documentElement).empty();
  });

  it('#bookmarksMenu exists', () => {
    expect(bookmarksMenu).toHaveLength(1);
    expect(bookmarksMenu).is(':visible');
  });

  it('with bookmarks in toolbar', () => {
    givenBookmakrs([
      bookmark(1, 'lenta', 'http://lenta.ru'),
      bookmark(2, 'gazeta', 'http://gazeta.ru')
    ]);

    expect(bookmarksMenu.children()).toHaveLength(3);
    expect(bookmarksMenu.children(':nth(0)')).is('#1[type=bookmark]:visible');
    expect(bookmarksMenu.children(':nth(1)')).is('#2[type=bookmark]:visible');
    expect(bookmarksMenu.children(':nth(2)')).is('.separator:not(:visible)');
  });

  it('with bookmarks in both parts', () => {
    givenBookmakrs(
      [bookmark(1, 'lenta', 'http://lenta.ru')],
      [bookmark(2, 'gazeta', 'http://gazeta.ru')]
    );

    expect(bookmarksMenu.children()).toHaveLength(3);
    expect(bookmarksMenu.children(':nth(0)')).is('#1[type=bookmark]:visible');
    expect(bookmarksMenu.children(':nth(1)')).is('.separator:visible');
    expect(bookmarksMenu.children(':nth(2)')).is('#2[type=bookmark]:visible');
  });

  it('with bookmarks only in other part', () => {
    givenBookmakrs(
      [],
      [
        bookmark(1, 'lenta', 'http://lenta.ru'),
        bookmark(2, 'gazeta', 'http://gazeta.ru')
      ]
    );

    expect(bookmarksMenu.children()).toHaveLength(3);
    expect(bookmarksMenu.children(':nth(0)')).is('.separator:not(:visible)');
    expect(bookmarksMenu.children(':nth(1)')).is('#1[type=bookmark]:visible');
    expect(bookmarksMenu.children(':nth(2)')).is('#2[type=bookmark]:visible');
  });

  function bookmark(id: number, title: string, url: string): BookmarkTreeNode {
    return {
      id: '' + id,
      title,
      url
    };
  }
  function givenBookmakrs(
    quick: BookmarkTreeNode[],
    other: BookmarkTreeNode[] = []
  ) {
    getTreeCallback([
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
});
