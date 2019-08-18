"use strict";

function setting(name, defaultValue) {
    return localStorage.getItem(name) || defaultValue;
}

export const Settings = {

    getButtonAction: btn => {
        return setting(btn, btn);
    },

    getMaxWidth: () => {
        return setting('maxWidth', 30);
    },

    getMaxWidthMesure: () => {
        return setting('maxWidthMesure', 'em');
    },

    isBookmarkHidden: (title, useGoogleBookmarks) => {
        return localStorage[(useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title] == 'true';
    },

    isSwitchToNewTab: () => {
        return localStorage['switchToNewTab'] == 'true';
    },

    getFontFamily: () => {
        return setting('fontFamily', 'Verdana');
    },

    getFontSize: () => {
        return setting('fontSize', 13);
    },

    getFavIconWidth() {
        return setting('favIconWidth', 16);
    },

    isShowTooltip: () => {
        return localStorage['showTooltip'] == 'true';
    },

    isShowURL: () => {
        return localStorage['showURL'] == 'true';
    },

    getColor: name => {
        var color = localStorage[name];
        return color ? color.indexOf('#') === 0 ? color : '#' + color
            : name == 'bodyClr' || name == 'bmBgClr' || name == 'activeBmFntClr' ? '#FFFFFF'
                : name == 'fntClr' ? '#000000'
                    : name == 'activeBmBgClrFrom' ? '#86ABD9'
                        : name == 'activeBmBgClrTo' ? '#1F5EAB'
                            : '#BEBEBE'; // disabledItemFntClr
    },

    getScrollBarWidth: () => {
        return setting('scrollBarWidth', '7');
    },

    isUseGoogleBookmarks: () => {
        return localStorage['useGoogleBookmarks'] == 'true';
    },

    getLabelSeparator: () => {
        return setting('labelSeparator', '>');
    },

    isHideCMModeSwitcher: () => {
        return localStorage['hideCMModeSwitcher'] == 'true';
    },

    isHideCMOpenIncognito: () => {
        return localStorage['hideCMOpenIncognito'] == 'true';
    }
}
