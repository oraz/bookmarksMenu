
// vim:noet ts=4 sw=4

var winMaxWidth = getWindowMaxWidth();
var winMaxHeight = getWindowMaxHeight();
var showTooltip = isShowTooltip();

function $(id)
{
	return document.getElementById(id);
}

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
		bookmark.childBookmarks = bookmarkNode.children;
		bookmark.onmouseover = bookmark.displayFolderContent;
	}
	else
	{
		bookmark.isBookmark = true;
		bookmark.url = bookmarkNode.url;
		bookmark.onmouseover = bookmark.highlight;
		bookmark.onmouseout = bookmark.unHighlight;
	}
	return bookmark;
}


with(HTMLElement)
{
	prototype.show = function() { this.style.display = 'block'; }
	prototype.hide = function() { this.style.display = 'none'; }
}

with(HTMLUListElement)
{
	prototype.fillFolderContent = function(childBookmarks, completely)
	{
		var len = childBookmarks.length;
		if(len > 0)
		{
			var countBookmarks = 0;
			for(var i = 0; i < len; i++)
			{
				var bookmark = new Bookmark(childBookmarks[i]);
				this.appendChild(bookmark);
				if(this.isRoot)
				{
					if(isBookmarkHidden(childBookmarks[i].title))
					{
						bookmark.hide();
						bookmark.isBookmarkHidden = true;
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
						countBookmarks++;
					}
				}
				if(bookmark.isFolder && completely)
				{
					bookmark.parentFolder.hasSubFolders = true;
					bookmark.fillFolder();
				}
			}
			if(!this.isRoot && countBookmarks > 1)
			{
				this.addSeparator();
				var bookmark = document.createElement('li');
				bookmark.parentFolder = this.parentElement;
				bookmark.rootFolder = bookmark.parentFolder.rootFolder;
				bookmark.onmouseover = bookmark.highlight;
				bookmark.onmouseout = bookmark.unHighlight;
				var span = document.createElement('span');
				if(bookmark.rootFolder.textPaddingLeft != undefined)
				{
					span.style.paddingLeft = bookmark.rootFolder.textPaddingLeft;
				}
				else
				{
					var favIcon;
					for(var idx = bookmark.rootFolder.childElementCount - 1; idx >= 0; idx--)
					{
						var tmp = bookmark.rootFolder.childNodes[idx];
						if((tmp.isFolder || tmp.isBookmark) && !tmp.isBookmarkHidden)
						{
							favIcon = tmp.firstChild.firstChild;
							break;
						}
					}
					var iconMarginRight = window.getComputedStyle(favIcon).marginRight; // contains '3px'
					span.style.paddingLeft =
						bookmark.rootFolder.textPaddingLeft =
						favIcon.offsetLeft + favIcon.scrollWidth + parseInt(iconMarginRight);
				}
				span.appendChild(document.createTextNode("Open All in Tabs"));
				bookmark.appendChild(span);
				bookmark.isOpenAll = true;
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
		this.innerHTML = '<li class="empty"><span>Empty</span></li>';
		this.parentElement.isEmpty = true;
	}
	prototype.addSeparator = function()
	{
		var separator = document.createElement('li');
		separator.className = 'separator';
		separator.isSeparator = true;
		this.appendChild(separator);
	}
	prototype.openAllInTabs = function()
	{
		for(var idx in this.childNodes)
		{
			var bookmark = this.childNodes[idx];
			if(bookmark.isBookmark)
			{
				chrome.tabs.create({ url: bookmark.url, selected: false });
			}
		}
		window.close();
	}
}

with(HTMLLIElement)
{
	prototype.highlight = function()
	{
		this.unHighlightActiveFolder();
		this.setAttribute("class", "hover");
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
		if(!this.isSelected)
		{
			this.removeAttribute("class");
		}
	}
	prototype.fillFolder = function()
	{
		this.folderContent = document.createElement('ul');
		this.appendChild(this.folderContent);
		this.folderContent.fillFolderContent(this.childBookmarks, true);
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
	prototype.open = function()
	{
		var url = this.url;
		if(isJsURL(url))
		{
			chrome.tabs.executeScript(null, { code: unescape(url.substr(11)) });
			window.close();
		}
		else
		{
			chrome.tabs.getSelected(null, function(tab)
			{
				chrome.tabs.update(tab.id, { url: url });
				window.close();
			});
		}
	}
	prototype.openInNewTab = function()
	{
		chrome.tabs.create({ url: this.url, selected: isSwitchToNewTab() });
		window.close();
	}
	prototype.openInNewWindow = function()
	{
		chrome.windows.create({ url: this.url });
		window.close();
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
	prototype.showPopupMenu = function(ev)
	{
		var popupMenu = $('popupMenu');
		popupMenu.selectedBookmark = this;
		popupMenu.configMenu({ 0: this.isBookmark, 1: this.isBookmark,
				3: this.parentElement.childElementCount > 1,
				5: this.isBookmark || this.isFolder && this.isEmpty });
		popupMenu.show();

		var body = document.body;
		var bodyWidth = body.clientWidth;
		var popupMenuStyle = popupMenu.style;
		if(ev.clientX + popupMenu.clientWidth > body.clientWidth)
		{
			if(popupMenu.clientWidth > body.clientWidth)
			{
				bodyWidth = popupMenu.clientWidth + 7;
				body.style.width = bodyWidth + 'px';
			}
			popupMenuStyle.left = bodyWidth - popupMenu.clientWidth - 5 + 'px';
		}
		else
		{
			popupMenuStyle.left = ev.clientX + 'px';
		}

		var bodyHeight = body.scrollHeight;
		if(ev.clientY + popupMenu.clientHeight > body.clientHeight)
		{
			if(popupMenu.clientHeight > body.clientHeight)
			{
				bodyHeight = ev.clientY + popupMenu.clientHeight + 5;
				body.style.height = bodyHeight + 'px';
				popupMenuStyle.top = ev.clientY + 'px';
			}
			else
			{
				popupMenuStyle.top = ev.clientY + body.scrollTop - popupMenu.clientHeight + 'px';
			}
		}
		else
		{
			popupMenuStyle.top = ev.clientY + body.scrollTop + 'px';
		}

		var transparentLayer = $('transparentLayer');
		var transparentLayerStyle = transparentLayer.style;
		transparentLayerStyle.width = bodyWidth - 2 + 'px';
		transparentLayerStyle.height = bodyHeight - 2 + 'px';
		transparentLayer.show();
	}
	prototype.remove = function()
	{
		chrome.bookmarks.remove(this.id);
		var folderContent = this.parentElement;
		folderContent.removeChild(this);
		if(folderContent.childElementCount == 0)
		{
			folderContent.fillAsEmpty();
		}
		else
		{
			var bookmarksCount = 0;
			for(var idx in folderContent.childNodes)
			{
				if(folderContent.childNodes[idx].isBookmark)
				{
					bookmarksCount++;
				}
			}
			if(bookmarksCount < 2 && folderContent.lastElementChild.isOpenAll)
			{
				// remove "open all" and separator
				folderContent.removeChild(folderContent.lastElementChild);
				folderContent.removeChild(folderContent.lastElementChild);
			}
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
			// need to change width to take effect
			bodyStyle.height = (height > winMaxHeight ? winMaxHeight : height) + 'px';
		}

		var width = 0, tmp = this;
		do
		{
			width += tmp.clientWidth + 1;
			tmp = tmp.parentFolder;
		} while(!tmp.isRoot);
		if(width < winMaxWidth && this.treeDepth > 1)
		{
			var offset = (winMaxWidth - width) / this.treeDepth;
			if(offset < this.folderContent.clientWidth)
			{
				this.folderContent.style.left = '-' + offset + 'px';
			}
		}
		var scrollBarWidth = body.scrollHeight > body.clientHeight ? 7 : 0;
		width += this.folderContent.clientWidth + 2 + scrollBarWidth;
		if(width < winMaxWidth && body.clientWidth < width)
		{
			bodyStyle.width = width + 'px';
		}
		else if(width > winMaxWidth)
		{
			bodyStyle.width = winMaxWidth + 'px';
			this.folderContent.style.left = '-' + (this.folderContent.clientWidth - (width - winMaxWidth)) + 'px';
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
	var popupMenu = $('popupMenu');
	var bookmark = popupMenu.selectedBookmark;
	bookmark.isSelected = false;
	bookmark.unHighlight();
	popupMenu.hide();
	$('transparentLayer').hide();
}

function processMenu(ev, action)
{
	if(ev.button == 0)
	{
		var popupMenu = ev.srcElement;
		while(!(popupMenu instanceof HTMLUListElement))
		{
			popupMenu = popupMenu.parentElement;
		}
		var bookmark = popupMenu.selectedBookmark;
		bookmark[action].call(bookmark);
	}
	unSelect();
}

function parseBookmarkTree(nodes)
{
	var rootFolder = $('bookmarksTree');
	rootFolder.isRoot = true;

	var nodesChildren = nodes[0].children;
	rootFolder.fillFolderContent(nodesChildren[0].children, false);
	rootFolder.addSeparator();
	var separator = rootFolder.lastChild;
	if(!rootFolder.hasVisibleBookmarks)
	{
		separator.hide();
	}
	rootFolder.hasVisibleBookmarks = false;
	rootFolder.fillFolderContent(nodesChildren[1].children, false);
	if(!rootFolder.hasVisibleBookmarks)
	{
		separator.hide();
	}

	var height = rootFolder.clientHeight + 2;
	var bodyStyle = document.body.style;
	bodyStyle.width = rootFolder.clientWidth + 2 + (height < winMaxHeight ? 0 : 7) + 'px';
	bodyStyle.height = (height < winMaxHeight ? height : winMaxHeight) + 'px';

	delete rootFolder.hasVisibleBookmarks;
}

document.addEventListener('DOMContentLoaded', function()
{
	document.body.style.fontSize = getFontSize() + 'px';
	var styleSheet = document.styleSheets[document.styleSheets.length - 1];
	var favIconWidth = getFavIconWidth();
	styleSheet.addRule('span > img', 'width: ' + favIconWidth + 'px; height: ' + favIconWidth + 'px;');
	styleSheet.addRule('#bookmarksTree span', 'max-width: ' + getMaxWidth() + getMaxWidthMesure() + ';');

	chrome.bookmarks.getTree(parseBookmarkTree);

	$('bookmarksTree').onmouseup = function(ev)
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
					ev.ctrlKey ? bookmark.openInNewTab() : bookmark.open();
				}
				else if(bookmark.isOpenAll)
				{
					bookmark.parentElement.openAllInTabs();
				}
				break;
			case 1: // open in new tab
				if(bookmark.isBookmark)
				{
					bookmark.openInNewTab();
				}
				break;
			case 2: // open popup menu
				if(bookmark.isBookmark || bookmark.isFolder)
				{
					bookmark.isSelected = true;
					bookmark.showPopupMenu(ev);
				}
				break;
		}
	};
	$('popupMenu').configMenu = function(config)
	{
		var popupMenuItems = this.getElementsByTagName('li');
		for(var idx in config)
		{
			var item = popupMenuItems[idx];
			if(config[idx])
			{
				item.className = "enabled";
				item.setAttribute('onmouseup', "processMenu(event, '" + item.getAttribute("action") + "')");
				item.setAttribute("onmouseover", "this.className = 'hover'");
				item.setAttribute("onmouseout", "this.className = 'enabled'");
			}
			else
			{
				item.className = "disabled";
				item.removeAttribute("onmouseup");
				item.removeAttribute("onmouseover");
				item.removeAttribute("onmouseout");
			}
		}
	};
}, false);

