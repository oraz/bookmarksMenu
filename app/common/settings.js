'use strict';

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

  isBookmarkHidden: (title, useGoogleBookmarks) =>
    isTrue((useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title),

  setBookmarkHidden: (/** @type String */title, /** @type Boolean */useGoogleBookmarks, /** @type Boolean */hidden) => {
    const key = (useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title;
    if (hidden) {
      localStorage.setItem(key, true);
    } else {
      localStorage.removeItem(key);
    }
  },

  isSwitchToNewTab: () => isTrue('switchToNewTab'),

  getFontFamily: () => setting('fontFamily', 'Verdana'),

  getFontSize: () => setting('fontSize', 13),

  getFavIconWidth: () => setting('favIconWidth', 16),

  isShowTooltip: () => setting('showTooltip') == 'true',

  isShowURL: () => isTrue('showURL'),

  getColor: name => {
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
