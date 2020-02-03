import { Chrome } from "../test-utils/chrome";

const chrome = new Chrome();
declare global {
    interface Window {
        chrome: Chrome
    }
}
window.chrome = chrome

xdescribe("background.html", () => {
    beforeAll(() => {
        import("./background");
    });

    beforeEach(() => {
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    it('first test', () => {

    });
})