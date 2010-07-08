
var winMaxWidth;
var winMaxHeight;
var showTooltip;
var useGoogleBookmarks;

function Bookmark(bookmarkNode)
{
	var bookmark = document.createElement('li');
	bookmark.id = bookmarkNode.id;
	var span = document.createElement('span');
	var favicon = document.createElement('img');
	favicon.src = getFavicon(bookmarkNode.url);
	span.appendChild(favicon);
	span.appendChild(document.createTextNode(bookmarkNode.title));
	bookmark.appendChild(span);

	if(bookmarkNode.url == undefined)
	{
		bookmark.isFolder = true;
		bookmark.setAttribute("type", "folder");
		bookmark.childBookmarks = bookmarkNode.children;
	}
	else
	{
		bookmark.isBookmark = true;
		bookmark.setAttribute("type", "bookmark");
		bookmark.url = bookmarkNode.url;
	}
	return bookmark;
}

HTMLBodyElement.prototype.setHeight = function(height)
{
	if(height > winMaxHeight)
	{
		this.style.height = winMaxHeight + 'px';
		this.style.overflowY = 'scroll';
	}
	else
	{
		this.style.height = height + 'px';
	}
}

HTMLBodyElement.prototype.pack = function(bookmarksMenu)
{
	var height = bookmarksMenu.clientHeight + 2;
	this.style.width = bookmarksMenu.clientWidth + 2 +
		(height < winMaxHeight ? 0 : parseInt(getScrollBarWidth())) + 'px';
	this.setHeight(height);
};

with(HTMLUListElement)
{
	prototype.fillFolderContent = function(childBookmarks)
	{
		var len = childBookmarks.length;
		if(len > 0)
		{
			this.numberOfBookmarks = 0;
			for(var i = 0; i < len; i++)
			{
				var bookmark = new Bookmark(childBookmarks[i]);
				this.appendChild(bookmark);
				if(this.isRoot)
				{
					if(isBookmarkHidden(childBookmarks[i].title, useGoogleBookmarks))
					{
						bookmark.hide();
						bookmark.isBookmarkHidden = true;
						bookmark.removeAttribute("type");
					}
					else
					{
						this.hasVisibleBookmarks = true;
					}
					bookmark.parentFolder = bookmark.rootFolder = this;
					bookmark.parentFolderId = childBookmarks[i].parentId;
				}
				else
				{
					bookmark.parentFolder = this.parentElement;
					bookmark.rootFolder = bookmark.parentFolder.rootFolder;
					if(bookmark.isBookmark)
					{
						this.numberOfBookmarks++;
					}
					else
					{
						bookmark.parentFolder.hasSubFolders = true;
						bookmark.fillFolder();
					}
				}
			}
			if(this.numberOfBookmarks > 1)
			{
				this.addSeparator();
				var bookmark = document.createElement('li');
				bookmark.parentFolder = this.parentElement;
				bookmark.rootFolder = bookmark.parentFolder.rootFolder;
				bookmark.setAttribute('type', 'openAllInTabs');
				bookmark.isOpenAll = true;
				var span = document.createElement('span');
				span.className = 'noicon';
				span.appendChild(document.createTextNode(chrome.i18n.getMessage('openAllInTabs')));
				bookmark.appendChild(span);
				this.appendChild(bookmark);
			}
		}
		else if(!this.isRoot)
		{
			this.fillAsEmpty();
		}
	}
	prototype.fillAsEmpty = function()
	{
		this.parentElement.isEmpty = true;
		var li = document.createElement('li');
		var span = document.createElement('span');
		span.className = 'empty';
		span.appendChild(document.createTextNode('(' + chrome.i18n.getMessage('empty') + ')'));
		li.appendChild(span);
		this.appendChild(li);
	}
	prototype.addSeparator = function()
	{
		var separator = document.createElement('li');
		separator.className = 'separator';
		separator.isSeparator = true;
		this.appendChild(separator);
	}
}

