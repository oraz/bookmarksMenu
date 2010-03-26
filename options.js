
function $(id) { return document.getElementById(id); }

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
	delete localStorage['maxWidth'];
	delete localStorage['maxWidthMesure'];
	delete localStorage['fontSize'];
	delete localStorage['winMaxWidth'];
	delete localStorage['winMaxHeight'];
	delete localStorage['favIconWidth'];
	delete localStorage['showTooltip'];
	initWindowSettingsTab();
}

function initWindowSettingsTab()
{
	$('winMaxWidth').value = getWindowMaxWidth();
	$('winMaxHeight').value = getWindowMaxHeight();
	$('showTooltip').checked = isShowTooltip();
	$('fontSize').value = getFontSize();
	$('favIconWidth').value = getFavIconWidth();
	$('maxWidth').value = getMaxWidth();

	var mesure = getMaxWidthMesure();
	var maxWidthMesure = $('maxWidthMesure');
	for(var idx = 0, len = maxWidthMesure.options.length; idx < len; idx++)
	{
		if(maxWidthMesure.options[idx].value == mesure)
		{
			maxWidthMesure.selectedIndex = idx;
			break;
		}
	}
}

window.onload = function()
{
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
	initWindowSettingsTab();
};

// vim:noet
