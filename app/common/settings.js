"use strict";

export class Settings {

    static getButtonAction(btn) {
        return localStorage[btn] || btn;
    }

    static getMaxWidth() {
        return localStorage['maxWidth'] || 30;
    }

    static getMaxWidthMesure() {
        return localStorage['maxWidthMesure'] || 'em';
    }

    static isBookmarkHidden(title, useGoogleBookmarks) {
        return localStorage[(useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title] == 'true';
    }

    static isSwitchToNewTab() {
        return localStorage['switchToNewTab'] == 'true';
    }

    static getFontFamily() {
        return localStorage['fontFamily'] || 'Verdana';
    }

    static getFontSize() {
        return localStorage['fontSize'] || 13;
    }

    static getFavIconWidth() {
        return localStorage['favIconWidth'] || 16;
    }

    static isShowTooltip() {
        return localStorage['showTooltip'] == 'true';
    }

    static isShowURL() {
        return localStorage['showURL'] == 'true';
    }

    static getColor(name) {
        var color = localStorage[name];
        return color ? color.indexOf('#') === 0 ? color : '#' + color
            : name == 'bodyClr' || name == 'bmBgClr' || name == 'activeBmFntClr' ? '#FFFFFF'
                : name == 'fntClr' ? '#000000'
                    : name == 'activeBmBgClrFrom' ? '#86ABD9'
                        : name == 'activeBmBgClrTo' ? '#1F5EAB'
                            : '#BEBEBE'; // disabledItemFntClr
    }

    static getScrollBarWidth() {
        return localStorage['scrollBarWidth'] || '7';
    }

    static isUseGoogleBookmarks() {
        return localStorage['useGoogleBookmarks'] == 'true';
    }

    static getLabelSeparator() {
        return localStorage['labelSeparator'] || '>';
    }

    static isHideCMModeSwitcher() {
        return localStorage['hideCMModeSwitcher'] == 'true';
    }

    static isHideCMOpenIncognito() {
        return localStorage['hideCMOpenIncognito'] == 'true';
    }
}
