'use strict';

import { $, all, changeBookmarkMode, MESSAGES, getFavicon, isBookmarklet, i18nUtils, E } from '../common/common.js';
import { Settings } from '../common/settings.js';

const config = {
  winMaxWidth: 800,
  winMaxHeight: 600,
  showTooltip: Settings.isShowTooltip(),
  showURL: Settings.isShowURL(),
  useGoogleBookmarks: Settings.isUseGoogleBookmarks()
};

class Bookmark extends HTMLLIElement {
  init(bookmarkNode) {
    if (config.useGoogleBookmarks) {
      this.id = Bookmark.autoId++;
      this.setAttribute('gid', bookmarkNode.id);
    } else {
      this.id = bookmarkNode.id;
      this.parentFolderId = bookmarkNode.parentId;
    }

    this.bookmarkTitle = bookmarkNode.title;

    if (bookmarkNode.url === undefined) {
      const span = document.createElement('span');
      Bookmark.addFaviconAndTitle(bookmarkNode, span);
      this.appendChild(span);
      this.classList.add('folder');
      this.isFolder = true;
      this.childBookmarks = bookmarkNode.children;
      this.onmouseover = this.displayFolderContent;
    } else {
      Bookmark.addFaviconAndTitle(bookmarkNode, this);
      this.classList.add('bookmark');
      this.isBookmark = true;
      this.url = bookmarkNode.url;
      this.onmouseover = this.highlight;
    }
  }

  static addFaviconAndTitle(bookmarkNode, /** @type Node */ target) {
    const favicon = document.createElement('img');
    favicon.src = getFavicon(bookmarkNode.url);
    target.appendChild(favicon);
    target.appendChild(document.createTextNode(bookmarkNode.title));
  }

  highlight() {
    this.unHighlightActiveFolder();
    if (this.isFolder) {
      this.classList.add('hover');
      const span = this.firstChild;
      if (config.showTooltip && span.title == '' && span.offsetWidth < span.scrollWidth) {
        span.title = this.bookmarkTitle;
      }
    } else {
      if ((config.showTooltip || config.showURL) && this.title == '') {
        if (config.showTooltip && this.offsetWidth < this.scrollWidth) {
          this.title = this.bookmarkTitle;
        }
        if (config.showURL && this.isBookmark) {
          this.title += (this.title == '' ? '' : '\n') + this.url;
        }
      }
    }
  }

  unHighlight() {
    this.classList.remove('hover');
  }

  unHighlightActiveFolder() {
    let activeFolder = this.rootFolder.activeFolder;
    if (activeFolder != undefined) {
      const parentFolderId = this.parentFolder.id;
      while (activeFolder != undefined && activeFolder.id != parentFolderId) {
        activeFolder.unHighlight();
        activeFolder.folderContent.style.top = '-1px';
        activeFolder = activeFolder.parentFolder;
      }
    }
  }

  fillFolder() {
    /** @type FolderContent */
    this.folderContent = document.createElement('ul', {
      is: 'ext-folder-content'
    });
    this.appendChild(this.folderContent);
    this.folderContent.fillFolderContent(this.childBookmarks);
    this.folderContent.childBookmarks = this.childBookmarks;
    this.childBookmarks = undefined;
    if (!this.hasSubFolders) {
      this.fillTreeDepth();
    }
  }

  fillTreeDepth() {
    if (!this.isRoot && this.treeDepth == undefined) {
      let treeDepth = 1;
      this.treeDepth = treeDepth;
      let parentFolder = this.parentFolder;
      while (!parentFolder.isRoot && (parentFolder.treeDepth == undefined || treeDepth > parentFolder.treeDepth)) {
        parentFolder.treeDepth = ++treeDepth;
        parentFolder = parentFolder.parentFolder;
      }
    }
  }

  open() {
    const url = this.url;
    if (isBookmarklet(url)) {
      chrome.tabs.executeScript({ code: decodeURI(url.substr(11)) });
    } else {
      chrome.tabs.update({ url: url });
    }
    closePopup();
  }

