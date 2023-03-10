import { E, i18nUtils } from './common';
import { randomAlphanumeric } from '../test-utils/random-utils'
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
            expect(element.childNodes[0].nodeName).toBe("#text");
            expect(element.textContent).toBe(msg);
            expect(element.childElementCount).toBe(0);
        });
    });
});
