
import { readFileSync } from 'fs';
import { resolve } from 'path';
import M from 'ts-mockito';

window['chrome'] = {
    i18n: {},
    bookmarks: {
        getTree(getTreeCallback) {

        }
    }
};

window['customElements'] = M.instance(M.mock<CustomElementRegistry>());

describe('popup.html', () => {
    const html = readFileSync(resolve(__dirname, 'popup.html'), 'utf-8');

    beforeEach(() => {
        document.documentElement.innerHTML = html;
        import('./popup').then(() => document.dispatchEvent(new Event('DOMContentLoaded')));
    });

    it('#bookmarksMenu exists', () => {
        expect(document.getElementById('bookmarksMenu')).toBeInstanceOf(HTMLUListElement);
    });
});