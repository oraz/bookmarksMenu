'use strict';

import { changeBookmarkMode, MESSAGES } from '../common/common.js';
import { Settings } from '../common/settings.js';

window.GBookmarksTree = null;

const GBookmarkUrl = 'https://www.google.com/bookmarks/';

function GBookmarkFolder(names, parentFolder) {
  this.children = [];
  if (parentFolder) {
    this.title = names.shift();
    this.id = !parentFolder.isRoot ? parentFolder.id + window.GBookmarksTree.labelSeparator + this.title : this.title;
    parentFolder.addChild(this);
    if (!window.GBookmarksTree.labels) {
      window.GBookmarksTree.labels = [];
    }
    window.GBookmarksTree.labels.push(this.id);
  } else {
    this.isRoot = true;
    this.labelSeparator = Settings.getLabelSeparator();
    return this;
  }
  return names.length > 0 ? new GBookmarkFolder(names, this) : this;
}

GBookmarkFolder.prototype.addChild = function (child) {
  this.children.push(child);
};

GBookmarkFolder.prototype.findFolder = function (fullName) {
  var names = typeof fullName == 'string' ? fullName.split(window.GBookmarksTree.labelSeparator) : fullName;
  var name = names.shift();
  for (var idx = 0, len = this.children.length; idx < len; idx++) {
    var child = this.children[idx];
    if (child.url == undefined && child.title == name) {
      return names.length > 0 ? child.findFolder(names) : child;
    }
  }
  names.unshift(name);
  return new GBookmarkFolder(names, this);
};

GBookmarkFolder.prototype.removeBookmark = function (id) {
  var children = this.children;
  for (var idx = 0, len = children.length; idx < len; idx++) {
    var child = children[idx];
    if (child.id == id) {
      children.splice(idx, 1);
      // remove bookmark from other folders if it's multilabeled
      window.GBookmarksTree.removeBookmark(id);
      return child;
    }
    if (child.children) {
      var bookmark = child.removeBookmark(id);
      if (bookmark) {
        return bookmark;
      }
    }
  }
  return null;
};

GBookmarkFolder.prototype.sort = function () {
  var children = this.children;
  if (children) {
    children.sort(sorting);
    for (var idx = 0, len = children.length; idx < len; idx++) {
      var child = children[idx];
      if (child.children) {
        child.sort();
      }
    }
  }
};

function sorting(b1, b2) {
  if (b1.children && b2.url) {
    return -1;
  }
  if (b2.children && b1.url) {
    return 1;
  }
  var t1 = b1.title,
    t2 = b2.title;
  return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
}

function createBookmark(node) {
  const bm = {
    title: node.querySelector('title').textContent,
    url: node.querySelector('link').textContent,
    id: node.querySelector('bkmk_id').textContent
  };
  const labels = node.querySelectorAll('bkmk_label');
  if (labels.length > 0) {
    for (let idx = labels.length - 1; idx >= 0; idx--) {
      window.GBookmarksTree.findFolder(labels[idx].textContent).addChild(bm);
    }
  } else {
    window.GBookmarksTree.addChild(bm);
  }
}

XMLHttpRequest.prototype.processBookmarks = function () {
  if (this.readyState == 4 && this.status == 200) {
    clearTimeout(this.timeout);
    if (this.responseXML !== null) {
      delete this.timeout;
      window.GBookmarksTree = new GBookmarkFolder();
      window.GBookmarksTree.signature = this.responseXML.querySelector('channel > signature').textContent;
      this.responseXML.querySelectorAll('channel > item').forEach(createBookmark);
      window.GBookmarksTree.sort();
      this.port.postMessage(MESSAGES.RESP_TREE_IS_READY);
      this.port.disconnect();
    } else {
      this.port.postMessage(MESSAGES.RESP_FAILED);
      this.port.disconnect();
    }
  }
};

XMLHttpRequest.prototype.processAbort = function () {
  if (this.port.disconnected) {
    clearTimeout(this.timeout);
  } else {
    this.port.postMessage(MESSAGES.RESP_FAILED);
    this.port.disconnect();
    window.console.error('xhr has been aborted');
  }
};