with(HTMLLIElement)
{
	prototype.highlight = function()
	{
		this.unHighlightActiveFolder();
		if(this.isFolder)
		{
			this.setAttribute("class", "hover");
		}
		if(showTooltip)
		{
			var span = this.firstChild;
			if(span.offsetWidth < span.scrollWidth && span.title == "")
			{
				span.title = span.innerText;
			}
		}
	}
	prototype.unHighlight = function()
	{
		this.removeAttribute("class");
	}
	prototype.fillFolder = function()
	{
		this.folderContent = document.createElement('ul');
		this.appendChild(this.folderContent);
		this.folderContent.fillFolderContent(this.childBookmarks);
		this.childBookmarks = undefined;
		if(!this.hasSubFolders)
		{
			this.fillTreeDepth();
		}
	}
	prototype.unHighlightActiveFolder = function()
	{
		var activeFolder = this.rootFolder.activeFolder;
		if(activeFolder != undefined)
		{
			var parentFolderId = this.parentFolder.id;
			while(activeFolder != undefined && activeFolder.id != parentFolderId)
			{
				activeFolder.unHighlight();
				activeFolder.folderContent.style.top = '-1px';
				activeFolder = activeFolder.parentFolder;
			}
		}
	}
	prototype.open = function(closeAfterOpen)
	{
		var url = this.url;
		if(isBookmarklet(url))
		{
			chrome.tabs.executeScript(null, { code: unescape(url.substr(11)) });
			if(closeAfterOpen)
			{
				window.close();
			}
		}
		else
		{
			chrome.tabs.getSelected(null, function(tab)
			{
				chrome.tabs.update(tab.id, { url: url });
				if(closeAfterOpen)
				{
					window.close();
				}
			});
		}
	}
	prototype.openInNewTab = function(switchToNewTab)
	{
		chrome.tabs.create({ url: this.url, selected: switchToNewTab || isSwitchToNewTab() });
		window.close();
	}
	prototype.openInNewWindow = function(incognito)
	{
		chrome.windows.create({ url: this.url, incognito: incognito });
		window.close();
	}
	prototype.openInIncognitoWindow = function()
	{
		this.openInNewWindow(true);
	}
	prototype.openAllInTabs = function(firstInCurrentTab)
	{
		this.getBookmarksInFolder().forEach(function(bookmark, idx)
		{
			if(idx == 0 && firstInCurrentTab)
			{
				bookmark.open();
			}
			else if(idx == 0 && navigator.userAgent.indexOf('Linux x86_64') != -1)
			{
				// special fix for Linux x86_64
				chrome.tabs.create({ url: bookmark.url, selected: false }, function(tab)
				{
					chrome.tabs.update(tab.id, { selected: true });
				});
			}
			else
			{
				chrome.tabs.create({ url: bookmark.url, selected: idx == 0 });
			}
		});
		window.close();
	}
	prototype.openAllInNewWindow = function(incognito)
	{
		var urls = new Array();
		this.getBookmarksInFolder().forEach(function(bookmark)
		{
			urls.push(bookmark.url);
		});
		chrome.extension.getBackgroundPage().openUrlsInNewWindow(urls, incognito);
		window.close();
	}
	prototype.openAllInIncognitoWindow = function()
	{
		this.openAllInNewWindow(true);
	}
	prototype.getBookmarksInFolder = function()
	{
		return this.querySelectorAll('li[id="' + this.id + '"]>ul>li[type="bookmark"]');
	}
	prototype.getY = function()
	{
		var body = document.body;
		return this.getBoundingClientRect().top + body.scrollTop - body.clientTop;
	}
	prototype.fillTreeDepth = function()
	{
		if(!this.isRoot && this.treeDepth == undefined)
		{
			var treeDepth = 1;
			this.treeDepth = treeDepth;
			var parentFolder = this.parentFolder;
			while(!parentFolder.isRoot && (parentFolder.treeDepth == undefined || treeDepth > parentFolder.treeDepth))
			{
				parentFolder.treeDepth = ++treeDepth;
				parentFolder = parentFolder.parentFolder;
			}
		}
	}
	prototype.showContextMenu = function(ev)
	{
		var contextMenu = $('contextMenu');
		if(!contextMenu.initialized)
		{
			chrome.i18n.initAll(contextMenu);
			if(useGoogleBookmarks)
			{
				contextMenu.querySelector('li:nth-of-type(8)').hide(); // reorder
			}
			else
			{
				// hide reload and addGBookmark
				contextMenu.querySelectorAll('li:nth-of-type(9), li:nth-of-type(10)').forEach('node.hide()');
			}
			contextMenu.initialized = true;
		}
		contextMenu.selectedBookmark = this;
		contextMenu.setAttribute('for', this.getAttribute('type'));
		var menuItems = contextMenu.getElementsByTagName('li');
		if(this.isFolder)
		{
			menuItems[3].className = // openAllInTabs
				menuItems[4].className = // openAllInNewWindow
				menuItems[5].className = // openAllInIncognitoWindow
				this.lastChild.numberOfBookmarks > 0 ? 'enabled' : 'disabled';
		}
		menuItems[7].className = this.parentElement.childElementCount > 1 ? 'enabled' : 'disabled'; // reorder
		menuItems[11].className = this.isBookmark || this.isFolder && this.isEmpty ? 'enabled' : 'disabled'; // remove
		contextMenu.show();

		var body = document.body;
		var bodyWidth = body.clientWidth;
		var contextMenuStyle = contextMenu.style;
		var contextMenuWidth = contextMenu.clientWidth + 3; // 3 is a border size
		var scrollBarWidth = body.offsetWidth - body.clientWidth;
		if(ev.clientX + contextMenuWidth >= body.clientWidth)
		{
			if(ev.clientX > contextMenuWidth)
			{
				contextMenuStyle.left = ev.clientX - contextMenuWidth + 'px';
			}
			else
			{
				bodyWidth += contextMenuWidth - ev.clientX;
				body.style.width = bodyWidth + scrollBarWidth + 'px';
				contextMenuStyle.left = '1px';
			}
		}
		else
		{
			contextMenuStyle.left = ev.clientX + 'px';
		}

		var bodyHeight = body.scrollHeight;
		if(ev.clientY + contextMenu.clientHeight > body.clientHeight)
		{
			if(contextMenu.clientHeight > body.clientHeight)
			{
				bodyHeight = ev.clientY + contextMenu.clientHeight + 5;
				body.style.height = bodyHeight + 'px';
				contextMenuStyle.top = ev.clientY + 'px';
			}
			else
			{
				contextMenuStyle.top = ev.clientY + body.scrollTop - contextMenu.clientHeight + 'px';
			}
		}
		else
		{
			contextMenuStyle.top = ev.clientY + body.scrollTop + 'px';
		}

		var transparentLayer = $('transparentLayer');
		transparentLayer.style.right = (scrollBarWidth > 0 ? 1 : 0) + 'px';
		transparentLayer.show();
	}
	prototype.remove = function()
	{
		if(!useGoogleBookmarks)
		{
			chrome.bookmarks.remove(this.id);
		}
		else
		{
			chrome.extension.getBackgroundPage().remove(this.id);
		}
		var folderContent = this.parentElement;
		folderContent.removeChild(this);
		if(folderContent.childElementCount == 0)
		{
			if(!useGoogleBookmarks)
			{
				folderContent.fillAsEmpty();
			}
			else
			{
				// remove folder if it's empty
				do
				{
					var folder = folderContent.parentElement;
					folderContent = folder.parentElement;
					chrome.extension.getBackgroundPage().remove(folder.id);
					folderContent.removeChild(folder);
				}
				while(!folderContent.isRoot && folderContent.childElementCount == 0);

			}
		}
		else if(folderContent.numberOfBookmarks-- <= 2 && folderContent.lastElementChild.isOpenAll)
		{
			// remove "open all" and separator
			folderContent.removeChild(folderContent.lastElementChild);
			folderContent.removeChild(folderContent.lastElementChild);
		}
	}
	prototype.displayFolderContent = function()
	{
		if(this.getAttribute("class") == "hover")
		{
			return;
		}
		this.highlight();
		this.rootFolder.activeFolder = this;
		if(this.childBookmarks != undefined)
		{
			this.fillFolder();
		}

		var body = document.body, bodyStyle = body.style;
		var posY = this.getY();
		var contentHeight = this.folderContent.offsetHeight, offset = 1;
		if(posY + contentHeight > body.scrollTop + body.clientHeight)
		{
			offset = posY + contentHeight - body.clientHeight - body.scrollTop;
			if(offset > posY - body.scrollTop)
			{
				offset = posY - body.scrollTop;
			}
			this.folderContent.style.top = '-' + offset + 'px';
		}

		var height = posY - offset + contentHeight;
		if(body.clientHeight < height)
		{
			body.setHeight(height);
		}

		var width = 0, tmp = this;
		do
		{
			width += tmp.clientWidth + 1;
			tmp = tmp.parentFolder;
		} while(!tmp.isRoot);
		if(width < winMaxWidth && this.treeDepth > 1)
		{
			var contentWidth = (winMaxWidth - width) / this.treeDepth;
			if(contentWidth < this.folderContent.clientWidth)
			{
				this.folderContent.style.width = contentWidth + 'px';
			}
		}
		// vscrollBar width = offsetWidth - clientWidth
		width += this.folderContent.clientWidth + 2 + (body.offsetWidth - body.clientWidth);
		if(width < winMaxWidth && body.clientWidth < width)
		{
			bodyStyle.width = width + 'px';
		}
		else if(width > winMaxWidth)
		{
			bodyStyle.width = winMaxWidth + 'px';
			this.folderContent.style.width = (this.folderContent.clientWidth - (width - winMaxWidth)) + 'px';
		}
	}
	prototype.reorder = function(beforeSeparator)
	{
		var folderContent = this.parentElement;
		if(this.parentFolder.isRoot && beforeSeparator == undefined)
		{
			if(!folderContent.firstChild.isSeparator)
				folderContent.firstChild.reorder(true);
			if(!folderContent.lastChild.isSeparator)
				folderContent.lastChild.reorder(false);
			return;
		}
		if(beforeSeparator == undefined)
		{
			beforeSeparator = true;
		}
		var bookmarks = new Array();
		var separator = null;
		do
		{
			var child = beforeSeparator ? folderContent.firstChild : folderContent.lastChild;
			if(child.isSeparator)
			{
				if(beforeSeparator)
				{
					separator = child;
				}
				break;
			}
			bookmarks.push(child);
			folderContent.removeChild(child);
		} while(folderContent.hasChildNodes());

		bookmarks.sort(function(b1, b2)
		{
			if(b1.isFolder && b2.isBookmark) { return -1; }
			if(b2.isFolder && b1.isBookmark) { return 1; }

			var t1 = b1.firstChild.innerText.toLowerCase(),
				t2 = b2.firstChild.innerText.toLowerCase();
			return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
		});

		var folderId = this.parentFolder.isRoot ? this.parentFolderId : this.parentFolder.id;
		for(var idx = 0, len = bookmarks.length; idx < len; idx++)
		{
			folderContent.insertBefore(bookmarks[idx], separator);
			chrome.bookmarks.move(bookmarks[idx].id, { parentId: folderId, index: idx });
		}
	}
}

