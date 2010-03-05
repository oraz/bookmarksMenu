
// vim:noet ts=4 sw=4

function BookmarksTree(isRoot)
{
	var ul = document.createElement('ul');
	if(isRoot)
	{
		ul.root = true;
		ul.id = ul.className = 'bookmarksTree';
		ul.setAttribute('onmousedown', 'return false;');
		ul.onmouseup = BookmarksTree.onMouseUp;
	}
	return ul;
}

BookmarksTree.onMouseUp = function(ev)
{
	var bookmark = ev.srcElement.parentElement;
	var action = parseInt(getButtonAction(ev.button));
	switch(action)
	{
		case 0: // open in current tab
			if(!bookmark.folder)
			{
				ev.ctrlKey ? bookmark.openInNewTab() : bookmark.open();
			}
			break;
		case 1: // open in new tab
			if(!bookmark.folder)
			{
				bookmark.openInNewTab();
			}
			break;
		case 2: // open popup menu
			break;
	}
}

function Bookmark(bookmarkNode)
{
	var li = document.createElement('li');
	li.id = bookmarkNode.id;

	var label = document.createElement('label');
	var favicon = document.createElement('img');
	favicon.src = getFavicon(bookmarkNode.url);
	label.appendChild(favicon);
	label.appendChild(document.createTextNode(bookmarkNode.title));
	li.appendChild(label);

	if(bookmarkNode.url == undefined)
	{
		li.folder = true;
		li.childBookmarks = bookmarkNode.children;
		li.onmouseover = this.displayFolderContent;
	}
	else
	{
		li.url = bookmarkNode.url;
		li.onmouseover = li.highlight;
		li.onmouseout = li.unHighlight;
	}
	return li;
}

Bookmark.prototype.displayFolderContent = function()
{
	if(this.getAttribute("class") == "hover")
	{
		return;
	}
	this.highlight();
	this.rootFolder.activeFolder = this;
}

with(HTMLUListElement)
{
	prototype.addBookmark = function(bookmark)
	{
		this.appendChild(bookmark);
	}
	prototype.addSeparator = function()
	{
		var separator = document.createElement('li');
		separator.className = 'separator';
		this.appendChild(separator);
	}
	prototype.fillTree = function(childBookmarks, completely)
	{
		var len = childBookmarks.length;
		if(len > 0)
		{
			for(var i = 0; i < len; i++)
			{
				if(this.root && isBookmarkHidden(childBookmarks[i].title))
				{
					continue;
				}
				var bookmark = new Bookmark(childBookmarks[i]);
				this.appendChild(bookmark);
				if(this.root)
				{
					bookmark.parentFolder = bookmark.rootFolder = this;
				}
				else
				{
					bookmark.parentFolder = this.parentFolder;
					bookmark.rootFolder = this.parentFolder.rootFolder;
				}
				if(bookmark.folder && completely)
				{
					bookmark.fillFolder(true);
				}
			}
		}
		else
		{
			if(!this.root)
			{
				var li = document.createElement('li');
				li.setAttribute('class', 'empty');
				var label = document.createElement('label');
				label.appendChild(document.createTextNode('Empty'));
				li.appendChild(label);
				this.appendChild(li);
			}
		}
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
		if(this.getAttribute("class") == "hover")
		{
			this.removeAttribute("class");
		}
	}
	prototype.fillFolder = function(completely)
	{
		if(completely && this.folder)
		{
			var subTree = new BookmarksTree();
			this.appendChild(subTree);
			subTree.parentFolder = this;
			subTree.fillTree(this.childBookmarks, true);
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
		var url = this.href;
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
}

chrome.bookmarks.getTree(function(nodes)
{
	document.body.style.fontSize = getFontSize() + 'px';

	var styleSheet = document.styleSheets[document.styleSheets.length - 1];
	var favIconWidth = getFavIconWidth();
	styleSheet.addRule('li > label > img', 'width: ' + favIconWidth + 'px; height: ' + favIconWidth + 'px;');
	styleSheet.addRule('#bookmarksTree label', 'max-width: ' + getMaxWidth() + getMaxWidthMesure() + ';');

	var bookmarksTree = new BookmarksTree(true);

	document.body.appendChild(bookmarksTree);
	for(var i = 0, nodesLength = nodes.length; i < nodesLength; i++)
	{
		var children = nodes[i].children;
		for(var j = 0, childrenLength = children.length; j < childrenLength; j++)
		{
			bookmarksTree.fillTree(children[j].children, false);
			if(j + 1 < childrenLength && bookmarksTree.childNodes.length > 0)
			{
				bookmarksTree.addSeparator();
			}
		}
	}

	// run filling in background to speed up rendering top items
	setTimeout("fillTree()", 50);
});

function fillTree()
{
	var bookmarksTree = document.getElementById('bookmarksTree');
	for(var i = 0, len = bookmarksTree.childNodes.length; i < len; i++)
	{
		var bookmark = bookmarksTree.childNodes[i];
		if(bookmark.folder)
		{
			bookmark.fillFolder(true);
			bookmark.removeAttribute('childBookmarks');
		}
	}
}
