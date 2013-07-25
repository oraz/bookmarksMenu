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
                btn.value == 'selByUser' ? $('donateSelByUser').value : btn.value;
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
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        localStorage[this.id] = this.value;
    }
}

function setUseGoogleBookmarks(useGoogleBookmarks) {
    localStorage['useGoogleBookmarks'] = useGoogleBookmarks;
    $('chromeBookmarksSettings').style.display = useGoogleBookmarks ? 'none' : 'block';
    $('googleBookmarksSettings').style.display = useGoogleBookmarks ? 'block' : 'none';
    changeBookmarkMode(useGoogleBookmarks);
    if (useGoogleBookmarks) {
        clearGoogleBookmarksDiv();
        var port = chrome.extension.connect();
        port.onMessage.addListener(processResponse);
        port.postMessage(MESSAGES.REQ_GET_TREE_STATUS);
    }
}

function clearGoogleBookmarksDiv() {
    var gbookmarksSettings = $('googleBookmarksSettings');
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
        $('loadingError').hide();
        $('loading').show();
        port.postMessage(MESSAGES.REQ_LOAD_BOOKMARKS);
    } else if (response == MESSAGES.RESP_TREE_IS_READY) {
        $('loading').hide();
        var GBookmarksTree = chrome.extension.getBackgroundPage().GBookmarksTree;
        var googleBookmarksSettings = $('googleBookmarksSettings');
        googleBookmarksSettings.querySelector('div.bookmark').show();
        GBookmarksTree.children.forEach(function (bookmark) {
            addBookmark(googleBookmarksSettings, bookmark, true);
        });
    } else if (response == MESSAGES.RESP_FAILED) {
        $('loading').hide();
        $('loadingError').show();
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
            $('loadingError').hide();
            $('loading').show();
            var port = chrome.extension.connect();
            port.onMessage.addListener(processResponse);
            port.postMessage(MESSAGES.REQ_FORCE_LOAD_BOOKMARKS);
        }
    }
}

function showTab() {
    var currentTab = this.parentNode.querySelector('li.fgTab');
    currentTab.setAttribute('class', 'bgTab');
    $(currentTab.getAttribute('for')).hide();
    this.setAttribute('class', 'fgTab');
    $(this.getAttribute('for')).show();
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
    all('input[type=color]').forEach(function () {
        localStorage.removeItem(this.id);
    });
    initWindowSettingsTab();
}

HTMLSelectElement.prototype.selectByValue = function (value) {
    this.selectedIndex = document.evaluate('count(option[@value="' + value + '"]/preceding-sibling::option)',
        this, null, XPathResult.NUMBER_TYPE, null).numberValue;
};

function initWindowSettingsTab() {
    $('fontFamily').selectByValue(getFontFamily());
    $('fontSize').value = getFontSize();
    $('favIconWidth').value = getFavIconWidth();
    $('maxWidth').value = getMaxWidth();
    $('maxWidthMesure').selectByValue(getMaxWidthMesure());
    $('scrollBarWidth').value = getScrollBarWidth();
    $('showTooltip').checked = isShowTooltip();
    $('showURL').checked = isShowURL();
    $('hideCMOpenIncognito').checked = isHideCMOpenIncognito();
    $('hideCMModeSwitcher').checked = isHideCMModeSwitcher();
    all('input[type=color]').forEach(function () {
        this.value = getColor(this.id);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    all('#tabs > li').on('click', showTab);
    $('useChromeBookmarks').on('click', function () {
        setUseGoogleBookmarks(false);
    });
    $('useGoogleBookmarks').on('click', function () {
        setUseGoogleBookmarks(true);
    });

    $('chbFaviconService').on('change', setFaviconService);
    $('gbFaviconService').on('change', setFaviconService);
    all('.selectAllBookmarks').on('click', selectAllBookmarks);

    all('#uiConfig input[type=number]').on('input', setIntProperty);

    all('#uiConfig input[type=checkbox], #switchToNewTab').on('change', setBoolProperty);
    all('#uiConfig input[type=color]').on('change', setColor);
    all('#mouseConfig select').on('change', setMouseButtonAction);

    $('resetWindowSettings').on('click', resetWindowSettings);
    $('fontFamily').on('change', setFontFamily);
    $('maxWidthMesure').on('change', setMenuMaxWidthMesure);
    one('form[name=_xclick]').on('submit', beforeDonate);
    $('labelSeparator').on('input', setLabelSeparator);
    addButtonCSS();
    chrome.i18n.initAll();
    $('donateHeader').innerHTML = chrome.i18n.getMessage('donateHeader');
    showTab.apply(one('li.fgTab'));

    // init Bookmarks tab
    var useGoogleBookmarks = isUseGoogleBookmarks();
    $(useGoogleBookmarks ? 'useGoogleBookmarks' : 'useChromeBookmarks').checked = true;
    setUseGoogleBookmarks(useGoogleBookmarks);
    $('labelSeparator').value = getLabelSeparator();
    $('chbFaviconService').selectByValue(getFaviconServiceForChrome());
    $('gbFaviconService').selectByValue(getFaviconServiceForGoogle());
    chrome.bookmarks.getTree(function (nodes) {
        var chromeBookmarksSettings = $('chromeBookmarksSettings');
        nodes.forEach(function (node) {
            node.children.forEach(function (child) {
                child.children.forEach(function (bookmark) {
                    addBookmark(chromeBookmarksSettings, bookmark, false);
                });
            });
        })
    });

    initWindowSettingsTab();

    // init Mouse tab
    for (var idx = 0; idx < 3; idx++) {
        $('btn' + idx).selectedIndex = getButtonAction(idx);
    }

    if (isSwitchToNewTab()) {
        $('switchToNewTab').checked = true;
    }

    chrome.fontSettings.getFontList(function(fonts) {
        var fontList = $('fontFamily').options,
            defaultFont = getFontFamily();
        fonts.forEach(function(each) {
            fontList.add(new Option(each.displayName, each.fontId, false, each.fontId === defaultFont));
        });
    });
}, false);