function unSelect()
{
	var contextMenu = $('contextMenu');
	contextMenu.selectedBookmark.unHighlight();
	contextMenu.hide();
	$('transparentLayer').hide();
	$('gwindow').hide();
}

function processMenu(ev, contextMenu)
{
	var item = ev.srcElement;
	if(item != contextMenu)
	{
		while(!(item instanceof HTMLLIElement))
		{
			item = item.parentElement;
		}
		if(item.getAttribute('class') == 'enabled')
		{
			var action = item.getAttribute('action');
			if(action == 'reload')
			{
				unSelect();
				reloadGBookmarks();
			}
			else if(action == 'addGBookmark')
			{
				unSelect();
				showGoogleBookmarkDialog();
			}
			else
			{
				var bookmark = contextMenu.selectedBookmark;
				bookmark[action].call(bookmark);
				unSelect();
			}
		}
	}
}

function suggestLabel(label)
{
	var suggestDiv = $('suggest');
	if(label.value == '')
	{
		suggestDiv.hide();
		return;
	}
	var mustBeShown = false;
	suggestDiv.querySelectorAll('div > div').forEach(function(node)
	{
		if(node.textContent.toLocaleLowerCase().indexOf(label.value.toLocaleLowerCase()) == 0)
		{
			mustBeShown = true;
			node.show();
		}
		else
		{
			node.hide();
		}
	});
	if(mustBeShown)
	{
		suggestDiv.show();
	}
	else
	{
		suggestDiv.hide();
	}
}