  openInNewTab(switchToNewTab) {
    chrome.tabs.create({
      url: this.url,
      active: switchToNewTab || Settings.isSwitchToNewTab()
    });
    closePopup();
  }

  openInNewWindow(incognito = false) {
    chrome.windows.create({ url: this.url, incognito: incognito });
    closePopup();
  }

  openInIncognitoWindow() {
    this.openInNewWindow(true);
  }

  getY() {
    const body = document.body;
    return this.getBoundingClientRect().top + body.scrollTop - body.clientTop;
  }

  displayFolderContent() {
    if (this.classList.contains('hover')) {
      return;
    }
    this.highlight();
    this.rootFolder.activeFolder = this;
    if (this.childBookmarks !== undefined) {
      this.fillFolder();
    }

    const body = document.body;
    const bodyStyle = body.style;
    const posY = this.getY();
    const contentHeight = this.folderContent.offsetHeight;
    let offset = 1;
    if (posY + contentHeight > body.scrollTop + config.winMaxHeight) {
      offset = posY + 1 + contentHeight - config.winMaxHeight - body.scrollTop;
      if (offset > posY - body.scrollTop) {
        offset = posY - body.scrollTop;
      }
      this.folderContent.style.top = '-' + offset + 'px';
    }

    var width = 0,
      tmp = this;
    do {
      width += tmp.clientWidth + 1;
      tmp = tmp.parentFolder;
    } while (!tmp.isRoot);
    if (width < config.winMaxWidth && this.treeDepth > 1) {
      var contentWidth = (config.winMaxWidth - width) / this.treeDepth;
      if (contentWidth < this.folderContent.clientWidth) {
        this.folderContent.style.width = contentWidth + 'px';
      }
    }
    // Since using html5 doctype we retreive the width of vscrollbar from computed styles
    width += this.folderContent.offsetWidth + parseInt(window.getComputedStyle(body).marginRight);
    if (width <= config.winMaxWidth && body.clientWidth < width) {
      bodyStyle.width = width + 'px';
    } else if (width > config.winMaxWidth) {
      bodyStyle.width = config.winMaxWidth + 'px';
      this.folderContent.style.width = this.folderContent.clientWidth - (width - config.winMaxWidth) + 'px';
    }
  }

  showContextMenu(ev) {
    const contextMenu = $('contextMenu');
    if (!contextMenu.initialized) {
      i18nUtils.initAll(contextMenu);
      contextMenu.initialized = true;

      if (Settings.isHideCMOpenIncognito()) {
        contextMenu.querySelectorAll('li[data-action="openInIncognitoWindow"], li[data-action="openAllInIncognitoWindow"]').forEach(E.hide);
      }
      if (Settings.isHideCMModeSwitcher()) {
        if (!config.useGoogleBookmarks) {
          E.hide(contextMenu.querySelector('li[data-action="useGoogleBookmarks"]'));
          E.hide(contextMenu.querySelectorAll('li.separator')[1]);
        } else {
          E.hide(contextMenu.querySelector('li[data-action="useChromeBookmarks"]'));
        }
      }
    }
    contextMenu.classList.toggle('forGoogleBookmarks', config.useGoogleBookmarks);
    contextMenu.classList.toggle('forChromeBookmarks', !config.useGoogleBookmarks);

    contextMenu.selectedBookmark = this;
    contextMenu.setAttribute('for', this.classList.contains('bookmark') ? 'bookmark' : 'folder');
    if (this.isFolder) {
      const hasBookmarks = this.hasBookmarks;
      contextMenu.querySelectorAll('.forFolder').forEach(each => each.classList.toggle('enabled', hasBookmarks));
    }

    contextMenu.querySelector('li[data-action="reorder"]').classList.toggle('enabled', this.canBeReordered);
    contextMenu.querySelector('li[data-action="remove"]').classList.toggle('enabled', this.isBookmark || this.isEmptyFolder);
    E.show(contextMenu);

    const body = document.body;
    let bodyWidth = body.clientWidth;
    const contextMenuStyle = contextMenu.style;
    const contextMenuWidth = contextMenu.clientWidth + 3; // 3 is a border size
    const scrollBarWidth = body.offsetWidth - body.clientWidth;
    if (ev.clientX + contextMenuWidth >= body.clientWidth) {
      if (ev.clientX > contextMenuWidth) {
        contextMenuStyle.left = ev.clientX - contextMenuWidth + 'px';
      } else {
        bodyWidth += contextMenuWidth - ev.clientX;
        body.style.width = bodyWidth + scrollBarWidth + 'px';
        contextMenuStyle.left = '1px';
      }
    } else {
      contextMenuStyle.left = ev.clientX + 'px';
    }

    if (ev.clientY + contextMenu.clientHeight > body.clientHeight) {
      if (contextMenu.clientHeight > body.clientHeight || ev.clientY < contextMenu.clientHeight) {
        const bodyHeight = ev.clientY + contextMenu.clientHeight + 5;
        body.style.height = bodyHeight + 'px';
        contextMenuStyle.top = ev.clientY + 'px';
      } else {
        contextMenuStyle.top = ev.clientY + body.scrollTop - contextMenu.clientHeight + 'px';
      }
    } else {
      contextMenuStyle.top = ev.clientY + body.scrollTop + 'px';
    }

    const transparentLayer = $('transparentLayer');
    transparentLayer.style.right = (scrollBarWidth > 0 ? 1 : 0) + 'px';
    E.show(transparentLayer);
  }

