'use strict';

function setMouseButtonAction() {
    localStorage[parseInt(this.getAttribute('data-button-number'))] = this.selectedIndex;
}

function beforeDonate() {
    var radioGrp = all('input[name="donate_amount"]');
    for (var idx = radioGrp.length - 1; idx >= 0; idx--) {
        var btn = radioGrp[idx];
        if (btn.checked) {
            one('form[name="_xclick"] > input[name="amount"]').value =
                btn.value == 'selByUser' ? one('#donateSelByUser').value : btn.value;
            return true;
        }
    }
    return false;
}

function setIntProperty() {
    var value = parseInt(this.value),
        maxLimit = parseInt(this.getAttribute('max')),
        minLimit = parseInt(this.getAttribute('min'));
    if (isNaN(this.value) || isNaN(value) ||
        (!isNaN(minLimit) && value < minLimit) ||
        (!isNaN(maxLimit) && value > maxLimit)) {

        this.setAttribute('class', 'error');
        return;
    }
    this.removeAttribute('class');
    localStorage[this.id] = value;
}

function setBoolProperty() {
    localStorage[this.id] = this.checked;
}

function setFontFamily() {
    localStorage['fontFamily'] = this.value;
}

function setMenuMaxWidthMesure() {
    localStorage['maxWidthMesure'] = this.value;
}

