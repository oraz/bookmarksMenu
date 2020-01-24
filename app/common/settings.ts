
function setting(name: string, defaultValue: string): string {
    return localStorage.getItem(name) || defaultValue;
}

function isTrue(name: string, defaultValue: string = 'false'): boolean {
    return setting(name, defaultValue) == 'true';
}

export const Settings = {
    getButtonAction: (btn: string) => setting(btn, btn),

    getMaxWidth: () => setting('maxWidth', '30'),

    getMaxWidthMesure: () => setting('maxWidthMesure', 'em'),

    isBookmarkHidden: (title: string, useGoogleBookmarks: boolean) => isTrue((useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title),

    setBookmarkHidden: (title: string, useGoogleBookmarks: boolean, hidden: boolean) => {
        const key = (useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title;
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
                throw Error('Unsupoorted color: ' + name);
        }
    },

    getScrollBarWidth: () => setting('scrollBarWidth', '7'),

    isUseGoogleBookmarks: () => isTrue('useGoogleBookmarks'),

    getLabelSeparator: () => setting('labelSeparator', '>'),

    isHideCMModeSwitcher: () => isTrue('hideCMModeSwitcher'),

    isHideCMOpenIncognito: () => isTrue('hideCMOpenIncognito')
};