  get isEmptyFolder() {
    return this.isFolder && this.folderContent.childBookmarks.length === 0;
  }

  get canBeReordered() {
    /** @type FolderContent */
    const folderContent = this.parentElement;
    return folderContent.canBeReordered;
  }

  get hasBookmarks() {
    return this.isFolder && this.folderContent.childBookmarks.some(bookmark => bookmark.url !== undefined);
  }
}
customElements.define('ext-bookmark', Bookmark, { extends: 'li' });
Bookmark.autoId = 1; // id for google bookmarks

class OpenAllItem extends HTMLLIElement {
  static create(/** @type FolderContent */ containingFolderContent) {
    /**@type OpenAllItem */
    const openAll = document.createElement('li', { is: 'ext-open-all' });
    openAll._init(containingFolderContent);
    return openAll;
  }

  _init(/** @type FolderContent */ containingFolderContent) {
    this.containingFolderContent = containingFolderContent;
    this.classList.add('openAllInTabs', 'noicon');
    this.appendChild(document.createTextNode(chrome.i18n.getMessage('openAllInTabs')));
    this.onmouseup = this._onClick;
    this.onmouseover = this._onMouseOver;
  }

  _onClick(/** @type MouseEvent */evt) {
    evt.stopImmediatePropagation();
    const action = parseInt(Settings.getButtonAction(evt.button));
    if (action === 0) {
      this.containingFolderContent.openAllInTabs(true);
    } else if (action === 1) {
      this.containingFolderContent.openAllInTabs();
    }
  }

  _onMouseOver() {
    if (config.showTooltip && this.title === '' && this.offsetWidth < this.scrollWidth) {
      this.title = this.innerText;
    }
  }
}
customElements.define('ext-open-all', OpenAllItem, { extends: 'li' });

class FolderContent extends HTMLUListElement {
  fillFolderContent(childBookmarks) {
    childBookmarks.forEach(each => {
      /**@type Bookmark */
      const bookmark = document.createElement('li', { is: 'ext-bookmark' });
      bookmark.init(each);
      this.appendChild(bookmark);
      if (this.isRoot) {
        bookmark.parentFolder = bookmark.rootFolder = this;
      } else {
        bookmark.parentFolder = this.parentElement;
        bookmark.rootFolder = bookmark.parentFolder.rootFolder;
        if (bookmark.isFolder) {
          bookmark.parentFolder.hasSubFolders = true;
          bookmark.fillFolder();
        }
      }
    });
    if (!this.isRoot) {
      this.addSeparator();
      this.appendChild(OpenAllItem.create(this));
      this._addEmpty();
    }
  }

