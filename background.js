
var GBookmarksTree = null;
var needNotifyOptionsPage;

var GBookmarkUrl = 'https://www.google.com/bookmarks/';

function GBookmarkFolder(names, parentFolder)
{
	this.children = new Array();
	if(parentFolder)
	{
		this.title = names.shift();
		this.id = !parentFolder.isRoot ? parentFolder.id + GBookmarksTree.folderSeparator + this.title : this.title;
		parentFolder.addChild(this);
	}
	else
	{
		this.isRoot = true;
		this.folderSeparator = getFolderSeparator();
		return this;
	}
	return names.length > 0 ? new GBookmarkFolder(names, this) : this;
}

GBookmarkFolder.prototype.addChild = function(child)
{
	this.children.push(child);
}

GBookmarkFolder.prototype.findFolder = function(fullName)
{
	var names = typeof fullName == 'string' ? fullName.split(GBookmarksTree.folderSeparator) : fullName;
	var name = names.shift();
	for(var idx = 0, len = this.children.length; idx < len; idx++)
	{
		var child = this.children[idx];
		if(child.url == undefined && child.title == name)
		{
			return names.length > 0 ? child.findFolder(names) : child;
		}
	}
	names.unshift(name);
	return new GBookmarkFolder(names, this);
}

GBookmarkFolder.prototype.removeBookmark = function(id)
{
	var children = this.children;
	for(var idx = 0, len = children.length; idx < len; idx++)
	{
		var child = children[idx];
		if(child.id == id)
		{
			children.splice(idx, 1);
			return child;
		}
		if(child.children)
		{
			var bookmark = child.removeBookmark(id);
			if(bookmark)
			{
				return bookmark;
			}
		}
	}
	return null;
}

GBookmarkFolder.prototype.sort = function()
{
	var children = this.children;
	if(children)
	{
		children.sort(sorting);
		for(var idx = 0, len = children.length; idx < len; idx++)
		{
			var child = children[idx];
			if(child.children)
			{
				child.sort();
			}
		}
	}
}

function createBookmark(node)
{
	var bm =
	{
		title: node.querySelector('title').textContent,
		url: node.querySelector('link').textContent,
		id: node.querySelector('bkmk_id').textContent
	};
	var label = node.querySelector('bkmk_label');
	if(label)
	{
		GBookmarksTree.findFolder(label.textContent).addChild(bm);
	}
	else
	{
		GBookmarksTree.addChild(bm);
	}
}

XMLHttpRequest.prototype.processBookmarks = function()
{
	if(this.readyState == this.DONE)
	{
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(this.responseText, 'text/xml');
		GBookmarksTree = new GBookmarkFolder();
		GBookmarksTree.signature = xmlDoc.querySelector('channel > signature').textContent;

		xmlDoc.querySelectorAll('channel > item').forEach(createBookmark);
		GBookmarksTree.sort();
		if(needNotifyOptionsPage)
		{
			notifyOptionsPage();
		}
	}
}

function sorting(b1, b2)
{
	if(b1.children && b2.url) { return -1; }
	if(b2.children && b1.url) { return 1; }
	var t1 = b1.title, t2 = b2.title;
	return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
}

function setUseGoogleBookmarks(useGoogleBookmarks, isFromOptionsPage)
{
	if(useGoogleBookmarks)
	{
		chrome.browserAction.setBadgeText({ text: "G" });
		needNotifyOptionsPage = isFromOptionsPage;
		if(GBookmarksTree)
		{
			if(needNotifyOptionsPage)
			{
				notifyOptionsPage();
			}
		}
		else
		{
			loadGoogleBookmakrs(isFromOptionsPage);
		}
	}
	else
	{
		chrome.browserAction.setBadgeText({ text: "" });
	}
}

function notifyOptionsPage()
{
	needNotifyOptionsPage = false;
	chrome.extension.sendRequest('GoogleBookmarksIsReady');
}

function loadGoogleBookmakrs(isFromOptionsPage)
{
	needNotifyOptionsPage = isFromOptionsPage;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = xhr.processBookmarks;
	xhr.open("GET", GBookmarkUrl + '?output=rss&num=10000', true);
	xhr.send();
}

function remove(id)
{
	var child = GBookmarksTree.removeBookmark(id);
	if(child && child.url) // it's bookmark
	{
		var xhr = new XMLHttpRequest();
		xhr.open("GET", GBookmarkUrl + 'mark?' + stringify({ dlq: id, sig: GBookmarksTree.signature }), true);
		xhr.send();
	}
}

function stringify(parameters)
{
	var params = [];
	for(var p in parameters)
	{
		params.push(p + '=' + encodeURIComponent(parameters[p]));
	}
	return params.join('&');
}


document.addEventListener("DOMContentLoaded", function()
{
	setUseGoogleBookmarks(isUseGoogleBookmarks());
});

// vim: noet
