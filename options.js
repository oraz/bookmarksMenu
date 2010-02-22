
// vim:noet ts=4 sw=4

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

function setSwitchToNewTab(switchToNewTab)
{
	if(switchToNewTab)
	{
		localStorage['switchToNewTab'] = true;
	}
	else
	{
		delete localStorage['switchToNewTab'];
	}
}

function showHideElem(id)
{
	var elemStyle = document.getElementById(id).style;
	elemStyle.display = elemStyle.display == 'none' ? 'inline' : 'none';
}

function showTab(anchor, tabId)
{
	var divs = ['mouseConfig', 'tabsConfig', 'bookmarksShowHide', 'treeConfig'];
	for(var idx = divs.length - 1; idx >= 0; idx--)
	{
		document.getElementById(divs[idx]).style.display = 'none';
	}
	document.getElementById(tabId).style.display = 'block';

	var tabs = document.getElementById('tabs').getElementsByTagName('li');
	for(var idx = tabs.length - 1; idx >= 0; idx--)
	{
		tabs[idx].setAttribute('class', 'bgTab');
	}
	anchor.parentNode.setAttribute('class', 'fgTab');
	return false;
}

window.onload = function()
{
	for(var idx = 0; idx < 3; idx++)
	{
		document.getElementById('btn' + idx).selectedIndex = getButtonAction(idx);
	}

	if(isSwitchToNewTab())
	{
		document.getElementById('switchToNewTab').checked = true;
	}

	document.getElementById('winMaxWidth').value = getWindowMaxWidth();
	document.getElementById('winMaxHeight').value = getWindowMaxHeight();

	document.getElementById('fontSize').value = getFontSize();

	document.getElementById('maxWidth').value = getMaxWidth();
	var mesure = getMaxWidthMesure();
	var maxWidthMesure = document.getElementById('maxWidthMesure');
	for(var idx = 0, len = maxWidthMesure.options.length; idx < len; idx++)
	{
		if(maxWidthMesure.options[idx].value == mesure)
		{
			maxWidthMesure.selectedIndex = idx;
			break;
		}
	}

	chrome.bookmarks.getTree(function(nodes)
	{
		var bookmarksShowHide = document.getElementById('bookmarksShowHide');
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
}