  openAllInTabs(firstInCurrentTab = false) {
    this.childBookmarks.filter(each => each.url !== undefined).forEach((each, idx) => {
      if (idx === 0 && firstInCurrentTab) {
        chrome.tabs.update({ url: each.url });
      } else {
        chrome.tabs.create({ url: each.url, selected: idx === 0 });
      }
    });
    closePopup();
  }

  openAllInNewWindow(incognito = false) {
    const urls = this.childBookmarks.filter(each => each.url !== undefined).map(each => each.url);
    chrome.windows.create({ url: urls, incognito: incognito });
    closePopup();
  }

  openAllInIncognitoWindow() {
    this.openAllInNewWindow(true);
  }

  _addEmpty() {
    const li = document.createElement('li');
    li.classList.add('empty');
    li.appendChild(document.createTextNode('(' + chrome.i18n.getMessage('empty') + ')'));
    this.appendChild(li);
  }

  addSeparator() {
    const separator = document.createElement('li');
    separator.className = 'separator';
    separator.isSeparator = true;
    this.appendChild(separator);
  }

  get canBeReordered() {
    return this.isRoot ? this.childElementCount >= 3 : this.childBookmarks.length > 1;
  }

  reorder(/** @type Boolean */ beforeSeparator) {
    const childBookmarks = this.isRoot ? this.childBookmarks[beforeSeparator ? 0 : 1] : this.childBookmarks;
    const bookmarks = [];
    let separator = null;
    do {
      const child = beforeSeparator ? this.firstChild : this.lastChild;
      if (child.isSeparator) {
        if (beforeSeparator) {
          separator = child;
        }
        break;
      }
      bookmarks.push(child);
      this.removeChild(child);
    } while (this.hasChildNodes());

    childBookmarks.sort((b1, b2) => {
      if (b1.url === undefined && b2.url !== undefined) {
        return -1;
      }
      if (b1.url !== undefined && b2.url === undefined) {
        return 1;
      }
      return b1.title.localeCompare(b2.title);
    });

    childBookmarks.forEach((each, idx) => {
      chrome.bookmarks.move(each.id, { index: idx });
      const bookmark = bookmarks.find(b => b.id === each.id);
      if (bookmark !== undefined) {
        this.insertBefore(bookmark, separator);
      }
    });
  }

  remove(/** @type Bookmark */bookmark) {
    unSelect();
    if (!config.useGoogleBookmarks) {
      chrome.bookmarks.remove(bookmark.id);
      this._removeFromUI(bookmark);
      if (!this.isRoot) {
        /**@type Bookmark */
        const parentFolder = this.parentElement;
        parentFolder.unHighlight();
        parentFolder.displayFolderContent();
      }
    } else {
      const gid = bookmark.getAttribute('gid');
      removeGoogleBookmark(gid);
      all('li[gid="' + gid + '"]').forEach(/**@type Bookmark */each => {
        /** @type FolderContent */
        const folderContent = each.parentElement;
        folderContent._removeFromUI(each);
      });
    }
  }

  _removeFromUI(/** @type Bookmark */bookmark) {
    this.removeChild(bookmark);
    const bookmarkId = config.useGoogleBookmarks ? bookmark.getAttribute('gid') : bookmark.id;
    this.childBookmarks.splice(this.childBookmarks.findIndex(each => each.id === bookmarkId), 1);
    if (config.useGoogleBookmarks && !this.isRoot && this.childBookmarks.length === 0) {
      /**@type Bookmark */
      const folder = this.parentElement;
      /**@type FolderContent */
      const folderContent = folder.parentElement;
      folderContent.remove(folder);
    }
  }
}

customElements.define('ext-folder-content', FolderContent, { extends: 'ul' });

function unSelect() {
  const contextMenu = $('contextMenu');
  contextMenu.selectedBookmark.unHighlight();
  E.hide(contextMenu);
  E.hide($('transparentLayer'));
  E.hide($('gwindow'));
}

