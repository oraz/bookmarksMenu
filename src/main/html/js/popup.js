var config; // will be initialized in DOMContentLoaded handler

function Bookmark(bookmarkNode) {
    var bookmark = document.createElement('li');
    if (config.useGoogleBookmarks) {
        bookmark.id = Bookmark.autoId++;
        bookmark.setAttribute('gid', bookmarkNode.id);
    } else {
        bookmark.id = bookmarkNode.id;
        bookmark.parentFolderId = bookmarkNode.parentId;
    }
    var span = document.createElement('span');
    var favicon = document.createElement('img');
    favicon.src = getFavicon(bookmarkNode.url, config.faviconService);
    span.appendChild(favicon);
    span.appendChild(document.createTextNode(bookmarkNode.title));
    bookmark.appendChild(span);

    if (bookmarkNode.url == undefined) {
        bookmark.isFolder = true;
        bookmark.setAttribute("type", "folder");
        bookmark.childBookmarks = bookmarkNode.children;
    } else {
        bookmark.isBookmark = true;
        bookmark.setAttribute("type", "bookmark");
        bookmark.url = bookmarkNode.url;
    }
    return bookmark;
}

Bookmark.autoId = 1; // id for google bookmarks

HTMLUListElement.prototype.fillFolderContent = function (childBookmarks) {
    var len = childBookmarks.length;
    if (len > 0) {
        this.numberOfBookmarks = 0;
        for (var i = 0; i < len; i++) {
            var bookmark = new Bookmark(childBookmarks[i]);
            this.appendChild(bookmark);
            if (this.isRoot) {
                if (isBookmarkHidden(childBookmarks[i].title, config.useGoogleBookmarks)) {
                    bookmark.hide();
                    bookmark.isBookmarkHidden = true;
                    bookmark.removeAttribute("type");
                }
                else {
                    this.hasVisibleBookmarks = true;
                }
                bookmark.parentFolder = bookmark.rootFolder = this;
            }
            else {
                bookmark.parentFolder = this.parentElement;
                bookmark.rootFolder = bookmark.parentFolder.rootFolder;
                if (bookmark.isBookmark) {
                    this.numberOfBookmarks++;
                }
                else {
                    bookmark.parentFolder.hasSubFolders = true;
                    bookmark.fillFolder();
                }
            }
        }
        if (this.numberOfBookmarks > 1) {
            this.addSeparator();
            var openAllInTabs = document.createElement('li');
            openAllInTabs.parentFolder = this.parentElement;
            openAllInTabs.rootFolder = openAllInTabs.parentFolder.rootFolder;
            openAllInTabs.setAttribute('type', 'openAllInTabs');
            openAllInTabs.isOpenAll = true;
            var span = document.createElement('span');
            span.className = 'noicon';
            span.appendChild(document.createTextNode(chrome.i18n.getMessage('openAllInTabs')));
            openAllInTabs.appendChild(span);
            this.appendChild(openAllInTabs);
        }
    }
    else if (!this.isRoot) {
        this.fillAsEmpty();
    }
};

HTMLUListElement.prototype.fillAsEmpty = function () {
    this.parentElement.isEmpty = true;
    var li = document.createElement('li');
    var span = document.createElement('span');
    span.className = 'empty';
    span.appendChild(document.createTextNode('(' + chrome.i18n.getMessage('empty') + ')'));
    li.appendChild(span);
    this.appendChild(li);
};

HTMLUListElement.prototype.addSeparator = function () {
    var separator = document.createElement('li');
    separator.className = 'separator';
    separator.isSeparator = true;
    this.appendChild(separator);
};

HTMLLIElement.prototype.highlight = function () {
    this.unHighlightActiveFolder();
    if (this.isFolder) {
        this.setAttribute("class", "hover");
    }
    var span = this.firstChild;
    if ((config.showTooltip || config.showURL) && span.title == "") {
        if (config.showTooltip && span.offsetWidth < span.scrollWidth) {
            span.title = span.innerText;
        }
        if (config.showURL && !this.isFolder && !this.isOpenAll && span.className != 'empty') {
            span.title += (span.title == '' ? '' : '\n') + this.url;
        }
    }
};

HTMLLIElement.prototype.unHighlight = function () {
    this.removeAttribute("class");
};