window.remove = id => {
  var child = window.GBookmarksTree.removeBookmark(id);
  if (child) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', GBookmarkUrl + 'mark?' + 'dlq=' + encodeURIComponent(id) + '&sig=' + encodeURIComponent(window.GBookmarksTree.signature), true);
    xhr.send();
  }
};

function onDisconnect(port) {
  // fired when user closes popup window or options window
  port.disconnected = true;
  port.xhr.abort();
}

function onIncomingMessage(req, port) {
  if (req == MESSAGES.REQ_LOAD_BOOKMARKS && window.GBookmarksTree) {
    port.postMessage(MESSAGES.RESP_TREE_IS_READY);
    port.disconnect();
  } else if ((req == MESSAGES.REQ_LOAD_BOOKMARKS && !window.GBookmarksTree) || req == MESSAGES.REQ_FORCE_LOAD_BOOKMARKS) {
    window.GBookmarksTree = null;
    const xhr = new XMLHttpRequest();
    xhr.port = port;
    port.xhr = xhr;
    port.onDisconnect.addListener(onDisconnect);
    xhr.onreadystatechange = xhr.processBookmarks;
    xhr.onabort = xhr.processAbort;
    /*
                xhr.timeout = setTimeout(function () {
                    xhr.abort();
                }, 10 * 1000);
        */
    xhr.open('GET', GBookmarkUrl + '?output=rss&num=10000', true);
    xhr.send();
  } else if (req == MESSAGES.REQ_GET_TREE_STATUS) {
    port.postMessage(window.GBookmarksTree ? MESSAGES.RESP_TREE_IS_READY : MESSAGES.RESP_NEED_TO_LOAD);
    if (window.GBookmarksTree) {
      port.disconnect();
    }
  } else if (req.msg == MESSAGES.REQ_ADD_GOOGLE_BOOKMARK) {
    const xhr = new XMLHttpRequest();
    port.onDisconnect.addListener(function () {
      port.disconnected = true;
    });
    const label = req.label
      .replace(/(^\s+)|(\s+$)/g, '')
      .replace(/\s*,\s*/g, ',')
      .replace(/,{2,}/g, ',')
      .replace(/(^,)|(,$)/g, '');
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var bm = {
          title: req.title,
          url: req.url,
          id: xhr.responseText
        };
        if (label == '') {
          window.GBookmarksTree.addChild(bm);
        } else {
          const labels = label.split(',');
          const proceededLabels = [];
          for (let idx = labels.length - 1; idx >= 0; idx--) {
            let proceeded = false;
            for (let pIdx = proceededLabels.length - 1; pIdx >= 0; pIdx--) {
              if (proceededLabels[pIdx] == labels[idx]) {
                proceeded = true;
                break;
              }
            }
            if (!proceeded) {
              window.GBookmarksTree.findFolder(labels[idx]).addChild(bm);
              proceededLabels.push(labels[idx]);
            }
          }
        }
        window.GBookmarksTree.sort();
        if (!port.disconnected) {
          port.postMessage(MESSAGES.RESP_TREE_IS_READY);
          port.disconnect();
        }
      }
    };
    xhr.open('POST', GBookmarkUrl + 'mark', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(
      'bkmk=' +
      encodeURIComponent(req.url) + //
      '&title=' +
      encodeURIComponent(req.title) +
      '&labels=' +
      encodeURIComponent(label) +
      '&sig=' +
      encodeURIComponent(window.GBookmarksTree.signature)
    );
  }
}

function showOptionsPageOnce() {
  const version = chrome.runtime.getManifest().version;
  if (localStorage.getItem('optionsPageIsShownFor') !== version &&
    localStorage.getItem('optionsPageIsShownFor') !== '2020.02.02') {
    localStorage.setItem('optionsPageIsShownFor', version);
    chrome.runtime.openOptionsPage();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.browserAction.setBadgeBackgroundColor({ color: [24, 135, 185, 255] });
  changeBookmarkMode(Settings.isUseGoogleBookmarks());
  chrome.extension.onConnect.addListener(function (port) {
    port.onMessage.addListener(onIncomingMessage);
  });

  showOptionsPageOnce();
});