function processMenu(ev) {
  var item = ev.srcElement;
  const contextMenu = this;
  if (item != contextMenu) {
    while (!(item instanceof HTMLLIElement)) {
      item = item.parentElement;
    }
    if (item.classList.contains('enabled')) {
      const action = item.dataset.action;
      /** @type Bookmark */
      const bookmark = contextMenu.selectedBookmark;
      switch (action) {
        case 'openInNewTab':
          bookmark.openInNewTab();
          break;
        case 'openInNewWindow':
          bookmark.openInNewWindow();
          break;
        case 'openInIncognitoWindow':
          bookmark.openInNewWindow(true);
          break;
        case 'openAllInTabs':
          bookmark.folderContent.openAllInTabs();
          break;
        case 'openAllInNewWindow':
          bookmark.folderContent.openAllInNewWindow();
          break;
        case 'openAllInIncognitoWindow':
          bookmark.folderContent.openAllInIncognitoWindow();
          break;
        case 'reorder': {
          /**@type FolderContent */
          const folderContent = bookmark.parentElement;
          folderContent.reorder(true);
          if (folderContent.isRoot) {
            folderContent.reorder(false);
          }
          unSelect();
          break;
        }
        case 'addGBookmark': {
          const label = bookmark.isBookmark && bookmark.parentFolder.isRoot ? //
            '' : (bookmark.isFolder ? bookmark : bookmark.parentFolder).getAttribute('gid');
          unSelect();
          showGoogleBookmarkDialog(label);
          break;
        }
        case 'remove': {
          /**@type FolderContent */
          const folderContent = bookmark.parentElement;
          folderContent.remove(bookmark);
          break;
        }
        case 'openBookmarkManager':
          chrome.tabs.query({ currentWindow: true, url: 'chrome://bookmarks/*' }, function (tabs) {
            const folderId = bookmark.isFolder ? bookmark.id : bookmark.parentFolderId,
              bookmarkManagerUrl = 'chrome://bookmarks/?id=' + folderId;
            if (tabs.length === 0) {
              chrome.tabs.create({ url: bookmarkManagerUrl, selected: true }, closePopup);
            } else {
              chrome.tabs.update(tabs[0].id, { url: bookmarkManagerUrl, active: true }, closePopup);
            }
          });
          break;
        case 'reload':
          unSelect();
          reloadGBookmarks();
          break;
        case 'useGoogleBookmarks':
        case 'useChromeBookmarks':
          config.useGoogleBookmarks = !config.useGoogleBookmarks;
          changeBookmarkMode(config.useGoogleBookmarks);
          localStorage.setItem('useGoogleBookmarks', config.useGoogleBookmarks);

          clearBookmarksMenu();
          unSelect();

          document.body.style.overflowY = 'visible';
          loadBookmarks();
          break;
        default:
          throw Error(action + ' is not yet implemented');
      }
    }
  }
}

function isGBookmarkDataReady() {
  var regexp = /^\s*$/;
  $('btnAdd').disabled = regexp.test($('gbTitle').value) || regexp.test($('gbURL').value);
}

function suggestLabel() {
  var suggestDiv = $('suggest');
  var cursorPos = this.selectionStart;
  var labelValue = this.value;
  var precededComma = labelValue.lastIndexOf(',', labelValue.charAt(cursorPos) == ',' && cursorPos > 0 ? cursorPos - 1 : cursorPos);
  var nextComma = labelValue.indexOf(',', cursorPos);
  var newLabel = labelValue
    .substring(precededComma + 1, nextComma == -1 ? undefined : nextComma)
    .replace(/(^\s+)|(\s+$)/g, '')
    .toLocaleLowerCase();
  if (newLabel == '') {
    E.hide(suggestDiv);
    suggestDiv.querySelectorAll('div > div[class]').forEach(each => each.removeAttribute('class'));
    return;
  }
  var mustBeShown = false;
  suggestDiv.querySelectorAll('div > div').forEach(each => {
    if (each.textContent.toLocaleLowerCase().indexOf(newLabel) == 0) {
      mustBeShown = true;
      E.show(each);
    } else {
      E.hide(each);
      each.removeAttribute('class');
    }
  });
  if (mustBeShown) {
    E.show(suggestDiv);
  } else {
    E.hide(suggestDiv);
  }
}

