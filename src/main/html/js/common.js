'use strict';

navigator.isWindows = navigator.platform && navigator.platform.indexOf('Win') == 0;

var $ = document.getElementById.bind(document),
    one = document.querySelector.bind(document),
    all = document.querySelectorAll.bind(document);

NodeList.prototype.forEach = function (func, scope) {
    for (var idx = 0, len = this.length; idx < len; idx++) {
        func.call(scope || this[idx], this[idx], idx);
    }
};

NodeList.prototype.on = function (evt, callback) {
    this.forEach(function () {
        this.on(evt, callback);
    });
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
    el.appendChild(document.createTextNode(chrome.i18n.getMessage(el.getAttribute('i18n'))));
    el.removeAttribute('i18n');
};

chrome.i18n.initAll = function (el) {
    (el ? el : document).querySelectorAll('[i18n]').forEach(this.initElement);
};

var MESSAGES = {
    REQ_LOAD_BOOKMARKS:1,
    REQ_FORCE_LOAD_BOOKMARKS:2,
    REQ_GET_TREE_STATUS:3,
    REQ_ADD_GOOGLE_BOOKMARK:4,
    RESP_TREE_IS_READY:200,
    RESP_NEED_TO_LOAD:201,
    RESP_FAILED:400
};

function changeBookmarkMode(useGoogleBookmarks) {
    var title, badge;
    if (useGoogleBookmarks) {
        title = 'extTitleGoogle';
        badge = 'G';
    } else {
        title = 'extTitle';
        badge = '';
    }
    chrome.browserAction.setTitle({ title:chrome.i18n.getMessage(title) });
    chrome.browserAction.setBadgeText({ text:badge });
}

function isBookmarklet(url) {
    return url.substr(0, 11) == 'javascript:';
}

function getFavicon(url, serviceId) {
    return url == undefined ? 'icons/' + (navigator.isWindows ? 'folder-win.png' : 'folder.png')
        : isBookmarklet(url) ? 'icons/js.png'
        : url.substr(0, 5) == 'file:' ? 'icons/html.png'
        : serviceId == 2 ? 'http://getfavicon.appspot.com/' + url
        : 'chrome://favicon/' + url;
}

function addButtonCSS() {
    if (navigator.isWindows) {
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', 'css/button.css');
        one('html > head').appendChild(link);
    }
}
