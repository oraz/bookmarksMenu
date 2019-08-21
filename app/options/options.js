'use strict';

import { $, all, one, changeBookmarkMode, MESSAGES, addButtonCSS, getFavicon } from '../common/common.js';
import { Settings } from '../common/settings.js';

function setMouseButtonAction(/** @type {Event} */ evt) {
    const el = evt.target;
    localStorage[parseInt(el.getAttribute('data-button-number'))] = el.selectedIndex;
}

function setIntProperty() {
    /* jshint validthis: true */
    if (this.validity.valid) {
        localStorage[this.id] = this.value;
    }
}

function setBoolProperty() {
    /* jshint validthis: true */
    localStorage[this.id] = this.checked;
}

function setFontFamily() {
    /* jshint validthis: true */
    localStorage.setItem('fontFamily', this.value);
}

function setMenuMaxWidthMesure() {
    /* jshint validthis: true */
    localStorage.setItem('maxWidthMesure', this.value);
}

function setBookmarkHidden(title, useGoogleBookmarks, hidden) {
    const key = (useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title;
    if (hidden == true) {
        localStorage[key] = true;
    } else {
        delete localStorage[key];
    }
}

function setColor() {
    /* jshint validthis: true */
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        localStorage[this.id] = this.value;
    }
}

function setUseGoogleBookmarks(useGoogleBookmarks) {
    localStorage.setItem('useGoogleBookmarks', useGoogleBookmarks);
    $('chromeBookmarksSettings').style.display = useGoogleBookmarks ? 'none' : 'block';
    $('googleBookmarksSettings').style.display = useGoogleBookmarks ? 'block' : 'none';
    changeBookmarkMode(useGoogleBookmarks);
    if (useGoogleBookmarks) {
        clearGoogleBookmarksDiv();
        const port = chrome.extension.connect();
        port.onMessage.addListener(processResponse);
        port.postMessage(MESSAGES.REQ_GET_TREE_STATUS);
    }
}

function clearGoogleBookmarksDiv() {
    const gbookmarksSettings = $('googleBookmarksSettings');
    gbookmarksSettings.querySelector('div.bookmark').hide();
    gbookmarksSettings.querySelectorAll('div.gbookmark').forEach(each => each.parentElement.removeChild(each));
}

function selectAllBookmarks() {
    /* jshint validthis: true */
    const checked = this.checked;
    this.parentElement.parentElement.parentElement.querySelectorAll('input[type="checkbox"]').forEach((chk, idx) => {
        if (idx > 0) {
            chk.checked = checked;
            const evt = document.createEvent("HTMLEvents");
            evt.initEvent('change', true, true);
            chk.dispatchEvent(evt);
        }
    });
}

function addBookmark(divSettings, bookmark, useGoogleBookmarks) {
    var div = document.createElement('div');
    div.setAttribute('class', useGoogleBookmarks ? 'gbookmark' : 'bookmark');

    var checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    if (!Settings.isBookmarkHidden(bookmark.title, useGoogleBookmarks)) {
        checkbox.setAttribute('checked', 'checked');
    }
    checkbox.onchange = function () {
        setBookmarkHidden(bookmark.title, useGoogleBookmarks, !this.checked);
    };

    var label = document.createElement('label');
    label.appendChild(checkbox);

    var img = document.createElement('img');
    img.setAttribute('class', 'favicon');
    img.setAttribute('src', getFavicon(bookmark.url));
    label.appendChild(img);
    label.appendChild(document.createTextNode(bookmark.title));
    div.appendChild(label);
    divSettings.appendChild(div);
}

function processResponse(response, port) {
    if (response == MESSAGES.RESP_NEED_TO_LOAD) {
        $('loadingError').hide();
        $('loading').show();
        port.postMessage(MESSAGES.REQ_LOAD_BOOKMARKS);
    } else if (response == MESSAGES.RESP_TREE_IS_READY) {
        $('loading').hide();
        const GBookmarksTree = chrome.extension.getBackgroundPage().GBookmarksTree;
        const googleBookmarksSettings = $('googleBookmarksSettings');
        googleBookmarksSettings.querySelector('div.bookmark').show();
        GBookmarksTree.children.forEach(bookmark => addBookmark(googleBookmarksSettings, bookmark, true));
    } else if (response == MESSAGES.RESP_FAILED) {
        $('loading').hide();
        $('loadingError').show();
    }
}

function setLabelSeparator() {
    /* jshint validthis: true */
    if (this.validity.valid && this.value != Settings.getLabelSeparator()) {
        localStorage.setItem('labelSeparator', this.value);
        clearGoogleBookmarksDiv();
        $('loadingError').hide();
        $('loading').show();
        const port = chrome.extension.connect();
        port.onMessage.addListener(processResponse);
        port.postMessage(MESSAGES.REQ_FORCE_LOAD_BOOKMARKS);
    }

}

