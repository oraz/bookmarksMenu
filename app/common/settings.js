"use strict";

export const Settings = {

    getButtonAction: btn => {
        return localStorage[btn] || btn;
    },

    getMaxWidth: () => {
        return localStorage['maxWidth'] || 30;
    },

    getMaxWidthMesure: () => {
        return localStorage['maxWidthMesure'] || 'em';
    },

    isBookmarkHidden: (title, useGoogleBookmarks) => {
        return localStorage[(useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title] == 'true';
    },

    isSwitchToNewTab: () => {
        return localStorage['switchToNewTab'] == 'true';
    },

    getFontFamily: () => {
        return localStorage['fontFamily'] || 'Verdana';
    },

    getFontSize: () => {
        return localStorage['fontSize'] || 13;
    },

    getFavIconWidth() {
        return localStorage['favIconWidth'] || 16;
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
        return localStorage['scrollBarWidth'] || '7';
    },

    isUseGoogleBookmarks: () => {
        return localStorage['useGoogleBookmarks'] == 'true';
    },

    getLabelSeparator: () => {
        return localStorage['labelSeparator'] || '>';
    },

    isHideCMModeSwitcher: () => {
        return localStorage['hideCMModeSwitcher'] == 'true';
    },

    isHideCMOpenIncognito: () => {
        return localStorage['hideCMOpenIncognito'] == 'true';
    }
}