function onSuggestMouseOver(div) {
  if (div.className == 'currentSuggest') {
    return;
  }
  var currentSuggest = div.parentElement.querySelector('.currentSuggest');
  if (currentSuggest) {
    currentSuggest.removeAttribute('class');
  }
  div.className = 'currentSuggest';
}

function selectSuggestion(e) {
  const suggestDiv = $('suggest');
  if (suggestDiv.style.display == 'block') {
    const keyCode = e.keyCode;
    if (keyCode == 40 || keyCode == 38) {
      const offset = keyCode == 40 ? 1 : -1;
      const currentSuggest = suggestDiv.querySelector('.currentSuggest');
      const divs = suggestDiv.querySelectorAll('div > div[style*="block"]');
      if (!currentSuggest) {
        onSuggestMouseOver(divs[offset == 1 ? 0 : divs.length - 1]);
      } else {
        for (let idx = 0, len = divs.length; idx < len; idx++) {
          if (divs[idx].className == 'currentSuggest') {
            idx += offset;
            if (idx < 0) {
              idx = len - 1;
            } else if (idx >= len) {
              idx = 0;
            }
            onSuggestMouseOver(divs[idx]);
            break;
          }
        }
      }
      e.preventDefault();
    } else if (keyCode == 13) {
      const currentSuggest = suggestDiv.querySelector('.currentSuggest');
      if (currentSuggest) {
        fillFolderBySuggest(currentSuggest);
      }
    }
  }
}

function fillFolderBySuggest(div) {
  var label = $('gbLabel');
  var value = label.value;
  var cursorPos = label.selectionStart;
  var precededComma = value.lastIndexOf(',', value.charAt(cursorPos) == ',' && cursorPos > 0 ? cursorPos - 1 : cursorPos);
  var nextComma = value.indexOf(',', cursorPos);
  label.value =
    value.substr(0, precededComma + 1) + //
    (precededComma == -1 ? '' : ' ') +
    div.textContent +
    (nextComma == -1 ? '' : value.substr(nextComma)) +
    (value.search(/,\s*$/) == -1 ? ', ' : '');
  div.removeAttribute('class');
  E.hide($('suggest'));
}

function showGoogleBookmarkDialog(initalLabel) {
  chrome.tabs.getSelected(null, function (tab) {
    $('gbTitle').value = tab.title;
    $('gbURL').value = tab.url;
    isGBookmarkDataReady();
  });
  E.show($('transparentLayer'));
  var win = $('gwindow');
  if (!win.initialized) {
    i18nUtils.initAll(win);
    $('gbLabel').onkeyup = function (e) {
      if (e.keyCode == 37 || e.keyCode == 39) {
        suggestLabel.apply(this);
      }
    };
    win.initialized = true;
  }
  E.show(win);
  var body = document.body;
  var winWidth = win.clientWidth,
    bodyWidth = body.clientWidth;
  if (bodyWidth <= winWidth + 10) {
    win.style.left = '3px';
    body.style.width = winWidth + 10 + 'px';
  } else {
    win.style.left = bodyWidth / 2 - winWidth / 2 + 'px';
  }
  var winHeight = win.clientHeight,
    bodyHeight = body.clientHeight;
  if (bodyHeight <= winHeight + 10) {
    win.style.top = '3px';
    body.style.height = winHeight + 10 + 'px';
  } else {
    win.style.top = bodyHeight / 2 - winHeight / 2 + 'px';
  }
  var gbLabel = $('gbLabel');
  gbLabel.value = initalLabel + ', ';
  gbLabel.focus();
  var suggest = win.querySelector('#suggest');
  suggest.style.width = suggest.style.maxWidth = gbLabel.clientWidth + 'px';
  E.hide(suggest);
  var labels = chrome.extension.getBackgroundPage().GBookmarksTree.labels;
  labels.sort();
  var suggestDiv = $('suggest');
  suggestDiv.querySelectorAll('div > *').forEach(each => each.parentElement.removeChild(each));
  var gbLabelStyles = window.getComputedStyle(gbLabel);
  suggestDiv.style.marginLeft = parseInt(gbLabelStyles.marginLeft) + parseInt(gbLabelStyles.borderLeftWidth) - 1 + 'px';
  labels.forEach(each => {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(each));
    div.onmouseover = evt => onSuggestMouseOver(evt.target);
    div.onclick = evt => fillFolderBySuggest(evt.target);
    suggestDiv.appendChild(div);
  });
}

