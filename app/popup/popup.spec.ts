
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

describe('popup.html', () => {
    const html = readFileSync(resolve(__dirname, 'popup.html'), 'utf-8');

    beforeAll(() => {
        const customElementsDefinitions: {
            customTagName: string,
            clazz: Function,
            config: ElementDefinitionOptions
        }[] = [];

        const customElementsMock = M.mock<CustomElementRegistry>();
        M.when(customElementsMock.define(M.anyString(), M.anyFunction(), M.anything()))
            .thenCall((customTagName: string, clazz: Function, config: ElementDefinitionOptions) => {
                customElementsDefinitions.push({ customTagName, clazz, config });
            });
        window.customElements = M.instance(customElementsMock);

        const nativeCreateElement = document.createElement.bind(document);
        document.createElement = (nodeName: string, options?: ElementCreationOptions) => {
            const el: HTMLElement = nativeCreateElement(nodeName);
            if (options === undefined) {
                return el;
            } else {
                const definition = customElementsDefinitions.find(each => each.config.extends === nodeName && each.customTagName === options.is);
                return Object.setPrototypeOf(el, definition.clazz.prototype);
            }
        }

        import('./popup');
    });

    beforeEach(() => {
        document.documentElement.innerHTML = html;
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    it('#bookmarksMenu exists', () => {
        expect(bookmarksMenu()).toBeInstanceOf(HTMLUListElement);
    });

    it('with some bookmarks', () => {
        givenBookmakrs([
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
        ]);

        expect(bookmarksMenu().childElementCount).toBe(3);
    });

    function bookmarksMenu(): HTMLUListElement {
        return document.getElementById('bookmarksMenu') as HTMLUListElement;
    }

    function givenBookmakrs(quick: BookmarkTreeNode[], other: BookmarkTreeNode[] = []) {
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