HTMLLIElement.prototype.fillFolder = function () {
    this.folderContent = document.createElement('ul');
    this.appendChild(this.folderContent);
    this.folderContent.fillFolderContent(this.childBookmarks);
    this.childBookmarks = undefined;
    if (!this.hasSubFolders) {
        this.fillTreeDepth();
    }
};

HTMLLIElement.prototype.unHighlightActiveFolder = function () {
    var activeFolder = this.rootFolder.activeFolder;
    if (activeFolder != undefined) {
        var parentFolderId = this.parentFolder.id;
        while (activeFolder != undefined && activeFolder.id != parentFolderId) {
            activeFolder.unHighlight();
            activeFolder.folderContent.style.top = '-1px';
            activeFolder = activeFolder.parentFolder;
        }
    }
};

HTMLLIElement.prototype.open = function (closeAfterOpen) {
    var url = this.url;
    if (isBookmarklet(url)) {
        chrome.tabs.executeScript(null, { code: unescape(url.substr(11)) });
        if (closeAfterOpen) {
            closePopup();
        }
    }
    else {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.update(tab.id, { url: url });
            if (closeAfterOpen) {
                closePopup();
            }
        });
    }
};

HTMLLIElement.prototype.openInNewTab = function (switchToNewTab) {
    chrome.tabs.create({ url: this.url, selected: switchToNewTab || isSwitchToNewTab() }, closePopup);
};

HTMLLIElement.prototype.openInNewWindow = function (incognito) {
    chrome.windows.create({ url: this.url, incognito: incognito }, closePopup);
};

HTMLLIElement.prototype.openInIncognitoWindow = function () {
    this.openInNewWindow(true);
};

HTMLLIElement.prototype.openAllInTabs = function (firstInCurrentTab) {
    this.getBookmarksInFolder().forEach(function (bookmark, idx) {
        if (idx == 0 && firstInCurrentTab) {
            bookmark.open();
        }
        else {
            chrome.tabs.create({ url: bookmark.url, selected: idx == 0 });
        }
    });
    closePopup();
};

HTMLLIElement.prototype.openAllInNewWindow = function (incognito) {
    var urls = [];
    this.getBookmarksInFolder().forEach(function (bookmark) {
        urls.push(bookmark.url);
    });
    chrome.extension.getBackgroundPage().openUrlsInNewWindow(urls, incognito);
    closePopup();
};

HTMLLIElement.prototype.openAllInIncognitoWindow = function () {
    this.openAllInNewWindow(true);
};

HTMLLIElement.prototype.getBookmarksInFolder = function () {
    return this.querySelectorAll('li[id="' + this.id + '"]>ul>li[type="bookmark"]');
};

HTMLLIElement.prototype.getY = function () {
    var body = document.body;
    return this.getBoundingClientRect().top + body.scrollTop - body.clientTop;
};

HTMLLIElement.prototype.fillTreeDepth = function () {
    if (!this.isRoot && this.treeDepth == undefined) {
        var treeDepth = 1;
        this.treeDepth = treeDepth;
        var parentFolder = this.parentFolder;
        while (!parentFolder.isRoot && (parentFolder.treeDepth == undefined || treeDepth > parentFolder.treeDepth)) {
            parentFolder.treeDepth = ++treeDepth;
            parentFolder = parentFolder.parentFolder;
        }
    }
};

