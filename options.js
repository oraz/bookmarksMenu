
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

function setBookmarkHidden(title, hidden)
{
	if(hidden == true)
	{
		localStorage['bookmark_' + title] = true;
	}
	else
	{
		delete localStorage['bookmark_' + title];
	}
}

function setColor(el)
{
	if(/^[0-9A-F]{6}$/i.test(el.value))
	{
		localStorage[el.id] = el.value;
	}
}

function showHideElem(id)
{
	var elemStyle = $(id).style;
	elemStyle.display = elemStyle.display == 'none' ? 'inline' : 'none';
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
//		removeItem('scrollBarWidth');
		removeItem('showTooltip');
	}
	XPath('//input[@class="color"]', document, XPathResult.UNORDERED_NODE_ITERATOR_TYPE).forEach(function(node)
	{
		localStorage.removeItem(node.id);
	});
	initWindowSettingsTab();
}

HTMLSelectElement.prototype.selectByValue = function(value)
{
	this.selectedIndex = XPath('count(option[@value="' + value + '"]/preceding-sibling::option)',
			this, XPathResult.NUMBER_TYPE).numberValue;
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
//	$('scrollBarWidth').value = getScrollBarWidth();
	$('showTooltip').checked = isShowTooltip();
	XPath('//input[@class="color"]', document, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE).forEach(function(node)
	{
		node.color.fromString(getColor(node.id));
	});
}

document.addEventListener("DOMContentLoaded", function()
{
	chrome.i18n.initElements();
	for(var idx = 0; idx < 3; idx++)
	{
		$('btn' + idx).selectedIndex = getButtonAction(idx);
	}

	if(isSwitchToNewTab())
	{
		$('switchToNewTab').checked = true;
	}

	chrome.bookmarks.getTree(function(nodes)
	{
		var bookmarksShowHide = $('bookmarksShowHide');
		for(var i = 0, nodesLength = nodes.length; i < nodesLength; i++)
		{
			var children = nodes[i].children;
			for(var j = 0, childrenLength = children.length; j < childrenLength; j++)
			{
				var children2 = children[j].children;
				for(var k = 0, children2Length = children2.length; k < children2Length; k++)
				{
					var child = children2[k];
					var div = document.createElement('div');
					div.setAttribute('class', 'bookmark');

					var checkbox = document.createElement('input');
					checkbox.setAttribute('type', 'checkbox');
					if(!isBookmarkHidden(child.title))
					{
						checkbox.setAttribute('checked', 'checked');
					}
					checkbox.setAttribute('onchange', 'setBookmarkHidden("' + child.title + '", !this.checked)');

					var label = document.createElement('label');
					label.appendChild(checkbox);

					var img = document.createElement('img');
					img.setAttribute('class', 'favicon');
					img.setAttribute('src', getFavicon(child.url));
					label.appendChild(img);
					label.appendChild(document.createTextNode(child.title));

					div.appendChild(label);

					bookmarksShowHide.appendChild(div);
				}
			}
		}
	});
	jscolor.init();
	initWindowSettingsTab();
}, false);

// vim:noet
