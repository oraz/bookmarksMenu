'use strict';

const isWindows = navigator.platform && navigator.platform.startsWith('Win');

export const $ = document.getElementById.bind(document),
  one = document.querySelector.bind(document),
  all = document.querySelectorAll.bind(document);

NodeList.prototype.on = function(evt, callback) {
  this.forEach(el => el.on(evt, callback));
  return this;
};

HTMLElement.prototype.on = HTMLElement.prototype.addEventListener;

HTMLElement.prototype.show = function() {
  this.style.display = 'block';
};

HTMLElement.prototype.hide = function() {
  this.style.display = 'none';
};

export const i18nUtils = {
  init(/** @type HTMLElement */ el) {
    el.appendChild(
      document.createTextNode(chrome.i18n.getMessage(el.dataset.i18n))
    );
    el.removeAttribute('data-i18n');
  },

  initAll(/** @type HTMLElement|Document*/ el = document) {
    el.querySelectorAll('[data-i18n]').forEach(i18nUtils.init);
  }
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
    badge = '';
  }
  chrome.browserAction.setTitle({ title: chrome.i18n.getMessage(title) });
  chrome.browserAction.setBadgeText({ text: badge });
}

export function isBookmarklet(url) {
  return url.startsWith('javascript:');
}

export function getFavicon(url) {
  return url == undefined
    ? '../../icons/' + (isWindows ? 'folder-win.png' : 'folder.png')
    : isBookmarklet(url)
    ? '../../icons/js.png'
    : 'chrome://favicon/' + url;
}