HTMLLIElement.prototype.showContextMenu = function (ev) {
    var contextMenu = $('contextMenu');
    if (!contextMenu.initialized) {
        chrome.i18n.initAll(contextMenu);
        contextMenu.initialized = true;

        if (isHideCMOpenIncognito()) {
            contextMenu.querySelectorAll('li[data-action="openInIncognitoWindow"], li[data-action="openAllInIncognitoWindow"]').forEach(function () {
                this.hide();
            });
        }
        if (isHideCMModeSwitcher()) {
            if (!config.useGoogleBookmarks) {
                contextMenu.querySelector('li[data-action="useGoogleBookmarks"]').hide();
                contextMenu.querySelectorAll('li.separator')[1].hide();
            }
            else {
                contextMenu.querySelector('li[data-action="useChromeBookmarks"]').hide();
            }
        }
    }
    contextMenu.className = config.useGoogleBookmarks ? 'forGoogleBookmarks' : 'forChromeBookmarks';

    contextMenu.selectedBookmark = this;
    contextMenu.setAttribute('for', this.getAttribute('type'));
    if (this.isFolder) {
        var hasChildren = this.lastChild.numberOfBookmarks > 0;
        contextMenu.querySelectorAll('.forFolder').forEach(function () {
            this.classList.toggle('enabled', hasChildren);
        });
    }

    contextMenu.querySelector('li[data-action="reorder"]').classList.toggle('enabled', this.parentElement.childElementCount > 1);
    contextMenu.querySelector('li[data-action="remove"]').classList.toggle('enabled', this.isBookmark || this.isFolder && this.isEmpty);
    contextMenu.show();

    var body = document.body;
    var bodyWidth = body.clientWidth;
    var contextMenuStyle = contextMenu.style;
    var contextMenuWidth = contextMenu.clientWidth + 3; // 3 is a border size
    var scrollBarWidth = body.offsetWidth - body.clientWidth;
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

    var bodyHeight = body.scrollHeight;
    if (ev.clientY + contextMenu.clientHeight > body.clientHeight) {
        if (contextMenu.clientHeight > body.clientHeight || ev.clientY < contextMenu.clientHeight) {
            bodyHeight = ev.clientY + contextMenu.clientHeight + 5;
            body.style.height = bodyHeight + 'px';
            contextMenuStyle.top = ev.clientY + 'px';
        } else {
            contextMenuStyle.top = ev.clientY + body.scrollTop - contextMenu.clientHeight + 'px';
        }
    } else {
        contextMenuStyle.top = ev.clientY + body.scrollTop + 'px';
    }

    var transparentLayer = $('transparentLayer');
    transparentLayer.style.right = (scrollBarWidth > 0 ? 1 : 0) + 'px';
    transparentLayer.show();
};

HTMLLIElement.prototype.remove = function () {
    if (!config.useGoogleBookmarks) {
        chrome.bookmarks.remove(this.id);
        this.removeFromUI();
    } else {
        var gid = this.getAttribute('gid');
        chrome.extension.getBackgroundPage().remove(gid);
        all('li[gid="' + gid + '"]').forEach(function () {
            this.removeFromUI();
        });
    }
    // replace folder content after removing bookmark
    var parentFolder = this.parentFolder;
    if (!parentFolder.isRoot && parentFolder.exists !== false) {
        parentFolder.unHighlight();
        parentFolder.displayFolderContent();
    }
};

HTMLLIElement.prototype.removeFromUI = function () {
    var folderContent = this.parentElement;
    folderContent.removeChild(this);
    if (folderContent.childElementCount == 0) {
        if (!config.useGoogleBookmarks) {
            folderContent.fillAsEmpty();
        } else {
            // remove folder if it's empty
            do
            {
                var folder = folderContent.parentElement;
                folderContent = folder.parentElement;
                chrome.extension.getBackgroundPage().remove(folder.getAttribute('gid'));
                folderContent.removeChild(folder);
            }
            while (!folderContent.isRoot && folderContent.childElementCount == 0);
            this.parentFolder.exists = false;
            if (!folderContent.isRoot) {
                folderContent.parentElement.unHighlight();
                folderContent.parentElement.displayFolderContent();
            }
        }
    } else if (folderContent.numberOfBookmarks-- <= 2 && folderContent.lastElementChild.isOpenAll) {
        // remove "open all" and separator
        folderContent.removeChild(folderContent.lastElementChild);
        folderContent.removeChild(folderContent.lastElementChild);
    }
};

HTMLLIElement.prototype.displayFolderContent = function () {
    if (this.getAttribute("class") == "hover") {
        return;
    }
    this.highlight();
    this.rootFolder.activeFolder = this;
    if (this.childBookmarks != undefined) {
        this.fillFolder();
    }

    var body = document.body, bodyStyle = body.style;
    var posY = this.getY();
    var contentHeight = this.folderContent.offsetHeight, offset = 1;
    if (posY + contentHeight > body.scrollTop + config.winMaxHeight) {
        offset = posY + contentHeight - config.winMaxHeight - body.scrollTop;
        if (offset > posY - body.scrollTop) {
            offset = posY - body.scrollTop;
        }
        this.folderContent.style.top = '-' + offset + 'px';
    }

    var width = 0, tmp = this;
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
    width += this.folderContent.clientWidth + 2 - parseInt(window.getComputedStyle(body).marginRight);
    if (width <= config.winMaxWidth && body.clientWidth < width) {
        bodyStyle.width = width + 'px';
    } else if (width > config.winMaxWidth) {
        bodyStyle.width = config.winMaxWidth + 'px';
        this.folderContent.style.width = (this.folderContent.clientWidth - (width - config.winMaxWidth)) + 'px';
    }
};

