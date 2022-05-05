'use strict';

function removeUnusedConfig() {
  localStorage.removeItem('useGoogleBookmarks');
  localStorage.removeItem('labelSeparator');
  localStorage.removeItem('hideCMModeSwitcher');
  const keys = new Set();
  for (var i = 0, len = localStorage.length; i < len; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('g_bookmark_')) {
      keys.add(key);
    }
  }
  keys.forEach(each => localStorage.removeItem(each));
}

function showOptionsPageOnce() {
  const version = chrome.runtime.getManifest().version;
  if (localStorage.getItem('optionsPageIsShownFor') !== version) {
    removeUnusedConfig();
    localStorage.setItem('optionsPageIsShownFor', version);
    chrome.runtime.openOptionsPage();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  showOptionsPageOnce();
});
