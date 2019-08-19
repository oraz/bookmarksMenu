import { Settings } from './settings';

beforeEach(() => {
    localStorage.clear();
});

test('getMaxWidth() default', () => {
    expect(Settings.getMaxWidth()).toBe(30);
});

test('getMaxWith() with saved value', () => {
    localStorage.setItem('maxWidth', 12);

    expect(Settings.getMaxWidth()).toBe("12");
});

test('isSwitchToNewTab()', () => {
    expect(Settings.isSwitchToNewTab()).toBeFalsy();
});

test('isSwitchToNewTab() when true', () => {
    localStorage.setItem('switchToNewTab', true);
    
    expect(Settings.isSwitchToNewTab()).toBeTruthy();
});

test('isSwitchToNewTab() when false', () => {
    localStorage.setItem('switchToNewTab', false);
    
    expect(Settings.isSwitchToNewTab()).toBeFalsy();
});

test.each([false, true])('isBookmarkHidden(something, %p)', useGoogleBookmarks => {
    expect(Settings.isBookmarkHidden('some bookmark', useGoogleBookmarks)).toBeFalsy();
});

test('isBookmarkHidden(something, chrome bookmark)', () => {
    localStorage.setItem('bookmark_some bookmark', true);
    localStorage.setItem('g_bookmark_some bookmark', false);

    expect(Settings.isBookmarkHidden('some bookmark', false)).toBeTruthy();
});

test('isBookmarkHidden(something, google bookmark)', () => {
    localStorage.setItem('bookmark_some bookmark', false);
    localStorage.setItem('g_bookmark_some bookmark', true);
    
    expect(Settings.isBookmarkHidden('some bookmark', true)).toBeTruthy();
});