HTMLLIElement.prototype.reorder = function (beforeSeparator) {
    var folderContent = this.parentElement;
    if (this.parentFolder.isRoot && beforeSeparator == undefined) {
        if (!folderContent.firstChild.isSeparator)
            folderContent.firstChild.reorder(true);
        if (!folderContent.lastChild.isSeparator)
            folderContent.lastChild.reorder(false);
        return;
    }
    if (beforeSeparator == undefined) {
        beforeSeparator = true;
    }
    var bookmarks = [],
        separator = null;
    do {
        var child = beforeSeparator ? folderContent.firstChild : folderContent.lastChild;
        if (child.isSeparator) {
            if (beforeSeparator) {
                separator = child;
            }
            break;
        }
        bookmarks.push(child);
        folderContent.removeChild(child);
    } while (folderContent.hasChildNodes());

    bookmarks.sort(function (b1, b2) {
        if (b1.isFolder && b2.isBookmark) {
            return -1;
        }
        if (b2.isFolder && b1.isBookmark) {
            return 1;
        }

        var t1 = b1.firstChild.innerText.toLowerCase(),
            t2 = b2.firstChild.innerText.toLowerCase();
        return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
    });

    for (var idx = 0, len = bookmarks.length; idx < len; idx++) {
        folderContent.insertBefore(bookmarks[idx], separator);
        chrome.bookmarks.move(bookmarks[idx].id, { parentId: this.parentFolderId, index: idx });
    }
};

function unSelect() {
    var contextMenu = $('contextMenu');
    contextMenu.selectedBookmark.unHighlight();
    contextMenu.hide();
    $('transparentLayer').hide();
    $('gwindow').hide();
}

