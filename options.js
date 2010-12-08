
function setMouseButtonAction(select, button)
{
	localStorage[button] = select.selectedIndex;
}

function setIntProperty(inputField)
{
	var value = parseInt(inputField.value);
    var maxLimit = parseInt(inputField.getAttribute('max'));
    var minLimit = parseInt(inputField.getAttribute('min'));
	if(isNaN(inputField.value) || isNaN(value) ||
		(!isNaN(minLimit) && value < minLimit) ||
		(!isNaN(maxLimit) && value > maxLimit))
	{
		
		inputField.setAttribute('class', 'error');
		return;
	}
	inputField.removeAttribute('class');
	localStorage[inputField.id] = value;
}

function setBoolProperty(property, value)
{
	localStorage[property] = value;
}

function setFontFamily(fontFamily)
{
	localStorage['fontFamily'] = fontFamily.value;
}

function setMenuMaxWidthMesure(maxWidthMesure)
{
	localStorage['maxWidthMesure'] = maxWidthMesure.value;
}

function setBookmarkHidden(title, useGoogleBookmarks, hidden)
{
	var key = (useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title;
	if(hidden == true)
	{
		localStorage[key] = true;
	}
	else
	{
		delete localStorage[key];
	}
}

function setColor(el)
{
	if(/^[0-9A-F]{6}$/i.test(el.value))
	{
		localStorage[el.id] = el.value;
	}
}

function setUseGoogleBookmarks(useGoogleBookmarks)
{
	localStorage['useGoogleBookmarks'] = useGoogleBookmarks;
	$('chromeBookmarksSettings').style.display = useGoogleBookmarks ? 'none' : 'block';
	$('googleBookmarksSettings').style.display = useGoogleBookmarks ? 'block' : 'none';
	changeBookmarkMode(useGoogleBookmarks);
	if(useGoogleBookmarks)
	{
		clearGoogleBookmarksDiv();
		var port = chrome.extension.connect();
		port.onMessage.addListener(processResponse);
		port.postMessage(MESSAGES.REQ_GET_TREE_STATUS);
	}
}

function clearGoogleBookmarksDiv()
{
	var gbookmarks = document.querySelectorAll('#googleBookmarksSettings > .gbookmark');
	if(gbookmarks)
	{
		gbookmarks.forEach(function()
		{
			this.parentElement.removeChild(this);
		});
	}
}

function addBookmark(divSettings, bookmark, useGoogleBookmarks)
{
	var div = document.createElement('div');
	div.setAttribute('class', useGoogleBookmarks ? 'gbookmark' : 'bookmark');

	var checkbox = document.createElement('input');
	checkbox.setAttribute('type', 'checkbox');
	if(!isBookmarkHidden(bookmark.title, useGoogleBookmarks))
	{
		checkbox.setAttribute('checked', 'checked');
	}
	checkbox.setAttribute('onchange',
			'setBookmarkHidden("' + bookmark.title + '", ' + useGoogleBookmarks + ', !this.checked)');

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

function processResponse(response, port)
{
	if(response == MESSAGES.RESP_NEED_TO_LOAD)
	{
		$('loadingError').hide();
		$('loading').show();
		port.postMessage(MESSAGES.REQ_LOAD_BOOKMARKS);
	}
	else if(response == MESSAGES.RESP_TREE_IS_READY)
	{
		$('loading').hide();
		var GBookmarksTree = chrome.extension.getBackgroundPage().GBookmarksTree;
		var googleBookmarksSettings = $('googleBookmarksSettings');
		GBookmarksTree.children.forEach(function(bookmark)
		{
			addBookmark(googleBookmarksSettings, bookmark, true);
		});
	}
	else if(response == MESSAGES.RESP_FAILED)
	{
		$('loading').hide();
		$('loadingError').show();
	}
}

function setLabelSeparator(labelSeparator)
{
	var newLabelSeparator = labelSeparator.value;
	if(newLabelSeparator == '')
	{
		labelSeparator.setAttribute('class', 'error');
	}
	else
	{
		labelSeparator.removeAttribute('class');
		if(newLabelSeparator != getLabelSeparator())
		{
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

function showTab(span)
{
	var currentTab = span.parentNode;
	var tabs = currentTab.parentNode.getElementsByTagName('li');
	for(var idx = tabs.length - 1; idx >= 0; idx--)
	{
		if(tabs[idx].getAttribute('class') == 'fgTab')
		{
			tabs[idx].setAttribute('class', 'bgTab');
			$(tabs[idx].getAttribute('for')).hide();
			break;
		}
	}
	currentTab.setAttribute('class', 'fgTab');
	$(currentTab.getAttribute('for')).show();
}

function setFaviconService(obj)
{
	localStorage[obj.id] = obj.value;
}

function resetWindowSettings()
{
	with(localStorage)
	{
		removeItem('winMaxWidth');
		removeItem('winMaxHeight');
		removeItem('fontFamily');
		removeItem('fontSize');
		removeItem('favIconWidth');
		removeItem('maxWidth');
		removeItem('maxWidthMesure');
		removeItem('scrollBarWidth');
		removeItem('showTooltip');
		removeItem('showURL');
		removeItem('hideCMOpenIncognito');
		removeItem('hideCMModeSwitcher');
	}
	document.querySelectorAll('input.color').forEach(function()
	{
		localStorage.removeItem(this.id);
	});
	initWindowSettingsTab();
}

HTMLSelectElement.prototype.selectByValue = function(value)
{
	this.selectedIndex = document.evaluate('count(option[@value="' + value + '"]/preceding-sibling::option)',
			this, null, XPathResult.NUMBER_TYPE, null).numberValue;
}

function initWindowSettingsTab()
{
	$('winMaxWidth').value = getWindowMaxWidth();
	$('winMaxHeight').value = getWindowMaxHeight();
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
	document.querySelectorAll('input.color').forEach(function()
	{
		this.color.fromString(getColor(this.id));
	});
}

document.addEventListener("DOMContentLoaded", function()
{
	var appVersion = navigator.appVersion;
	var ChromeVersion = 5;
	if(appVersion.indexOf("Chrome/") >= 0)
	{
		ChromeVersion = parseInt(appVersion.substr(appVersion.indexOf("Chrome/") + 7));
	}
	if(ChromeVersion < 8)
	{
		document.querySelectorAll('input[type="number"]').forEach(function()
		{
			this.setAttribute('type', 'text');
		});
	}
	addButtonCSS();
	chrome.i18n.initAll();
	$('donateHeader').innerHTML = chrome.i18n.getMessage('donateHeader');
	showTab(document.querySelector('li.fgTab span'));

	// init Bookmarks tab
	var useGoogleBookmarks = isUseGoogleBookmarks();
	$(useGoogleBookmarks ? 'useGoogleBookmarks' : 'useChromeBookmarks').checked = true;
	setUseGoogleBookmarks(useGoogleBookmarks);
	$('labelSeparator').value = getLabelSeparator();
	$('chbFaviconService').selectByValue(getFaviconServiceForChrome());
	$('gbFaviconService').selectByValue(getFaviconServiceForGoogle());
	chrome.bookmarks.getTree(function(nodes)
	{
		var chromeBookmarksSettings = $('chromeBookmarksSettings');
		nodes.forEach(function(node)
		{
			node.children.forEach(function(child)
			{
				child.children.forEach(function(bookmark)
				{
					addBookmark(chromeBookmarksSettings, bookmark, false);
				});
			});
		})
	});

	// init UI tab
	jscolor.init();
	initWindowSettingsTab();

	// init Mouse tab
	for(var idx = 0; idx < 3; idx++)
	{
		$('btn' + idx).selectedIndex = getButtonAction(idx);
	}

	if(isSwitchToNewTab())
	{
		$('switchToNewTab').checked = true;
	}

}, false);
