'use strict';

import { $, all, one, getFavicon, i18nUtils, E } from '../common/common.js';
import { Settings } from '../common/settings.js';
import { getCurrency } from './options_ts.js';

function setMouseButtonAction(/** @type {Event} */ evt) {
    const el = evt.target;
    localStorage[parseInt(el.getAttribute('data-button-number'))] = el.selectedIndex;
}

function setIntProperty() {
    if (this.validity.valid) {
        localStorage[this.id] = this.value;
    }
}

function setBoolProperty() {
    localStorage[this.id] = this.checked;
}

function setFontFamily() {
    localStorage.setItem('fontFamily', this.value);
}

function setMenuMaxWidthMeasure() {
    Settings.setMaxWidthMeasure(this.value);
}

function setColor() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        localStorage[this.id] = this.value;
    }
}

function selectAllBookmarks() {
    const checked = this.checked;
    this.parentElement.parentElement.parentElement.querySelectorAll('input[type="checkbox"]').forEach((chk, idx) => {
        if (idx > 0) {
            chk.checked = checked;
            const evt = document.createEvent('HTMLEvents');
            evt.initEvent('change', true, true);
            chk.dispatchEvent(evt);
        }
    });
}

function addBookmark(divSettings, bookmark) {
    var div = document.createElement('div');
    div.setAttribute('class', 'bookmark');

    var checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    if (!Settings.isBookmarkHidden(bookmark.title)) {
        checkbox.setAttribute('checked', 'checked');
    }
    checkbox.onchange = function () {
        Settings.setBookmarkHidden(bookmark.title, !this.checked);
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

function showTab() {
    const currentTab = this.parentNode.querySelector('li.fgTab');
    currentTab.setAttribute('class', 'bgTab');
    E.hide($(currentTab.dataset.tab));
    this.setAttribute('class', 'fgTab');
    E.show($(this.dataset.tab));
}

function resetWindowSettings() {
    Settings.resetOptions();
    localStorage.removeItem('fontFamily');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('favIconWidth');
    localStorage.removeItem('maxWidth');
    localStorage.removeItem('scrollBarWidth');
    localStorage.removeItem('showTooltip');
    localStorage.removeItem('showURL');
    localStorage.removeItem('hideCMOpenIncognito');
    all('input[type=color]').forEach(el => localStorage.removeItem(el.id));
    initWindowSettingsTab();
}

HTMLSelectElement.prototype.selectByValue = function (value) {
    this.selectedIndex = document.evaluate('count(option[@value="' + value + '"]/preceding-sibling::option)', this, null, XPathResult.NUMBER_TYPE, null).numberValue;
};

function initWindowSettingsTab() {
    $('version').innerHTML = chrome.i18n.getMessage('version', chrome.runtime.getManifest().version);
    $('fontFamily').selectByValue(Settings.getFontFamily());
    $('fontSize').value = Settings.getFontSize();
    $('favIconWidth').value = Settings.getFavIconWidth();
    $('maxWidth').value = Settings.getMaxWidth();
    $('maxWidthMeasure').selectByValue(Settings.getMaxWidthMeasure());
    $('scrollBarWidth').value = Settings.getScrollBarWidth();
    $('showTooltip').checked = Settings.isShowTooltip();
    $('showURL').checked = Settings.isShowURL();
    $('hideCMOpenIncognito').checked = Settings.isHideCMOpenIncognito();
    all('input[type=color]').forEach(el => (el.value = Settings.getColor(el.id)));
}

document.addEventListener('DOMContentLoaded', () => {
    all('#tabs > li').on('click', showTab);

    all('.selectAllBookmarks').on('click', selectAllBookmarks);

    all('#uiConfig input[type=number]').on('input', setIntProperty);

    all('#uiConfig input[type=checkbox], #switchToNewTab').on('change', setBoolProperty);
    all('#uiConfig input[type=color]').on('change', setColor);
    all('#mouseConfig select').on('change', setMouseButtonAction);

    $('resetWindowSettings').on('click', resetWindowSettings);
    $('fontFamily').on('change', setFontFamily);
    $('maxWidthMeasure').on('change', setMenuMaxWidthMeasure);

    i18nUtils.initAll();
    showTab.apply(one('li.fgTab'));

    chrome.bookmarks.getTree(nodes => {
        const chromeBookmarksSettings = $('chromeBookmarksSettings');
        nodes[0].children.slice(0, 2).forEach(child => {
            child.children.forEach(bookmark => addBookmark(chromeBookmarksSettings, bookmark));
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

    chrome.i18n.getAcceptLanguages(acceptLanguages => {
        const chromeLang = chrome.i18n.getUILanguage().toLowerCase();

        $('currency_code').value = getCurrency(chromeLang, acceptLanguages);
    });
});
