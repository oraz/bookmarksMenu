'use strict';

import { $, all, getFavicon, isBookmarklet, i18nUtils, E } from '../common/common.js';
import { Settings } from '../common/settings.js';

const config = {
    winMaxWidth: 800,
    winMaxHeight: 600,
    showTooltip: Settings.isShowTooltip(),
    showURL: Settings.isShowURL()
};

class Bookmark extends HTMLLIElement {
    init(bookmarkNode) {
        this.id = bookmarkNode.id;
        this.parentFolderId = bookmarkNode.parentId;


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
            alert('Bookmarklets are not supported since v2023.03.05 because of Manifest V3. For more details see https://developer.chrome.com/docs/extensions/mv3/mv3-migration/#executing-arbitrary-strings');
        } else {
            chrome.tabs.update({ url: url });
            closePopup();
        }
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
            scrollBarWidth = window.innerWidth - body.clientWidth, // do not use Settings.getScrollBarWidth() here
            maxWidth = config.winMaxWidth - scrollBarWidth,
            tmp = this;
        do {
            width += tmp.clientWidth + 1;
            tmp = tmp.parentFolder;
        } while (!tmp.isRoot);
        if (width < maxWidth && this.treeDepth > 1) {
            var contentWidth = (maxWidth - width) / this.treeDepth;
            if (contentWidth < this.folderContent.clientWidth) {
                this.folderContent.style.width = contentWidth + 'px';
            }
        }
        width += this.folderContent.offsetWidth;
        if (width <= maxWidth && body.clientWidth < width) {
            bodyStyle.width = width + 'px';
        } else if (width > maxWidth) {
            bodyStyle.width = maxWidth + 'px';
            this.folderContent.style.width = this.folderContent.clientWidth - (width - maxWidth) + 'px';
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
        }

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

        if (ev.clientY + contextMenu.clientHeight < window.innerHeight) {
            contextMenuStyle.top = ev.pageY + 'px';
        } else if (ev.clientY < contextMenu.clientHeight) {
            // popup window is too small to display context menu and it must be resized
            // and then there must be enough space to display menu below mouse
            body.style.minHeight = ev.pageY + contextMenu.clientHeight + 5 + 'px';
            contextMenuStyle.top = ev.pageY + 'px';
        } else {
            contextMenuStyle.top = ev.pageY - contextMenu.clientHeight + 'px';
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

class OpenAllItem extends HTMLLIElement {
    static create(/** @type FolderContent */ containingFolderContent) {
        /**@type OpenAllItem */
        const openAll = document.createElement('li', { is: 'ext-open-all' });
        openAll._init(containingFolderContent);
        return openAll;
    }

    _init(/** @type FolderContent */ containingFolderContent) {
        this.containingFolderContent = containingFolderContent;
        this.classList.add('openAllInTabs');
        const icon = document.createElement('img');
        icon.src = '../../icons/transparent.svg';
        this.appendChild(icon);
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
        chrome.bookmarks.remove(bookmark.id);
        this._removeFromUI(bookmark);
        if (!this.isRoot) {
            /**@type Bookmark */
            const parentFolder = this.parentElement;
            parentFolder.unHighlight();
            parentFolder.displayFolderContent();
        }
    }

    _removeFromUI(/** @type Bookmark */bookmark) {
        this.removeChild(bookmark);
        const bookmarkId = bookmark.id;
        this.childBookmarks.splice(this.childBookmarks.findIndex(each => each.id === bookmarkId), 1);
    }
}

customElements.define('ext-folder-content', FolderContent, { extends: 'ul' });

function unSelect() {
    const contextMenu = $('contextMenu');
    contextMenu.selectedBookmark.unHighlight();
    E.hide(contextMenu);
    E.hide($('transparentLayer'));
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
                default:
                    throw Error(action + ' is not yet implemented');
            }
        }
    }
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

    const style = document.documentElement.style;
    ['bodyClr', 'fntClr', 'bmBgClr', 'disabledItemFntClr', 'activeBmFntClr', 'activeBmBgClrFrom', 'activeBmBgClrTo'].forEach(each => {
        style.setProperty(`--${each}`, Settings.getColor(each));
    });
    style.setProperty('--fav-icon-width', Settings.getFavIconWidth() + 'px');
    style.setProperty('--scrollbar-width', Settings.getScrollBarWidth() + 'px');
    style.setProperty('--font', `${Settings.getFontSize()}px "${Settings.getFontFamily()}"`);
    style.setProperty('--bookmark-max-width', Settings.getMaxWidth() + Settings.getMaxWidthMeasure());

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

function loadBookmarks() {
    chrome.bookmarks.getTree(initBookmarksMenu);
}

function initBookmarksMenu(nodes) {
    const onlyVisibleBookmarks = each => !Settings.isBookmarkHidden(each.title);
    /** @type FolderContent */
    const rootFolder = $('bookmarksMenu');
    rootFolder.isRoot = true;
    const tree = nodes[0].children;
    rootFolder.fillFolderContent(tree[0].children.filter(onlyVisibleBookmarks));
    rootFolder.addSeparator();
    rootFolder.fillFolderContent(tree[1].children.filter(onlyVisibleBookmarks));
    rootFolder.childBookmarks = [tree[0].children, tree[1].children];
}

function closePopup() {
    window.close();
}