function addGoogleBookmark() {
  var port = chrome.extension.connect();
  port.onMessage.addListener(function (response) {
    if (response == MESSAGES.RESP_TREE_IS_READY) {
      unSelect();
      clearBookmarksMenu();
      initBookmarksMenu();
    } else {
      // todo some error
      unSelect();
    }
  });
  port.postMessage({
    msg: MESSAGES.REQ_ADD_GOOGLE_BOOKMARK,
    title: $('gbTitle').value,
    url: $('gbURL').value,
    label: $('gbLabel').value
  });
}

function removeGoogleBookmark(id) {
  const port = chrome.extension.connect();
  port.postMessage({
    msg: MESSAGES.REQ_REMOVE_GOOGLE_BOOKMARK,
    id: id,
  });
}

function reloadGBookmarks() {
  clearBookmarksMenu();
  var loading = $('loading');
  if (loading.hasAttribute('data-i18n')) {
    i18nUtils.init(loading);
  }
  loading.style.position = 'fixed';
  E.show(loading);
  var body = document.body;
  var loadingWidth = loading.clientWidth,
    bodyWidth = body.clientWidth;
  if (bodyWidth <= loadingWidth + 10) {
    loading.style.left = '0px';
    body.style.width = loadingWidth + 10 + 'px';
  } else {
    loading.style.left = bodyWidth / 2 - loadingWidth / 2 + 'px';
  }
  var port = chrome.extension.connect();
  port.onMessage.addListener(function (response) {
    if (response == MESSAGES.RESP_TREE_IS_READY) {
      E.hide(loading);
      initBookmarksMenu();
    } else {
      loading.classList.add('error');
      loading.innerHTML = chrome.i18n.getMessage('failedRetrieveGBookmakrs');
    }
  });
  port.postMessage(MESSAGES.REQ_FORCE_LOAD_BOOKMARKS);
}

