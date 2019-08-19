"use strict";

function setting(name, defaultValue) {
    return localStorage.getItem(name) || defaultValue;
}

function isTrue(name) {
    return setting(name) == 'true';
}

export const Settings = {

    getButtonAction: btn => setting(btn, btn),

    getMaxWidth: () => setting('maxWidth', 30),

    getMaxWidthMesure: () => setting('maxWidthMesure', 'em'),

    isBookmarkHidden: (title, useGoogleBookmarks) => isTrue((useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title),

    isSwitchToNewTab: () => isTrue('switchToNewTab'),

    getFontFamily: () => setting('fontFamily', 'Verdana'),

    getFontSize: () => setting('fontSize', 13),

    getFavIconWidth: () => setting('favIconWidth', 16),

    isShowTooltip: () => setting('showTooltip') == 'true',

    isShowURL: () => isTrue('showURL'),

    getColor: name => {
        var color = localStorage[name];
        return color ? color.indexOf('#') === 0 ? color : '#' + color
            : name == 'bodyClr' || name == 'bmBgClr' || name == 'activeBmFntClr' ? '#FFFFFF'
                : name == 'fntClr' ? '#000000'
                    : name == 'activeBmBgClrFrom' ? '#86ABD9'
                        : name == 'activeBmBgClrTo' ? '#1F5EAB'
                            : '#BEBEBE'; // disabledItemFntClr
    },

    getScrollBarWidth: () => setting('scrollBarWidth', '7'),

    isUseGoogleBookmarks: () => isTrue('useGoogleBookmarks'),

    getLabelSeparator: () => setting('labelSeparator', '>'),

    isHideCMModeSwitcher: () => isTrue('hideCMModeSwitcher'),

    isHideCMOpenIncognito: () => isTrue('hideCMOpenIncognito')
};