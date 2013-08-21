var GBookmarksTree = null;

var GBookmarkUrl = 'https://www.google.com/bookmarks/';

function GBookmarkFolder(names, parentFolder) {
    this.children = [];
    if (parentFolder) {
        this.title = names.shift();
        this.id = !parentFolder.isRoot ? parentFolder.id + GBookmarksTree.labelSeparator + this.title : this.title;
        parentFolder.addChild(this);
        if (!GBookmarksTree.labels) {
            GBookmarksTree.labels = [];
        }
        GBookmarksTree.labels.push(this.id);
    }
    else {
        this.isRoot = true;
        this.labelSeparator = getLabelSeparator();
        return this;
    }
    return names.length > 0 ? new GBookmarkFolder(names, this) : this;
}

GBookmarkFolder.prototype.addChild = function (child) {
    this.children.push(child);
};

GBookmarkFolder.prototype.findFolder = function (fullName) {
    var names = typeof fullName == 'string' ? fullName.split(GBookmarksTree.labelSeparator) : fullName;
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
            GBookmarksTree.removeBookmark(id);
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
    var t1 = b1.title, t2 = b2.title;
    return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
}

function createBookmark(node) {
    var bm =
    {
        title:node.querySelector('title').textContent,
        url:node.querySelector('link').textContent,
        id:node.querySelector('bkmk_id').textContent
    };
    var labels = node.querySelectorAll('bkmk_label');
    if (labels.length > 0) {
        for (var idx = labels.length - 1; idx >= 0; idx--) {
            GBookmarksTree.findFolder(labels[idx].textContent).addChild(bm);
        }
    }
    else {
        GBookmarksTree.addChild(bm);
    }
}

XMLHttpRequest.prototype.processBookmarks = function () {
    if (this.readyState == 4 && this.status == 200) {
        clearTimeout(this.timeout);
        delete this.timeout;
        GBookmarksTree = new GBookmarkFolder();
        GBookmarksTree.signature = this.responseXML.querySelector('channel > signature').textContent;
        this.responseXML.querySelectorAll('channel > item').forEach(createBookmark);
        GBookmarksTree.sort();
        this.port.postMessage(MESSAGES.RESP_TREE_IS_READY);
        this.port.disconnect();
    }
};

XMLHttpRequest.prototype.processAbort = function () {
    if (this.port.disconnected) {
        clearTimeout(this.timeout);
    }
    else {
        this.port.postMessage(MESSAGES.RESP_FAILED);
        this.port.disconnect();
        console.error('xhr has been aborted');
    }
};

function remove(id) {
    var child = GBookmarksTree.removeBookmark(id);
    if (child) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', GBookmarkUrl + 'mark?' + 'dlq=' + encodeURIComponent(id) + '&sig=' + encodeURIComponent(GBookmarksTree.signature), true);
        xhr.send();
    }
}

function onDisconnect(port) {
    // fired when user closes popup window or options window
    port.disconnected = true;
    port.xhr.abort();
}

function onIncomingMessage(req, port) {
    if (req == MESSAGES.REQ_LOAD_BOOKMARKS && GBookmarksTree) {
        port.postMessage(MESSAGES.RESP_TREE_IS_READY);
        port.disconnect();
    }
    else if (req == MESSAGES.REQ_LOAD_BOOKMARKS && !GBookmarksTree || req == MESSAGES.REQ_FORCE_LOAD_BOOKMARKS) {
        GBookmarksTree = null;
        var xhr = new XMLHttpRequest();
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
        xhr.open("GET", GBookmarkUrl + '?output=rss&num=10000', true);
        xhr.send();
    }
    else if (req == MESSAGES.REQ_GET_TREE_STATUS) {
        port.postMessage(GBookmarksTree ? MESSAGES.RESP_TREE_IS_READY : MESSAGES.RESP_NEED_TO_LOAD);
        if (GBookmarksTree) {
            port.disconnect();
        }
    }
    else if (req.msg == MESSAGES.REQ_ADD_GOOGLE_BOOKMARK) {
        var xhr = new XMLHttpRequest();
        port.onDisconnect.addListener(function () {
            port.disconnected = true;
        });
        var label = req.label.replace(/(^\s+)|(\s+$)/g, '').replace(/\s*,\s*/g, ',').replace(/,{2,}/g, ',').replace(/(^,)|(,$)/g, '');
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var bm = {
                    title:req.title,
                    url:req.url,
                    id:xhr.responseText
                };
                if (label == '') {
                    GBookmarksTree.addChild(bm);
                }
                else {
                    var labels = label.split(',');
                    var proceededLabels = [];
                    for (var idx = labels.length - 1; idx >= 0; idx--) {
                        var proceeded = false;
                        for (var pIdx = proceededLabels.length - 1; pIdx >= 0; pIdx--) {
                            if (proceededLabels[pIdx] == labels[idx]) {
                                proceeded = true;
                                break;
                            }
                        }
                        if (!proceeded) {
                            GBookmarksTree.findFolder(labels[idx]).addChild(bm);
                            proceededLabels.push(labels[idx]);
                        }
                    }
                }
                GBookmarksTree.sort();
                if (!port.disconnected) {
                    port.postMessage(MESSAGES.RESP_TREE_IS_READY);
                    port.disconnect();
                }
            }
        };
        xhr.open('POST', GBookmarkUrl + 'mark', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send('bkmk=' + encodeURIComponent(req.url) +
            '&title=' + encodeURIComponent(req.title) +
            '&labels=' + encodeURIComponent(label) +
            '&sig=' + encodeURIComponent(GBookmarksTree.signature));
    }
}

function openUrlsInNewWindow(urls, incognito) {
    chrome.windows.create({ url:urls[0], incognito:incognito }, function (win) {
        if (incognito && !win && urls.length > 1) {
            alert(chrome.i18n.getMessage('needAllowIncognito'));
            return;
        }
        for (var idx = 1, len = urls.length; idx < len; idx++) {
            chrome.tabs.create({ url:urls[idx], windowId:win.id, selected:false });
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    chrome.browserAction.setBadgeBackgroundColor({ color:[ 24, 135, 185, 255 ] });
    changeBookmarkMode(isUseGoogleBookmarks());
    chrome.extension.onConnect.addListener(function (port) {
        port.onMessage.addListener(onIncomingMessage);
    });
});
