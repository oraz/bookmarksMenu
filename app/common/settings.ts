
function setting(name: string, defaultValue: string): string {
    return localStorage.getItem(name) || defaultValue;
}

function setSetting(name: string, value: string) {
    localStorage.setItem(name, value);
}

function clearSetting(name: string) {
    localStorage.removeItem(name);
}

function isTrue(name: string, defaultValue: string = 'false'): boolean {
    return setting(name, defaultValue) == 'true';
}

/* eslint-disable no-unused-vars */
enum Setting {
    MaxWidthMeasure = 'maxWidthMeasure'
}
/* eslint-enable */

/** @VisibleForTesting */
export function _fixSpellInMaxWidthMeasure() {
    // it fixes spell error in setting name. Added on 13.03.2023, should be removed after next release
    const maxWidthMeasureOld = 'maxWidthMesure';
    const value = setting(maxWidthMeasureOld, 'NOT_SET');
    if (value !== 'NOT_SET') {
        clearSetting(maxWidthMeasureOld);
        setSetting(Setting.MaxWidthMeasure, value);
    }
}

_fixSpellInMaxWidthMeasure();

export const Settings = {
    getButtonAction: (btn: string) => setting(btn, btn),

    getMaxWidth: () => setting('maxWidth', '30'),

    getMaxWidthMeasure: () => setting(Setting.MaxWidthMeasure, 'em'),

    setMaxWidthMeasure: (value: string) => setSetting(Setting.MaxWidthMeasure, value),

    resetOptions: () => {
        clearSetting(Setting.MaxWidthMeasure);
    },

    isBookmarkHidden: (title: string) => isTrue('bookmark_' + title),

    setBookmarkHidden: (title: string, hidden: boolean) => {
        const key = 'bookmark_' + title;
        if (hidden) {
            localStorage[key] = true;
        } else {
            localStorage.removeItem(key);
        }
    },

    isSwitchToNewTab: () => isTrue('switchToNewTab'),

    getFontFamily: () => setting('fontFamily', 'Verdana'),

    getFontSize: () => setting('fontSize', '13'),

    getFavIconWidth: () => setting('favIconWidth', '16'),

    isShowTooltip: () => isTrue('showTooltip', 'true'),

    isShowURL: () => isTrue('showURL'),

    getColor: (name: string) => {
        const color = localStorage.getItem(name);
        if (color !== null) {
            return color.startsWith('#') ? color : `#${color}`;
        }
        switch (name) {
            case 'bodyClr':
            case 'bmBgClr':
            case 'activeBmFntClr':
                return '#FFFFFF';
            case 'fntClr':
                return '#000000';
            case 'activeBmBgClrFrom':
                return '#86ABD9';
            case 'activeBmBgClrTo':
                return '#1F5EAB';
            case 'disabledItemFntClr':
                return '#BEBEBE';
            default:
                throw Error('Unsupported color: ' + name);
        }
    },

    getScrollBarWidth: () => setting('scrollBarWidth', '7'),

    isHideCMOpenIncognito: () => isTrue('hideCMOpenIncognito')
};
