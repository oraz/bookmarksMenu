import { Settings } from './settings';

beforeEach(() => {
    localStorage.clear();
});

it('getMaxWidth() default', () => {
    expect(Settings.getMaxWidth()).toBe('30');
});

it('getMaxWith() with saved value', () => {
    localStorage.setItem('maxWidth', '12');

    expect(Settings.getMaxWidth()).toBe('12');
});

it('isSwitchToNewTab()', () => {
    expect(Settings.isSwitchToNewTab()).toBeFalsy();
});

it('isSwitchToNewTab() when true', () => {
    localStorage.setItem('switchToNewTab', 'true');

    expect(Settings.isSwitchToNewTab()).toBeTruthy();
});

it('isSwitchToNewTab() when false', () => {
    localStorage.setItem('switchToNewTab', 'false');

    expect(Settings.isSwitchToNewTab()).toBeFalsy();
});

it('isBookmarkHidden(someBookmark) must be false by default', () => {
    expect(Settings.isBookmarkHidden('some bookmark')).toBeFalsy();
});

it('isBookmarkHidden(something, chrome bookmark)', () => {
    localStorage.setItem('bookmark_some bookmark', 'true');

    expect(Settings.isBookmarkHidden('some bookmark')).toBeTruthy();
});

it.each(
    [
        ['bodyClr', '#FFFFFF'],
        ['bmBgClr', '#FFFFFF'],
        ['activeBmFntClr', '#FFFFFF'],
        ['fntClr', '#000000'],
        ['activeBmBgClrFrom', '#86ABD9'],
        ['activeBmBgClrTo', '#1F5EAB'],
        ['disabledItemFntClr', '#BEBEBE']
    ]
)('getColor() (default) %p => %p', (name, expectedColor) => {
    const color = Settings.getColor(name);

    expect(color).toBe(expectedColor);
});

it.each(
    [
        ['bodyClr', '#123456'],
        ['bmBgClr', '#654321'],
        ['activeBmFntClr', '#111111'],
        ['fntClr', '#333333'],
        ['activeBmBgClrFrom', '#098765'],
        ['activeBmBgClrTo', '#234567'],
        ['disabledItemFntClr', '#aaaabb']
    ]
)('getColor() with setUp %p => %p', (name, expectedColor) => {
    localStorage[name] = expectedColor;

    const color = Settings.getColor(name);

    expect(color).toBe(expectedColor);
});

it('getColor() with backward compatibility', () => {
    localStorage['fntClr'] = '222';

    expect(Settings.getColor('fntClr')).toBe('#222');
});

it('getColor() with wrong color name', () => {
    expect(() => Settings.getColor('not existed')).toThrowError(
        'Unsupported color: not existed'
    );
});