function onSuggestMouseOver(div)
{
	if(div.className == 'currentSuggest')
	{
		return;
	}
	var currentSuggest = div.parentElement.querySelector('.currentSuggest');
	if(currentSuggest)
	{
		currentSuggest.removeAttribute('class');
	}
	div.className = 'currentSuggest';
}

function selectSuggestion(label)
{
	var suggestDiv = $('suggest');
	if(suggestDiv.style.display == 'block')
	{

	}
}

function showGoogleBookmarkDialog()
{
	chrome.tabs.getSelected(null, function(tab)
	{
		$('gbTitle').value = tab.title;
		$('gbURL').value = tab.url;
	});
	$('transparentLayer').show();
	var win = $('gwindow');
	win.show();
	var body = document.body;
	var winWidth = win.clientWidth, bodyWidth = body.clientWidth;
	if(bodyWidth <= winWidth + 10)
	{
		win.style.left = '3px';
		body.style.width = winWidth + 10 + 'px';
	}
	else
	{
		win.style.left = bodyWidth / 2 - winWidth / 2 + 'px';
	}
	var winHeight = win.clientHeight, bodyHeight = body.clientHeight;
	if(bodyHeight <= winHeight + 10)
	{
		win.style.top = '3px';
		body.style.height = winHeight + 10 + 'px';
	}
	else
	{
		win.style.top = bodyHeight / 2 - winHeight / 2 + 'px';
	}
	var gbLabel = win.querySelector('#gbLabel');
	gbLabel.value = '';
	gbLabel.focus();
	var suggest = win.querySelector('#suggest');
	suggest.style.width = suggest.style.maxWidth = gbLabel.clientWidth + 'px';
	suggest.hide();
	var folderNames = new Array();
	var labels = chrome.extension.getBackgroundPage().GBookmarksTree.labels;
	labels.sort();
	var suggestDiv = $('suggest');
	suggestDiv.querySelectorAll('div > *').forEach('node.parentElement.removeChild(node)');
	var gbLabelStyles = window.getComputedStyle(gbLabel);
	suggestDiv.style.marginLeft = parseInt(gbLabelStyles.marginLeft) + parseInt(gbLabelStyles.borderLeftWidth) - 1 + 'px';
	for(var idx = 0, len = labels.length; idx < len; idx++)
	{
		var div = document.createElement('div');
		div.appendChild(document.createTextNode(labels[idx]));
		div.setAttribute('onmouseover', 'onSuggestMouseOver(this)');
//		div.onmouseover = onSuggestMouseOver;
		suggestDiv.appendChild(div);
	}
}

