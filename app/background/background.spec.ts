
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