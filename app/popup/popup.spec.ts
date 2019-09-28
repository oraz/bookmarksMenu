import { readFileSync } from 'fs';
import { resolve } from 'path';
import $ from 'jquery';
import '../../test-utils/expect-jquery';
import { simulateCustomeElements } from '../../test-utils/simulate-custom-elements';

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
    interface Matchers<R> {
      is(selector: string): R;
      toBeVisible(): R;
    }
  }
}

$.extend($.expr[':'], {
  displayed: (el: HTMLElement) => $(el).css('display') !== 'none',
  visible: (el: HTMLElement) => $(el).css('display') !== 'none',
  hidden: (el: HTMLElement) => $(el).css('display') === 'none'
});

describe('popup.html', () => {
  const html = readFileSync(resolve(__dirname, 'popup.html'), 'utf-8').replace(
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
    const doc = document.documentElement;
    while (doc.hasChildNodes()) {
      doc.removeChild(doc.lastChild);
    }
  });

  it('#bookmarksMenu exists', () => {
    expect(bookmarksMenu).toHaveLength(1);
    expect(bookmarksMenu).is(':displayed');
  });

  it('with bookmarks in toolbar', () => {
    givenBookmakrs([
      bookmark(1, 'lenta', 'http://lenta.ru'),
      bookmark(2, 'gazeta', 'http://gazeta.ru')
    ]);

    expect(bookmarksMenu.children()).toHaveLength(3);
    expect(bookmarksMenu.children(':nth(0)')).is('#1[type=bookmark]:displayed');
    expect(bookmarksMenu.children(':nth(1)')).is('#2[type=bookmark]:displayed');
    expect(bookmarksMenu.children(':nth(2)')).is('.separator:not(:displayed)');
  });

  it('with bookmarks in both parts', () => {
    givenBookmakrs(
      [bookmark(1, 'lenta', 'http://lenta.ru')],
      [bookmark(2, 'gazeta', 'http://gazeta.ru')]
    );

    expect(bookmarksMenu.children()).toHaveLength(3);
    expect(bookmarksMenu.children(':nth(0)')).is('#1[type=bookmark]:displayed');
    expect(bookmarksMenu.children(':nth(1)')).is('.separator:displayed');
    expect(bookmarksMenu.children(':nth(2)')).is('#2[type=bookmark]:displayed');
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
    expect(bookmarksMenu.children(':nth(0)')).is('.separator:not(:displayed)');
    expect(bookmarksMenu.children(':nth(1)')).is('#1[type=bookmark]:displayed');
    expect(bookmarksMenu.children(':nth(2)')).is('#2[type=bookmark]:displayed');
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
