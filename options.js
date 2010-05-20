
function setMouseButtonAction(select, button)
{
	localStorage[button] = select.selectedIndex;
}

function setIntProperty(input, maxLimit)
{
	var value = input.value;
	var re = /^\d+$/;
	if(!re.test(value) || (maxLimit != undefined && value > maxLimit))
	{
		input.setAttribute('class', 'error');
		return;
	}
	input.removeAttribute('class');
	localStorage[input.id] = value;
}

function setBoolProperty(property, value)
{
	if(value)
	{
		localStorage[property] = true;
	}
	else
	{
		delete localStorage[property];
	}
}

function setFontFamily(fontFamily)
{
	localStorage['fontFamily'] = fontFamily.options[fontFamily.selectedIndex].value;
}

function setMenuMaxWidthMesure(maxWidthMesure)
{
	localStorage['maxWidthMesure'] = maxWidthMesure.options[maxWidthMesure.selectedIndex].value;
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
	document.querySelector('.chromeBookmarksSettings').style.display = useGoogleBookmarks ? 'none' : 'block';
	document.querySelector('.googleBookmarksSettings').style.display = useGoogleBookmarks ? 'block' : 'none';
	chrome.extension.getBackgroundPage().setUseGoogleBookmarks(useGoogleBookmarks);
	if(useGoogleBookmarks)
	{
		clearGoogleBookmarksDiv();
		var port = chrome.extension.connect();
		port.postMessage({ msg: 'GetTreeStatus' });
		port.onMessage.addListener(function(msg)
		{
			if(msg == 'NeedToLoad')
			{
				$('loading').show();
				port.postMessage({ msg: 'LoadGBookmarks' });
			}
			else
			{
				processResponse(msg);
			}
		});
	}
}

function clearGoogleBookmarksDiv()
{
	var gbookmarks = document.querySelectorAll('.googleBookmarksSettings > .gbookmark');
	if(gbookmarks)
	{
		gbookmarks.forEach('node.parentElement.removeChild(node)');
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
	img.setAttribute('src', getFavicon(bookmark.url));
	label.appendChild(img);
	label.appendChild(document.createTextNode(bookmark.title));
	div.appendChild(label);
	divSettings.appendChild(div);
}

function processResponse(response)
{
	$('loading').hide();
	if(response == 'Ok' || response == 'TreeIsReady')
	{
		var GBookmarksTree = chrome.extension.getBackgroundPage().GBookmarksTree;
		var googleBookmarksSettings = document.querySelector('.googleBookmarksSettings');
		GBookmarksTree.children.forEach(function(bookmark)
		{
			addBookmark(googleBookmarksSettings, bookmark, true);
		});
	}
	else if(response == 'Failed')
	{
		alert(chrome.i18n.getMessage('failedRetrieveGBookmakrs'));
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
			$('loading').show();
			var port = chrome.extension.connect();
			port.postMessage({ msg: 'LoadGBookmarks', reload: true });
			port.onMessage.addListener(processResponse);
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
			$(tabs[idx].getAttribute('for')).style.display = 'none';
			break;
		}
	}
	currentTab.setAttribute('class', 'fgTab');
	$(currentTab.getAttribute('for')).style.display = 'block';
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
	}
	document.querySelectorAll('input.color').forEach('localStorage.removeItem(node.id)');
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
	document.querySelectorAll('input.color').forEach('node.color.fromString(getColor(node.id))');
}

document.addEventListener("DOMContentLoaded", function()
{
	chrome.i18n.initAll();
	showTab(document.querySelector('li.fgTab span'));

	// init Bookmarks tab
	var useGoogleBookmarks = isUseGoogleBookmarks();
	$(useGoogleBookmarks ? 'useGoogleBookmarks' : 'useChromeBookmarks').checked = true;
	setUseGoogleBookmarks(useGoogleBookmarks);
	$('labelSeparator').value = getLabelSeparator();
	chrome.bookmarks.getTree(function(nodes)
	{
		var chromeBookmarksSettings = document.querySelector('.chromeBookmarksSettings');
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

// vim:noet
