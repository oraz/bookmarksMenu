
import { readFileSync } from 'fs';
import { resolve } from 'path';
import M from 'ts-mockito';

interface BookmarkTreeNode {
    id: string,
    title: string,
    children?: BookmarkTreeNode[],
    parentId?: string,
    index?: number,
    url?: string,
    dateAdded?: number,
    dateGroupModified?: number,
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

window['customElements'] = M.instance(M.mock<CustomElementRegistry>());


describe('popup.html', () => {
    const html = readFileSync(resolve(__dirname, 'popup.html'), 'utf-8');

    beforeAll(() => {
        import('./popup').then(Popup => {
            const nativeCreateElement = document.createElement.bind(document);
            document.createElement = (nodeName: string, options?: ElementCreationOptions) => {
                const el: HTMLElement = nativeCreateElement(nodeName);
                if (options === undefined) {
                    return el;
                } else {
                    return Object.setPrototypeOf(el, Popup.Bookmark.prototype);
                }
            }
        });
    })

    beforeEach(() => {
        document.documentElement.innerHTML = html;
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    it('#bookmarksMenu exists', () => {
        expect(bookmarksMenu()).toBeInstanceOf(HTMLUListElement);
    });

    it('with some bookmarks', () => {
        getTreeCallback([
            {
                id: 'root',
                title: 'root',
                children: [
                    {
                        id: 'quick',
                        title: 'quick',
                        children: [
                            {
                                id: '1',
                                title: 'lenta.ru',
                                url: 'http://lenta.ru'
                            },
                            {
                                id: '2',
                                title: 'gazeta.ru',
                                url: 'http://gazeta.ru'
                            }
                        ]
                    },
                    {
                        id: 'other',
                        title: 'other',
                        children: []
                    }
                ]
            }
        ]);

        expect(bookmarksMenu().childElementCount).toBe(3);
    });

    function bookmarksMenu(): HTMLUListElement {
        return document.getElementById('bookmarksMenu') as HTMLUListElement;
    }
});