function addGoogleBookmark()
{
	unSelect();
	var port = chrome.extension.connect();
	port.postMessage({
		msg: MESSAGES.REQ_ADD_GOOGLE_BOOKMARK,
		title: $('gbTitle').value,
		url: $('gbURL').value,
		label: $('gbLabel').value
	});
}

function reloadGBookmarks()
{
	document.querySelectorAll('#bookmarksMenu > *').forEach('node.parentElement.removeChild(node)');
	var loading = $('loading');
	if(loading.hasAttribute('i18n'))
	{
		chrome.i18n.initElement(loading);
	}
	loading.style.position = 'fixed';
	loading.show();
	var body = document.body;
	var loadingWidth = loading.clientWidth, bodyWidth = body.clientWidth;
	if(bodyWidth <= loadingWidth + 10)
	{
		loading.style.left = '0px';
		body.style.width = loadingWidth + 10 + 'px';
	}
	else
	{
		loading.style.left = bodyWidth / 2 - loadingWidth / 2 + 'px';
	}
	var port = chrome.extension.connect();
	port.onMessage.addListener(function(response)
	{
		if(response == MESSAGES.RESP_TREE_IS_READY)
		{
			loading.hide();
			var rootFolder = $('bookmarksMenu');
			rootFolder.fillFolderContent(chrome.extension.getBackgroundPage().GBookmarksTree.children);
			body.pack(rootFolder);
		}
		else
		{
			loading.style.color = 'red';
			loading.innerHTML = chrome.i18n.getMessage('failedRetrieveGBookmakrs');
		}
	});
	port.postMessage(MESSAGES.REQ_FORCE_LOAD_BOOKMARKS);
}

