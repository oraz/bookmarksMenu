
import { resetChrome } from './chrome-mock';

describe('chrome-mocks', () => {

    beforeEach(resetChrome);

    it('reset must clear mocks', () => {
        expect(chrome.tabs.update).toBeUndefined();
        chrome.tabs.update = jest.fn();
        expect(chrome.tabs.update).not.toBeUndefined();

        resetChrome();

        expect(chrome.tabs.update).toBeUndefined();
    });
});
