"use strict";

navigator.isWindows = navigator.platform && navigator.platform.indexOf('Win') == 0;

export const $ = document.getElementById.bind(document),
    one = document.querySelector.bind(document),
    all = document.querySelectorAll.bind(document);

NodeList.prototype.on = function (evt, callback) {
    this.forEach(el => el.on(evt, callback));
    return this;
};

HTMLElement.prototype.on = HTMLElement.prototype.addEventListener;

HTMLElement.prototype.show = function () {
    this.style.display = 'block';
};

HTMLElement.prototype.hide = function () {
    this.style.display = 'none';
};

chrome.i18n.initElement = function (el) {
    el.appendChild(document.createTextNode(chrome.i18n.getMessage(el.getAttribute('data-i18n'))));
    el.removeAttribute('data-i18n');
};

chrome.i18n.initAll = function (el) {
    (el ? el : document).querySelectorAll('[data-i18n]').forEach(this.initElement);
};

export const MESSAGES = {
    REQ_LOAD_BOOKMARKS: 1,
    REQ_FORCE_LOAD_BOOKMARKS: 2,
    REQ_GET_TREE_STATUS: 3,
    REQ_ADD_GOOGLE_BOOKMARK: 4,
    RESP_TREE_IS_READY: 200,
    RESP_NEED_TO_LOAD: 201,
    RESP_FAILED: 400
};

export function changeBookmarkMode(useGoogleBookmarks) {
    var title, badge;
    if (useGoogleBookmarks) {
        title = 'extTitleGoogle';
        badge = 'G';
    } else {
        title = 'extTitle';
        badge = 'D';
    }
    chrome.browserAction.setTitle({ title: chrome.i18n.getMessage(title) });
    chrome.browserAction.setBadgeText({ text: badge });
}

export function isBookmarklet(url) {
    return url.startsWith('javascript:');
}

export function getFavicon(url) {
    return url == undefined ? '../../icons/' + (navigator.isWindows ? 'folder-win.png' : 'folder.png')
        : isBookmarklet(url) ? '../../icons/js.png'
            : url.startsWith('file:') ? '../../icons/html.png'
                : 'chrome://favicon/' + url;
}

export function addButtonCSS() {
    if (navigator.isWindows) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', 'css/button.css');
        one('html > head').appendChild(link);
    }
}