document.addEventListener("DOMContentLoaded", function()
{
	winMaxWidth = getWindowMaxWidth();
	winMaxHeight = getWindowMaxHeight();
	showTooltip = isShowTooltip();
	useGoogleBookmarks = isUseGoogleBookmarks();

	var styleSheet = document.styleSheets[0];
	var favIconWidth = getFavIconWidth();
	styleSheet.addRule('body', 'background-color: ' + getColor('bodyClr') + ';');
	styleSheet.addRule('img', 'width: ' + favIconWidth + 'px; height: ' + favIconWidth + 'px;');
	styleSheet.addRule('label, span, #loading', 'font: ' + getFontSize() + 'px "' + getFontFamily() + '";' +
			'color: ' + getColor('fntClr') + ';');
	styleSheet.addRule('ul, #gwindow', 'background-color: ' + getColor('bmBgClr') + ';');

	styleSheet.addRule('.empty, .disabled > span', 'color:' + getColor('disabledItemFntClr') + ';');
	styleSheet.addRule('li[type]:hover > span, .enabled:hover > span, .hover > span',
			'color:' + getColor('activeBmFntClr') + ';' +
			'background-image: -webkit-gradient(linear, left top, left bottom, from(' +
					getColor('activeBmBgClrFrom') + '), to(' + getColor('activeBmBgClrTo') + '));');
	styleSheet.addRule('#bookmarksMenu span', 'max-width: ' + getMaxWidth() + getMaxWidthMesure() + ';');
	styleSheet.addRule('::-webkit-scrollbar', 'width: ' + getScrollBarWidth() + 'px;');

	if(useGoogleBookmarks)
	{
		var loading = $('loading');
		var port = chrome.extension.connect();
		port.onMessage.addListener(function(response)
		{
			if(response == MESSAGES.RESP_TREE_IS_READY)
			{
				loading.hide();
				initBookmarksMenu();
			}
			else if(response == MESSAGES.RESP_NEED_TO_LOAD)
			{
				chrome.i18n.initElement(loading);
				loading.show();
				port.postMessage(MESSAGES.REQ_LOAD_BOOKMARKS)
			}
			else
			{
				loading.style.color = 'red';
				loading.innerHTML = chrome.i18n.getMessage('failedRetrieveGBookmakrs');
			}
		});
		port.postMessage(MESSAGES.REQ_GET_TREE_STATUS);
	}
	else
	{
		chrome.bookmarks.getTree(initBookmarksMenu);
	}
});

function initBookmarksMenu(nodes)
{
	var rootFolder = $('bookmarksMenu');
	rootFolder.isRoot = true;

	if(useGoogleBookmarks)
	{
		rootFolder.fillFolderContent(chrome.extension.getBackgroundPage().GBookmarksTree.children);
	}
	else
	{
		var nodesChildren = nodes[0].children;
		rootFolder.fillFolderContent(nodesChildren[0].children);
		rootFolder.addSeparator();
		var separator = rootFolder.lastChild;
		if(!rootFolder.hasVisibleBookmarks)
		{
			separator.hide();
		}
		rootFolder.hasVisibleBookmarks = false;
		rootFolder.fillFolderContent(nodesChildren[1].children);
		if(!rootFolder.hasVisibleBookmarks)
		{
			separator.hide();
		}
	}
	document.body.pack(rootFolder);

	delete rootFolder.hasVisibleBookmarks;
	rootFolder.onmouseup = function(ev)
	{
		var bookmark = ev.srcElement;
		while(!(bookmark instanceof HTMLLIElement))
		{
			bookmark = bookmark.parentElement;
		}
		var action = parseInt(getButtonAction(ev.button));
		switch(action)
		{
			case 0: // open in current tab
				if(bookmark.isBookmark)
				{
					ev.ctrlKey ? bookmark.openInNewTab()
						: ev.shiftKey ? bookmark.openInNewWindow()
						: bookmark.open(true);
				}
				else if(bookmark.isOpenAll)
				{
					bookmark.parentFolder.openAllInTabs(true);
				}
				break;
			case 1: // open in new tab
				if(bookmark.isBookmark)
				{
					// switch to new tab if shift key pressed
					bookmark.openInNewTab(ev.shiftKey);
				}
				else if(bookmark.isOpenAll)
				{
					bookmark.parentFolder.openAllInTabs(false);
				}
				else if(bookmark.isFolder && bookmark.lastChild.numberOfBookmarks > 0)
				{
					bookmark.openAllInTabs(false);
				}
				break;
			case 2: // open context menu
				if(bookmark.isBookmark || bookmark.isFolder)
				{
					if(bookmark.isBookmark)
					{
						bookmark.className = 'hover';
					}
					bookmark.showContextMenu(ev);
				}
				break;
		}
	};
	rootFolder.onmouseover = function(ev)
	{
		var bookmark = ev.srcElement;
		if(!(bookmark instanceof HTMLUListElement))
		{
			while(!(bookmark instanceof HTMLLIElement))
			{
				bookmark = bookmark.parentElement;
			}
			if(bookmark.isBookmark || bookmark.isOpenAll)
			{
				bookmark.highlight();
			}
			else if(bookmark.isFolder)
			{
				bookmark.displayFolderContent();
			}
		}
	};

	var favIcon = rootFolder.querySelector('li[type] img');
	var iconMarginRight = window.getComputedStyle(favIcon).marginRight; // contains '3px'
	var textPaddingLeft = favIcon.offsetLeft + favIcon.scrollWidth + parseInt(iconMarginRight);
	document.styleSheets[0].addRule('.noicon', 'padding-left:' + textPaddingLeft + 'px;');
}

// vim:noet
