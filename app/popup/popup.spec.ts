import { readFileSync } from 'fs';
import { resolve } from 'path';
import M from 'ts-mockito';
import $ from 'jquery';

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

describe('popup.html', () => {
  const html = readFileSync(resolve(__dirname, 'popup.html'), 'utf-8').replace(
    /(<!DOCTYPE.*$|<\/?html>)$/gm,
    '<!-- $1 -->'
  );

  beforeAll(() => {
    const customElementsDefinitions: {
      customTagName: string;
      clazz: Function;
      config: ElementDefinitionOptions;
    }[] = [];

    const customElementsMock = M.mock<CustomElementRegistry>();
    M.when(
      customElementsMock.define(M.anyString(), M.anyFunction(), M.anything())
    ).thenCall(
      (
        customTagName: string,
        clazz: Function,
        config: ElementDefinitionOptions
      ) => {
        customElementsDefinitions.push({ customTagName, clazz, config });
      }
    );
    window.customElements = M.instance(customElementsMock);

    const nativeCreateElement = document.createElement.bind(document);
    document.createElement = (
      nodeName: string,
      options?: ElementCreationOptions
    ) => {
      const el: HTMLElement = nativeCreateElement(nodeName);
      if (options === undefined) {
        return el;
      } else {
        const definition = customElementsDefinitions.find(
          each =>
            each.config.extends === nodeName &&
            each.customTagName === options.is
        );
        return Object.setPrototypeOf(el, definition.clazz.prototype);
      }
    };

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
    expect(bookmarksMenu.length).toBe(1);
  });

  it('with bookmarks in toolbar', () => {
    givenBookmakrs([
      bookmark(1, 'lenta', 'http://lenta.ru'),
      bookmark(2, 'gazeta', 'http://gazeta.ru')
    ]);

    expect(bookmarksMenu.children().length).toBe(3);

    const first = bookmarksMenu.children(':nth(0)');
    expect(first.is('#1[type=bookmark]')).toBeTruthy();
    expect(first.css('display')).toBe('list-item');

    const second = bookmarksMenu.children(':nth(1)');
    expect(second.is('#2[type=bookmark]')).toBeTruthy();
    expect(second.css('display')).toBe('list-item');

    const separator = bookmarksMenu.children(':nth(2)');
    expect(separator.is('.separator')).toBeTruthy();
    expect(separator.css('display')).toBe('none');
  });

  it('with bookmarks in both parts', () => {
    givenBookmakrs(
      [bookmark(1, 'lenta', 'http://lenta.ru')],
      [bookmark(2, 'gazeta', 'http://gazeta.ru')]
    );

    expect(bookmarksMenu.children().length).toBe(3);

    const first = bookmarksMenu.children(':nth(0)');
    expect(first.is('#1[type=bookmark]')).toBeTruthy();
    expect(first.css('display')).toBe('list-item');

    const separator = bookmarksMenu.children(':nth(1)');
    expect(separator.is('.separator')).toBeTruthy();
    expect(separator.css('display')).toBe('list-item');

    const second = bookmarksMenu.children(':nth(2)');
    expect(second.is('#2[type=bookmark]')).toBeTruthy();
    expect(second.css('display')).toBe('list-item');
  });

  it('with bookmarks only in other part', () => {
    givenBookmakrs(
      [],
      [
        bookmark(1, 'lenta', 'http://lenta.ru'),
        bookmark(2, 'gazeta', 'http://gazeta.ru')
      ]
    );

    expect(bookmarksMenu.children().length).toBe(3);

    const separator = bookmarksMenu.children(':nth(0)');
    expect(separator.is('.separator')).toBeTruthy();
    expect(separator.css('display')).toBe('none');

    const first = bookmarksMenu.children(':nth(1)');
    expect(first.is('#1[type=bookmark]')).toBeTruthy();
    expect(first.css('display')).toBe('list-item');

    const second = bookmarksMenu.children(':nth(2)');
    expect(second.is('#2[type=bookmark]')).toBeTruthy();
    expect(second.css('display')).toBe('list-item');
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