function processMenu(ev) {
    var item = ev.srcElement,
        contextMenu = this;
    if (item != contextMenu) {
        while (!(item instanceof HTMLLIElement)) {
            item = item.parentElement;
        }
        if (item.classList.contains('enabled')) {
            var action = item.getAttribute('data-action'),
                bookmark = contextMenu.selectedBookmark;
            if (action == 'reload') {
                unSelect();
                reloadGBookmarks();
            }
            else if (action == 'addGBookmark') {
                var label = bookmark.isBookmark && bookmark.parentFolder.isRoot ? '' :
                    (bookmark.isFolder ? bookmark : bookmark.parentFolder).getAttribute('gid');
                unSelect();
                showGoogleBookmarkDialog(label);
            }
            else if (action == 'useGoogleBookmarks' || action == 'useChromeBookmarks') {
                var useGoogleBookmarks = !config.useGoogleBookmarks;
                changeBookmarkMode(useGoogleBookmarks);
                config.faviconService = useGoogleBookmarks ?
                    getFaviconServiceForGoogle() : getFaviconServiceForChrome();
                localStorage['useGoogleBookmarks'] =
                    config.useGoogleBookmarks = useGoogleBookmarks;

                $('bookmarksMenu').clear();
                unSelect();

                document.body.style.overflowY = 'visible';
                loadBookmarks();
            }
            else if (action === 'openBookmarkManager') {
                chrome.tabs.query({ currentWindow: true, url: 'chrome://bookmarks/*' }, function (tabs) {
                    var folderId = bookmark.isFolder ? bookmark.id : bookmark.parentFolderId,
                        bookmarkManagerUrl = "chrome://bookmarks/#" + folderId;
                    if(tabs.length === 0) {
                        chrome.tabs.create({ url: bookmarkManagerUrl, selected: true }, closePopup);
                    } else {
                        chrome.tabs.update(tabs[0].id, { url: bookmarkManagerUrl, active: true }, closePopup);
                    }
                });
            }
            else {
                bookmark[action].call(bookmark);
                unSelect();
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
    var newLabel = labelValue.substring(precededComma + 1, nextComma == -1 ? undefined : nextComma)
        .replace(/(^\s+)|(\s+$)/g, '')
        .toLocaleLowerCase();
    if (newLabel == '') {
        suggestDiv.hide();
        suggestDiv.querySelectorAll('div > div[class]').forEach(function () {
            this.removeAttribute('class');
        });
        return;
    }
    var mustBeShown = false;
    suggestDiv.querySelectorAll('div > div').forEach(function () {
        if (this.textContent.toLocaleLowerCase().indexOf(newLabel) == 0) {
            mustBeShown = true;
            this.show();
        }
        else {
            this.hide();
            this.removeAttribute('class');
        }
    });
    if (mustBeShown) {
        suggestDiv.show();
    }
    else {
        suggestDiv.hide();
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
    var suggestDiv = $('suggest');
    if (suggestDiv.style.display == 'block') {
        var keyCode = e.keyCode;
        if (keyCode == 40 || keyCode == 38) {
            var offset = keyCode == 40 ? 1 : -1;
            var currentSuggest = suggestDiv.querySelector('.currentSuggest');
            var divs = suggestDiv.querySelectorAll('div > div[style*="block"]');
            if (!currentSuggest) {
                onSuggestMouseOver(divs[offset == 1 ? 0 : divs.length - 1]);
            }
            else {
                for (var idx = 0, len = divs.length; idx < len; idx++) {
                    if (divs[idx].className == 'currentSuggest') {
                        idx += offset;
                        if (idx < 0) {
                            idx = len - 1;
                        }
                        else if (idx >= len) {
                            idx = 0;
                        }
                        onSuggestMouseOver(divs[idx]);
                        break;
                    }
                }
            }
            e.preventDefault();
        }
        else if (keyCode == 13) {
            var currentSuggest = suggestDiv.querySelector('.currentSuggest');
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
    label.value = value.substr(0, precededComma + 1) +
        (precededComma == -1 ? '' : ' ') + div.textContent +
        (nextComma == -1 ? '' : value.substr(nextComma)) +
        (value.search(/,\s*$/) == -1 ? ', ' : '');
    div.removeAttribute('class');
    $('suggest').hide();
}

function showGoogleBookmarkDialog(initalLabel) {
    chrome.tabs.getSelected(null, function (tab) {
        $('gbTitle').value = tab.title;
        $('gbURL').value = tab.url;
        isGBookmarkDataReady();
    });
    $('transparentLayer').show();
    var win = $('gwindow');
    if (!win.initialized) {
        chrome.i18n.initAll(win);
        $('gbLabel').onkeyup = function (e) {
            if (e.keyCode == 37 || e.keyCode == 39) {
                suggestLabel.apply(this);
            }
        };
        win.initialized = true;
    }
    win.show();
    var body = document.body;
    var winWidth = win.clientWidth, bodyWidth = body.clientWidth;
    if (bodyWidth <= winWidth + 10) {
        win.style.left = '3px';
        body.style.width = winWidth + 10 + 'px';
    }
    else {
        win.style.left = bodyWidth / 2 - winWidth / 2 + 'px';
    }
    var winHeight = win.clientHeight, bodyHeight = body.clientHeight;
    if (bodyHeight <= winHeight + 10) {
        win.style.top = '3px';
        body.style.height = winHeight + 10 + 'px';
    }
    else {
        win.style.top = bodyHeight / 2 - winHeight / 2 + 'px';
    }
    var gbLabel = $('gbLabel');
    gbLabel.value = initalLabel + ', ';
    gbLabel.focus();
    var suggest = win.querySelector('#suggest');
    suggest.style.width = suggest.style.maxWidth = gbLabel.clientWidth + 'px';
    suggest.hide();
    var folderNames = new Array();
    var labels = chrome.extension.getBackgroundPage().GBookmarksTree.labels;
    labels.sort();
    var suggestDiv = $('suggest');
    suggestDiv.querySelectorAll('div > *').forEach(function () {
        this.parentElement.removeChild(this)
    });
    var gbLabelStyles = window.getComputedStyle(gbLabel);
    suggestDiv.style.marginLeft = parseInt(gbLabelStyles.marginLeft) + parseInt(gbLabelStyles.borderLeftWidth) - 1 + 'px';
    for (var idx = 0, len = labels.length; idx < len; idx++) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(labels[idx]));
        div.setAttribute('onmouseover', 'onSuggestMouseOver(this)');
        div.setAttribute('onclick', 'fillFolderBySuggest(this)');
        suggestDiv.appendChild(div);
    }
}

function addGoogleBookmark() {
    var port = chrome.extension.connect();
    port.onMessage.addListener(function (response) {
        if (response == MESSAGES.RESP_TREE_IS_READY) {
            unSelect();
            var rootFolder = $('bookmarksMenu');
            rootFolder.clear();
            rootFolder.fillFolderContent(chrome.extension.getBackgroundPage().GBookmarksTree.children);
        }
        else {
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

function reloadGBookmarks() {
    $('bookmarksMenu').clear();
    var loading = $('loading');
    if (loading.hasAttribute('i18n')) {
        chrome.i18n.initElement(loading);
    }
    loading.style.position = 'fixed';
    loading.show();
    var body = document.body;
    var loadingWidth = loading.clientWidth, bodyWidth = body.clientWidth;
    if (bodyWidth <= loadingWidth + 10) {
        loading.style.left = '0px';
        body.style.width = loadingWidth + 10 + 'px';
    }
    else {
        loading.style.left = bodyWidth / 2 - loadingWidth / 2 + 'px';
    }
    var port = chrome.extension.connect();
    port.onMessage.addListener(function (response) {
        if (response == MESSAGES.RESP_TREE_IS_READY) {
            loading.hide();
            var rootFolder = $('bookmarksMenu');
            rootFolder.fillFolderContent(chrome.extension.getBackgroundPage().GBookmarksTree.children);
        }
        else {
            loading.style.color = 'red';
            loading.innerHTML = chrome.i18n.getMessage('failedRetrieveGBookmakrs');
        }
    });
    port.postMessage(MESSAGES.REQ_FORCE_LOAD_BOOKMARKS);
}

document.addEventListener("DOMContentLoaded", function () {
    function returnFalse() {
        return false;
    }

    function _preventDefault(evt) {
        evt.preventDefault();
    }

    document.addEventListener('contextmenu', _preventDefault);
    all('#transparentLayer').on('mouseup', unSelect).on('mousedown', returnFalse);
    all('#contextMenu').on('mouseup', processMenu).on('mousedown', returnFalse);
    $('bookmarksMenu').on('mousedown', returnFalse);
    all('#gwindow #btnCancel').on('click', unSelect);
    all('#gwindow #btnAdd').on('click', addGoogleBookmark);
    all('#gwindow #gbTitle, #gwindow #gbURL').on('input', isGBookmarkDataReady);
    all('#gwindow #gbLabel').on('input', suggestLabel).on('keydown', selectSuggestion);
    config = {
        winMaxWidth: 800,
        winMaxHeight: 600,
        showTooltip: isShowTooltip(),
        showURL: isShowURL(),
        useGoogleBookmarks: isUseGoogleBookmarks(),
        faviconService: isUseGoogleBookmarks() ? getFaviconServiceForGoogle() : getFaviconServiceForChrome()
    };

    var styleSheet = document.styleSheets[0];
    var favIconWidth = getFavIconWidth();
    styleSheet.addRule('body', 'background-color: ' + getColor('bodyClr') + ';');
    styleSheet.addRule('img', 'width: ' + favIconWidth + 'px; height: ' + favIconWidth + 'px;');
    styleSheet.addRule('label, span, #loading', 'font: ' + getFontSize() + 'px "' + getFontFamily() + '";' +
        'color: ' + getColor('fntClr') + ';');
    styleSheet.addRule('ul, #gwindow', 'background-color: ' + getColor('bmBgClr') + ';');

    styleSheet.addRule('#contextMenu > li:not(.enabled) > span, .empty', 'color: ' + getColor('disabledItemFntClr') + ';');
    styleSheet.addRule('li[type]:hover > span, .enabled:hover > span, .hover > span',
        'color: ' + getColor('activeBmFntClr') + ';' +
            'background-image: -webkit-gradient(linear, left top, left bottom, from(' +
            getColor('activeBmBgClrFrom') + '), to(' + getColor('activeBmBgClrTo') + '));');
    styleSheet.addRule('#bookmarksMenu span', 'max-width: ' + getMaxWidth() + getMaxWidthMesure() + ';');
    styleSheet.addRule('::-webkit-scrollbar', 'width: ' + getScrollBarWidth() + 'px;');
    addButtonCSS();

    loadBookmarks();

    var rootFolder = $('bookmarksMenu');
    rootFolder.onmouseup = function (ev) {
        var bookmark = ev.srcElement;
        while (!(bookmark instanceof HTMLLIElement)) {
            bookmark = bookmark.parentElement;
        }
        var action = parseInt(getButtonAction(ev.button));
        switch (action) {
            case 0: // open in current tab
                if (bookmark.isBookmark) {
                    ev.ctrlKey ? bookmark.openInNewTab()
                        : ev.shiftKey ? bookmark.openInNewWindow()
                        : bookmark.open(true);
                } else if (bookmark.isOpenAll) {
                    bookmark.parentFolder.openAllInTabs(true);
                }
                break;
            case 1: // open in new tab
                if (bookmark.isBookmark) {
                    // switch to new tab if shift key pressed
                    bookmark.openInNewTab(ev.shiftKey);
                } else if (bookmark.isOpenAll) {
                    bookmark.parentFolder.openAllInTabs(false);
                } else if (bookmark.isFolder && bookmark.lastChild.numberOfBookmarks > 0) {
                    bookmark.openAllInTabs(false);
                }
                break;
            case 2: // open context menu
                if (bookmark.isBookmark || bookmark.isFolder) {
                    if (bookmark.isBookmark) {
                        bookmark.className = 'hover';
                    }
                    bookmark.showContextMenu(ev);
                }
                break;
        }
    };
    rootFolder.onmouseover = function (ev) {
        var bookmark = ev.srcElement;
        if (!(bookmark instanceof HTMLUListElement)) {
            while (!(bookmark instanceof HTMLLIElement)) {
                bookmark = bookmark.parentElement;
            }
            if (bookmark.isBookmark || bookmark.isOpenAll) {
                bookmark.highlight();
            } else if (bookmark.isFolder) {
                bookmark.displayFolderContent();
            }
        }
    };
    rootFolder.clear = function () {
        this.querySelectorAll('#bookmarksMenu > *').forEach(function () {
            this.parentElement.removeChild(this)
        });
    }
});

function loadBookmarks() {
    if (config.useGoogleBookmarks) {
        var loading = $('loading');
        var port = chrome.extension.connect();
        port.onMessage.addListener(function (response) {
            if (response == MESSAGES.RESP_TREE_IS_READY) {
                loading.hide();
                initBookmarksMenu();
            } else if (response == MESSAGES.RESP_NEED_TO_LOAD) {
                chrome.i18n.initElement(loading);
                loading.show();
                port.postMessage(MESSAGES.REQ_LOAD_BOOKMARKS)
            } else {
                loading.style.color = 'red';
                loading.innerHTML = chrome.i18n.getMessage('failedRetrieveGBookmakrs');
            }
        });
        port.postMessage(MESSAGES.REQ_GET_TREE_STATUS);
    } else {
        chrome.bookmarks.getTree(initBookmarksMenu);
    }
}

function initBookmarksMenu(nodes) {
    var rootFolder = $('bookmarksMenu');
    rootFolder.isRoot = true;
    if (config.useGoogleBookmarks) {
        rootFolder.fillFolderContent(chrome.extension.getBackgroundPage().GBookmarksTree.children);
    } else {
        var nodesChildren = nodes[0].children;
        rootFolder.fillFolderContent(nodesChildren[0].children);
        rootFolder.addSeparator();
        var separator = rootFolder.lastChild;
        if (!rootFolder.hasVisibleBookmarks) {
            separator.hide();
        }
        rootFolder.hasVisibleBookmarks = false;
        rootFolder.fillFolderContent(nodesChildren[1].children);
        if (!rootFolder.hasVisibleBookmarks) {
            separator.hide();
        }
    }
    delete rootFolder.hasVisibleBookmarks;

    if (!rootFolder.noIconCSSAdded) {
        var favIcon = rootFolder.querySelector('li[type] img');
        var iconMarginRight = window.getComputedStyle(favIcon).marginRight; // contains '3px'
        var textPaddingLeft = favIcon.offsetLeft + favIcon.scrollWidth + parseInt(iconMarginRight);
        document.styleSheets[0].addRule('.noicon', 'padding-left:' + textPaddingLeft + 'px;');
        rootFolder.noIconCSSAdded = true;
    }
}

function closePopup() {
    window.close();
}