function setBookmarkHidden(title, useGoogleBookmarks, hidden) {
    var key = (useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title;
    if (hidden == true) {
        localStorage[key] = true;
    } else {
        delete localStorage[key];
    }
}

function setColor() {
    if (/^[0-9A-F]{6}$/i.test(this.value)) {
        localStorage[this.id] = this.value;
    }
}

function setUseGoogleBookmarks(useGoogleBookmarks) {
    localStorage['useGoogleBookmarks'] = useGoogleBookmarks;
    one('#chromeBookmarksSettings').style.display = useGoogleBookmarks ? 'none' : 'block';
    one('#googleBookmarksSettings').style.display = useGoogleBookmarks ? 'block' : 'none';
    changeBookmarkMode(useGoogleBookmarks);
    if (useGoogleBookmarks) {
        clearGoogleBookmarksDiv();
        var port = chrome.extension.connect();
        port.onMessage.addListener(processResponse);
        port.postMessage(MESSAGES.REQ_GET_TREE_STATUS);
    }
}

function clearGoogleBookmarksDiv() {
    var gbookmarksSettings = one('#googleBookmarksSettings');
    gbookmarksSettings.querySelector('div.bookmark').hide();
    gbookmarksSettings.querySelectorAll('div.gbookmark').forEach(function () {
        this.parentElement.removeChild(this);
    });
}

function selectAllBookmarks() {
    var checked = this.checked;
    this.parentElement.parentElement.parentElement.querySelectorAll('input[type="checkbox"]').forEach(function (chk, idx) {
        if (idx > 0) {
            chk.checked = checked;
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent('change', true, true);
            chk.dispatchEvent(evt);
        }
    });
}

function addBookmark(divSettings, bookmark, useGoogleBookmarks) {
    var div = document.createElement('div');
    div.setAttribute('class', useGoogleBookmarks ? 'gbookmark' : 'bookmark');

    var checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    if (!isBookmarkHidden(bookmark.title, useGoogleBookmarks)) {
        checkbox.setAttribute('checked', 'checked');
    }
    checkbox.onchange = function () {
        setBookmarkHidden(bookmark.title, useGoogleBookmarks, !this.checked);
    };

    var label = document.createElement('label');
    label.appendChild(checkbox);

    var img = document.createElement('img');
    img.setAttribute('class', 'favicon');
    img.setAttribute('src', getFavicon(bookmark.url, useGoogleBookmarks ? getFaviconServiceForGoogle() : getFaviconServiceForChrome()));
    label.appendChild(img);
    label.appendChild(document.createTextNode(bookmark.title));
    div.appendChild(label);
    divSettings.appendChild(div);
}

function processResponse(response, port) {
    if (response == MESSAGES.RESP_NEED_TO_LOAD) {
        one('#loadingError').hide();
        one('#loading').show();
        port.postMessage(MESSAGES.REQ_LOAD_BOOKMARKS);
    } else if (response == MESSAGES.RESP_TREE_IS_READY) {
        one('#loading').hide();
        var GBookmarksTree = chrome.extension.getBackgroundPage().GBookmarksTree;
        var googleBookmarksSettings = one('#googleBookmarksSettings');
        googleBookmarksSettings.querySelector('div.bookmark').show();
        GBookmarksTree.children.forEach(function (bookmark) {
            addBookmark(googleBookmarksSettings, bookmark, true);
        });
    } else if (response == MESSAGES.RESP_FAILED) {
        one('#loading').hide();
        one('#loadingError').show();
    }
}

function setLabelSeparator() {
    var newLabelSeparator = this.value;
    if (newLabelSeparator == '') {
        this.setAttribute('class', 'error');
    }
    else {
        this.removeAttribute('class');
        if (newLabelSeparator != getLabelSeparator()) {
            localStorage['labelSeparator'] = newLabelSeparator;
            clearGoogleBookmarksDiv();
            one('#loadingError').hide();
            one('#loading').show();
            var port = chrome.extension.connect();
            port.onMessage.addListener(processResponse);
            port.postMessage(MESSAGES.REQ_FORCE_LOAD_BOOKMARKS);
        }
    }
}

function showTab() {
    var currentTab = this.parentNode.querySelector('li.fgTab');
    currentTab.setAttribute('class', 'bgTab');
    one('#' + currentTab.getAttribute('for')).hide();
    this.setAttribute('class', 'fgTab');
    one('#' + this.getAttribute('for')).show();
}

function setFaviconService() {
    localStorage[this.id] = this.value;
}

function resetWindowSettings() {
    localStorage.removeItem('fontFamily');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('favIconWidth');
    localStorage.removeItem('maxWidth');
    localStorage.removeItem('maxWidthMesure');
    localStorage.removeItem('scrollBarWidth');
    localStorage.removeItem('showTooltip');
    localStorage.removeItem('showURL');
    localStorage.removeItem('hideCMOpenIncognito');
    localStorage.removeItem('hideCMModeSwitcher');
    all('input.color').forEach(function () {
        localStorage.removeItem(this.id);
    });
    initWindowSettingsTab();
}

HTMLSelectElement.prototype.selectByValue = function (value) {
    this.selectedIndex = document.evaluate('count(option[@value="' + value + '"]/preceding-sibling::option)',
        this, null, XPathResult.NUMBER_TYPE, null).numberValue;
};

function initWindowSettingsTab() {
    one('#fontFamily').selectByValue(getFontFamily());
    one('#fontSize').value = getFontSize();
    one('#favIconWidth').value = getFavIconWidth();
    one('#maxWidth').value = getMaxWidth();
    one('#maxWidthMesure').selectByValue(getMaxWidthMesure());
    one('#scrollBarWidth').value = getScrollBarWidth();
    one('#showTooltip').checked = isShowTooltip();
    one('#showURL').checked = isShowURL();
    one('#hideCMOpenIncognito').checked = isHideCMOpenIncognito();
    one('#hideCMModeSwitcher').checked = isHideCMModeSwitcher();
    all('input.color').forEach(function () {
        this.color.fromString(getColor(this.id));
    });
}

document.addEventListener("DOMContentLoaded", function () {
    all('#tabs > li').on('click', showTab);
    one('#useChromeBookmarks').on('click', function () {
        setUseGoogleBookmarks(false);
    });
    one('#useGoogleBookmarks').on('click', function () {
        setUseGoogleBookmarks(true);
    });

    one('#chbFaviconService').on('change', setFaviconService);
    one('#gbFaviconService').on('change', setFaviconService);
    all('.selectAllBookmarks').on('click', selectAllBookmarks);

    all('#uiConfig input[type=number]').on('input', setIntProperty);

    all('#uiConfig input[type=checkbox], #switchToNewTab').on('change', setBoolProperty);
    all('#uiConfig input.color').on('input', setColor).on('change', setColor);
    all('#mouseConfig select').on('change', setMouseButtonAction);

    one('#resetWindowSettings').on('click', resetWindowSettings);
    one('#fontFamily').on('change', setFontFamily);
    one('#maxWidthMesure').on('change', setMenuMaxWidthMesure);
    one('form[name=_xclick]').on('submit', beforeDonate);
    one('#labelSeparator').on('input', setLabelSeparator);
    addButtonCSS();
    chrome.i18n.initAll();
    one('#donateHeader').innerHTML = chrome.i18n.getMessage('donateHeader');
    showTab.apply(one('li.fgTab'));

    // init Bookmarks tab
    var useGoogleBookmarks = isUseGoogleBookmarks();
    one(useGoogleBookmarks ? '#useGoogleBookmarks' : '#useChromeBookmarks').checked = true;
    setUseGoogleBookmarks(useGoogleBookmarks);
    one('#labelSeparator').value = getLabelSeparator();
    one('#chbFaviconService').selectByValue(getFaviconServiceForChrome());
    one('#gbFaviconService').selectByValue(getFaviconServiceForGoogle());
    chrome.bookmarks.getTree(function (nodes) {
        var chromeBookmarksSettings = one('#' + 'chromeBookmarksSettings');
        nodes.forEach(function (node) {
            node.children.forEach(function (child) {
                child.children.forEach(function (bookmark) {
                    addBookmark(chromeBookmarksSettings, bookmark, false);
                });
            });
        })
    });

    // init UI tab
    jscolor.init();
    initWindowSettingsTab();

    // init Mouse tab
    for (var idx = 0; idx < 3; idx++) {
        one('#btn' + idx).selectedIndex = getButtonAction(idx);
    }

    if (isSwitchToNewTab()) {
        one('#switchToNewTab').checked = true;
    }

}, false);
