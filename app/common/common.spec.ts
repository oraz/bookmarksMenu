import { E, i18nUtils } from './common';
import { randomAlphanumeric } from '../test-utils/random-utils';
import { resetChrome } from '../test-utils/chrome-mock';

describe('common.js', () => {
    describe('E', () => {
        it('show', () => {
            const span = document.createElement('span');

            E.show(span);

            expect(span.style.display).toBe('block');
        });

        it('hide', () => {
            const span = document.createElement('span');

            E.hide(span);

            expect(span.style.display).toBe('none');
        });
    });

    describe('i18nUtils', () => {
        beforeEach(resetChrome);

        it('init', () => {
            const msg = randomAlphanumeric();
            const element = document.createElement('span');
            element.dataset.i18n = msg;

            i18nUtils.init(element);

            expect(element.childNodes.length).toBe(1);
            expect(element.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
            expect(element.textContent).toBe(msg);
            expect(element.childElementCount).toBe(0);
        });

        it('init should remove empty textNodes created by Editor for CodeFormatting', () => {
            const msg = randomAlphanumeric();
            const element = document.createElement('li');
            element.dataset.i18n = msg;
            /** Example of html: see popup.html
             * <li data-i18n="msg">
             *     <img .../>
             * </li>
             */
            element.appendChild(document.createTextNode('     \t  \n   '));
            element.appendChild(document.createElement('img'));
            element.appendChild(document.createTextNode('     \t  '));

            i18nUtils.init(element);

            expect(element.childNodes.length).toBe(4);
            expect(element.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
            expect(element.childNodes[0].nodeValue).toBe('');
            expect(element.childNodes[1].nodeType).toBe(Node.ELEMENT_NODE);
            expect(element.childNodes[1].nodeName.toLowerCase()).toBe('img');
            expect(element.childNodes[2].nodeType).toBe(Node.TEXT_NODE);
            expect(element.childNodes[2].nodeValue).toBe('');
            expect(element.childNodes[3].nodeType).toBe(Node.TEXT_NODE);
            expect(element.childNodes[3].nodeValue).toBe(msg);
            expect(element.textContent).toBe(msg);
            expect(element.childElementCount).toBe(1);
        });
    });
});
