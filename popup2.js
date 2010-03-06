
// vim:noet ts=4 sw=4

var winMaxWidth = getWindowMaxWidth(),
	winMaxHeight = getWindowMaxHeight();

function $(id)
{
	return document.getElementById(id);
}

function Bookmark(bookmarkNode)
{
	var bookmark = document.createElement('li');
	bookmark.id = bookmarkNode.id;
	var label = document.createElement('label'),
		favicon = document.createElement('img');
	favicon.src = getFavicon(bookmarkNode.url);
	label.appendChild(favicon);
	label.appendChild(document.createTextNode(bookmarkNode.title));
	bookmark.appendChild(label);

	if(bookmarkNode.url == undefined)
	{
		bookmark.isFolder = true;
		bookmark.childBookmarks = bookmarkNode.children;
		bookmark.onmouseover = bookmark.displayFolderContent;
	}
	else
	{
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
			for(var i = 0; i < len; i++)
			{
				if(this.isRoot && isBookmarkHidden(childBookmarks[i].title))
				{
					continue;
				}
				var bookmark = new Bookmark(childBookmarks[i]);
				this.appendChild(bookmark);
				if(this.isRoot)
				{
					bookmark.parentFolder = bookmark.rootFolder = this;
				}
				else
				{
					bookmark.parentFolder = this.parentElement;
					bookmark.rootFolder = bookmark.parentFolder.rootFolder;
				}
				if(bookmark.isFolder && completely)
				{
					bookmark.parentFolder.hasSubFolders = true;
					bookmark.fillFolder();
				}
			}
		}
		else if(!this.isRoot)
		{
			this.fillAsEmpty();
		}
	}
	prototype.fillAsEmpty = function()
	{
		var li = document.createElement('li');
		li.setAttribute('class', 'empty');
		var label = document.createElement('label');
		label.appendChild(document.createTextNode('Empty'));
		li.appendChild(label);
		this.appendChild(li);
		this.parentElement.isEmpty = true;
	}
}

with(HTMLLIElement)
{
	prototype.highlight = function()
	{
		this.unHighlightActiveFolder();
		this.setAttribute("class", "hover");
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
		if(this.isFolder)
		{
			this.folderContent = document.createElement('ul');
			this.appendChild(this.folderContent);
			this.folderContent.fillFolderContent(this.childBookmarks, true);
			if(!this.hasSubFolders)
			{
				this.fillTreeDepth();
			}
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
		var y = 0, el = this;
		do
		{
			if(el.offsetTop > 0)
			{
				y += el.offsetTop;
			}
			el = el.offsetParent;
		} while(el != null);
		return y;
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
		var popupMenuItems = popupMenu.getElementsByTagName('li');
		if(!this.isFolder)
		{
			popupMenuItems[0].className = popupMenuItems[1].className = "enabled";
			popupMenuItems[0].setAttribute('onmouseup', "processMenu(event, 'openInNewTab')");
			popupMenuItems[1].setAttribute('onmouseup', "processMenu(event, 'openInNewWindow')");
		}
		else
		{
			popupMenuItems[0].className = popupMenuItems[1].className = "disabled";
			popupMenuItems[0].onmouseup = popupMenuItems[1].onmouseup = undefined;
		}
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
	}
	prototype.displayFolderContent = function()
	{
		if(this.getAttribute("class") == "hover")
		{
			return;
		}
		this.highlight();
		this.rootFolder.activeFolder = this;

		var body = document.body,
			bodyStyle = body.style,
			height = this.getY() + this.folderContent.clientHeight + 2;
		if(body.clientHeight < height)
		{
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
		var scrollBarWidth = body.scrollHeight > body.clientHeight ? 15 : 0;
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

chrome.bookmarks.getTree(function(nodes)
{
	document.body.style.fontSize = getFontSize() + 'px';

	var styleSheet = document.styleSheets[document.styleSheets.length - 1];
	var favIconWidth = getFavIconWidth();
	styleSheet.addRule('label > img', 'width: ' + favIconWidth + 'px; height: ' + favIconWidth + 'px;');
	styleSheet.addRule('#bookmarksTree label', 'max-width: ' + getMaxWidth() + getMaxWidthMesure() + ';');

	var rootFolder = document.createElement('ul');
	rootFolder.isRoot = true;
	rootFolder.id = rootFolder.className = 'bookmarksTree';
	rootFolder.setAttribute('onmousedown', 'return false;');
	rootFolder.onmouseup = function(ev)
	{
		var bookmark = ev.srcElement;
		while(!(bookmark instanceof HTMLLIElement))
		{
			bookmark = bookmark.parentElement;
		}
		if(bookmark.className == "separator")
		{
			return;
		}
		var action = parseInt(getButtonAction(ev.button));
		switch(action)
		{
			case 0: // open in current tab
				if(!bookmark.isFolder)
				{
					ev.ctrlKey ? bookmark.openInNewTab() : bookmark.open();
				}
				break;
			case 1: // open in new tab
				if(!bookmark.isFolder)
				{
					bookmark.openInNewTab();
				}
				break;
			case 2: // open popup menu
				if(!bookmark.isFolder || bookmark.isEmpty)
				{
					bookmark.isSelected = true;
					bookmark.showPopupMenu(ev);
				}
				break;
		}
	};

	document.body.appendChild(rootFolder);
	for(var i = 0, nodesLength = nodes.length; i < nodesLength; i++)
	{
		var children = nodes[i].children;
		for(var j = 0, childrenLength = children.length; j < childrenLength; j++)
		{
			rootFolder.fillFolderContent(children[j].children, false);
			if(j + 1 < childrenLength && rootFolder.childElementCount > 0)
			{
				var separator = document.createElement('li');
				separator.className = 'separator';
				rootFolder.appendChild(separator);
			}
		}
	}

	var height = rootFolder.clientHeight + 2;
	var bodyStyle = document.body.style;
	bodyStyle.width = rootFolder.clientWidth + 2 + (height < winMaxHeight ? 0 : 15) + 'px';
	bodyStyle.height = (height < winMaxHeight ? height : winMaxHeight) + 'px';

	// run filling in background to speed up rendering top items
	setTimeout("fillTree()", 50);
});


function fillTree()
{
	var rootFolder = $('bookmarksTree');
	for(var i = 0; i < rootFolder.childElementCount; i++)
	{
		var bookmark = rootFolder.childNodes[i];
		if(bookmark.isFolder)
		{
			bookmark.fillFolder();
			bookmark.removeAttribute('childBookmarks');
		}
	}
}