document.addEventListener('DOMContentLoaded', function () {
  function returnFalse() {
    return false;
  }

  document.addEventListener('contextmenu', evt => evt.preventDefault());
  all('#transparentLayer')
    .on('mouseup', unSelect)
    .on('mousedown', returnFalse);
  all('#contextMenu')
    .on('mouseup', processMenu)
    .on('mousedown', returnFalse);
  $('bookmarksMenu').on('mousedown', returnFalse);
  all('#gwindow #btnCancel').on('click', unSelect);
  all('#gwindow #btnAdd').on('click', addGoogleBookmark);
  all('#gwindow #gbTitle, #gwindow #gbURL').on('input', isGBookmarkDataReady);
  all('#gwindow #gbLabel')
    .on('input', suggestLabel)
    .on('keydown', selectSuggestion);

  const style = document.documentElement.style;
  ['bodyClr', 'fntClr', 'bmBgClr', 'disabledItemFntClr', 'activeBmFntClr', 'activeBmBgClrFrom', 'activeBmBgClrTo'].forEach(each => {
    style.setProperty(`--${each}`, Settings.getColor(each));
  });
  style.setProperty('--fav-icon-width', Settings.getFavIconWidth() + 'px');
  style.setProperty('--scrollbar-width', Settings.getScrollBarWidth() + 'px');
  style.setProperty('--font', `${Settings.getFontSize()}px "${Settings.getFontFamily()}"`);
  style.setProperty('--bookmark-max-width', Settings.getMaxWidth() + Settings.getMaxWidthMesure());

  loadBookmarks();

  var rootFolder = $('bookmarksMenu');
  rootFolder.onmouseup = function (ev) {
    /** @type Bookmark */
    var bookmark = ev.srcElement;
    while (!(bookmark instanceof HTMLLIElement)) {
      bookmark = bookmark.parentElement;
    }
    var action = parseInt(Settings.getButtonAction(ev.button));
    switch (action) {
      case 0: // open in current tab
        if (bookmark.isBookmark) {
          if (ev.ctrlKey) {
            bookmark.openInNewTab();
          } else if (ev.shiftKey) {
            bookmark.openInNewWindow();
          } else {
            bookmark.open();
          }
        }
        break;
      case 1: // open in new tab
        if (bookmark.isBookmark) {
          // switch to new tab if shift key pressed
          bookmark.openInNewTab(ev.shiftKey);
        } else if (bookmark.isFolder && bookmark.hasBookmarks) {
          bookmark.folderContent.openAllInTabs();
        }
        break;
      case 2: // open context menu
        if (bookmark.isBookmark || bookmark.isFolder) {
          if (bookmark.isBookmark) {
            bookmark.classList.add('hover');
          }
          bookmark.showContextMenu(ev);
        }
        break;
    }
  };
});

function clearBookmarksMenu() {
  const bookmarksMenu = $('bookmarksMenu');
  while (bookmarksMenu.hasChildNodes()) {
    bookmarksMenu.removeChild(bookmarksMenu.lastChild);
  }
}

function loadBookmarks() {
  if (config.useGoogleBookmarks) {
    var loading = $('loading');
    var port = chrome.extension.connect();
    port.onMessage.addListener(function (response) {
      if (response == MESSAGES.RESP_TREE_IS_READY) {
        E.hide(loading);
        initBookmarksMenu();
      } else if (response == MESSAGES.RESP_NEED_TO_LOAD) {
        i18nUtils.init(loading);
        E.show(loading);
        port.postMessage(MESSAGES.REQ_LOAD_BOOKMARKS);
      } else {
        loading.classList.add('error');
        loading.innerHTML = chrome.i18n.getMessage('failedRetrieveGBookmakrs');
      }
    });
    port.postMessage(MESSAGES.REQ_GET_TREE_STATUS);
  } else {
    chrome.bookmarks.getTree(initBookmarksMenu);
  }
}

function initBookmarksMenu(nodes) {
  const onlyVisibleBookmarks = each => !Settings.isBookmarkHidden(each.title, config.useGoogleBookmarks);
  /** @type FolderContent */
  const rootFolder = $('bookmarksMenu');
  rootFolder.isRoot = true;
  if (config.useGoogleBookmarks) {
    const tree = chrome.extension.getBackgroundPage().GBookmarksTree;
    rootFolder.fillFolderContent(tree.children.filter(onlyVisibleBookmarks));
  } else {
    const tree = nodes[0].children;
    rootFolder.fillFolderContent(tree[0].children.filter(onlyVisibleBookmarks));
    rootFolder.addSeparator();
    rootFolder.fillFolderContent(tree[1].children.filter(onlyVisibleBookmarks));
    rootFolder.childBookmarks = [tree[0].children, tree[1].children];
  }

  if (!rootFolder.noIconCSSAdded) {
    const favIcon = rootFolder.querySelector('li img');
    const iconMarginRight = window.getComputedStyle(favIcon).marginRight; // contains '3px'
    const textPaddingLeft = favIcon.offsetLeft + favIcon.scrollWidth + parseInt(iconMarginRight);
    document.documentElement.style.setProperty('--padding-for-noicon', textPaddingLeft + 'px');
    rootFolder.noIconCSSAdded = true;
  }
}

function closePopup() {
  window.close();
}