function showTab() {
    /* jshint validthis: true */
    const currentTab = this.parentNode.querySelector('li.fgTab');
    currentTab.setAttribute('class', 'bgTab');
    $(currentTab.dataset.tab).hide();
    this.setAttribute('class', 'fgTab');
    $(this.dataset.tab).show();
}

function resetWindowSettings() {
    localStorage.removeItem('fontFamily');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('favIconWidth');
    localStorage.removeItem('maxWidth');
    localStorage.removeItem('maxWidthMesure');
    localStorage.removeItem('scrollBarWidth');
    localStorage.removeItem('showTooltip');
    localStorage.removeItem('showURL');
    localStorage.removeItem('hideCMOpenIncognito');
    localStorage.removeItem('hideCMModeSwitcher');
    all('input[type=color]').forEach(el => localStorage.removeItem(el.id));
    initWindowSettingsTab();
}

HTMLSelectElement.prototype.selectByValue = function (value) {
    this.selectedIndex = document.evaluate('count(option[@value="' + value + '"]/preceding-sibling::option)',
        this, null, XPathResult.NUMBER_TYPE, null).numberValue;
};

function initWindowSettingsTab() {
    $('version').innerHTML = chrome.i18n.getMessage('version', chrome.runtime.getManifest().version);
    $('fontFamily').selectByValue(Settings.getFontFamily());
    $('fontSize').value = Settings.getFontSize();
    $('favIconWidth').value = Settings.getFavIconWidth();
    $('maxWidth').value = Settings.getMaxWidth();
    $('maxWidthMesure').selectByValue(Settings.getMaxWidthMesure());
    $('scrollBarWidth').value = Settings.getScrollBarWidth();
    $('showTooltip').checked = Settings.isShowTooltip();
    $('showURL').checked = Settings.isShowURL();
    $('hideCMOpenIncognito').checked = Settings.isHideCMOpenIncognito();
    $('hideCMModeSwitcher').checked = Settings.isHideCMModeSwitcher();
    all('input[type=color]').forEach(el => el.value = Settings.getColor(el.id));
}

document.addEventListener("DOMContentLoaded", () => {
    all('#tabs > li').on('click', showTab);
    $('useChromeBookmarks').on('click', () => setUseGoogleBookmarks(false));
    $('useGoogleBookmarks').on('click', () => setUseGoogleBookmarks(true));

    all('.selectAllBookmarks').on('click', selectAllBookmarks);

    all('#uiConfig input[type=number]').on('input', setIntProperty);

    all('#uiConfig input[type=checkbox], #switchToNewTab').on('change', setBoolProperty);
    all('#uiConfig input[type=color]').on('change', setColor);
    all('#mouseConfig select').on('change', setMouseButtonAction);

    $('resetWindowSettings').on('click', resetWindowSettings);
    $('fontFamily').on('change', setFontFamily);
    $('maxWidthMesure').on('change', setMenuMaxWidthMesure);
    $('labelSeparator').on('input', setLabelSeparator);
    addButtonCSS();
    chrome.i18n.initAll();
    showTab.apply(one('li.fgTab'));

    // init Bookmarks tab
    const useGoogleBookmarks = Settings.isUseGoogleBookmarks();
    $(useGoogleBookmarks ? 'useGoogleBookmarks' : 'useChromeBookmarks').checked = true;
    setUseGoogleBookmarks(useGoogleBookmarks);
    $('labelSeparator').value = Settings.getLabelSeparator();
    chrome.bookmarks.getTree(nodes => {
        const chromeBookmarksSettings = $('chromeBookmarksSettings');
        nodes[0].children.slice(0, 2).forEach(child => {
            child.children.forEach(bookmark => addBookmark(chromeBookmarksSettings, bookmark, false));
        });
    });

    initWindowSettingsTab();

    // init Mouse tab
    for (let idx = 0; idx < 3; idx++) {
        $('btn' + idx).selectedIndex = Settings.getButtonAction(idx);
    }

    if (Settings.isSwitchToNewTab()) {
        $('switchToNewTab').checked = true;
    }

    chrome.fontSettings.getFontList(function (fonts) {
        const fontList = $('fontFamily').options,
            defaultFont = Settings.getFontFamily();
        fonts.forEach(each => {
            fontList.add(new Option(each.displayName, each.fontId, false, each.fontId === defaultFont));
        });
    });

    const lang = chrome.i18n.getUILanguage();
    if (lang.startsWith('ru')) {
        $('currency_code').selectedIndex = 1;
        $('paypal_locale').value = 'ru_RU';
    } else if (lang.startsWith('en')) {
        $('currency_code').selectedIndex = 2;
    } else if (lang.startsWith('de')) {
        $('paypal_locale').value = 'de_DE';
    } else if (lang.startsWith('fr')) {
        $('paypal_locale').value = 'fr_FR';
    } else if (lang.startsWith('es')) {
        $('paypal_locale').value = 'es_ES';
    }
});
