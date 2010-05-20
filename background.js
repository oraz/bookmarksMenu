
var GBookmarksTree = null;

var GBookmarkUrl = 'https://www.google.com/bookmarks/';

function GBookmarkFolder(names, parentFolder)
{
	this.children = new Array();
	if(parentFolder)
	{
		this.title = names.shift();
		this.id = !parentFolder.isRoot ? parentFolder.id + GBookmarksTree.labelSeparator + this.title : this.title;
		parentFolder.addChild(this);
	}
	else
	{
		this.isRoot = true;
		this.labelSeparator = getLabelSeparator();
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
	var names = typeof fullName == 'string' ? fullName.split(GBookmarksTree.labelSeparator) : fullName;
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

function sorting(b1, b2)
{
	if(b1.children && b2.url) { return -1; }
	if(b2.children && b1.url) { return 1; }
	var t1 = b1.title, t2 = b2.title;
	return t1 > t2 ? 1 : t1 < t2 ? -1 : 0;
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
	if(this.readyState == 4 && this.status == 200)
	{
		if(this.timeout)
		{
			clearTimeout(this.timeout);
		}
		GBookmarksTree = new GBookmarkFolder();
		GBookmarksTree.signature = this.responseXML.querySelector('channel > signature').textContent;
		this.responseXML.querySelectorAll('channel > item').forEach(createBookmark);
		GBookmarksTree.sort();
		this.port.postMessage('Ok');
	}
}

XMLHttpRequest.prototype.processAbort = function()
{
	this.port.postMessage("Failed");
	console.error('xhr has been aborted');
}

function loadGoogleBookmarks(port)
{
	GBookmarksTree = null;
	var xhr = new XMLHttpRequest();
	xhr.port = port;
	xhr.onreadystatechange = xhr.processBookmarks;
	xhr.onabort = xhr.processAbort;
	xhr.open("GET", GBookmarkUrl + '?output=rss&num=10000', true);
	xhr.timeout = setTimeout(function() { xhr.abort(); }, 10 * 1000);
	xhr.send();
}

function remove(id)
{
	var child = GBookmarksTree.removeBookmark(id);
	if(child && child.url) // it's bookmark
	{
		var xhr = new XMLHttpRequest();
		xhr.open("GET", GBookmarkUrl + 'mark?dlq=' + encodeURIComponent(id) +
				'&sig=' + encodeURIComponent(GBookmarksTree.signature), true);
		xhr.send();
	}
}

function onConnect(port)
{
	port.onMessage.addListener(function(msg)
	{
		if(msg.msg == 'LoadGBookmarks')
		{
			if(GBookmarksTree && !msg.reload)
			{
				port.postMessage('Ok');
			}
			else
			{
				loadGoogleBookmarks(port);
			}
		}
		else if(msg.msg == 'GetTreeStatus')
		{
			port.postMessage(GBookmarksTree ? 'TreeIsReady' : 'NeedToLoad');
		}
	});
}

function openUrlsInNewWindow(urls, incognito)
{
	var windowData = { url: urls[0] };
	if(!chrome.stable && incognito)
	{
		windowData.incognito = true;
	}
	chrome.windows.create(windowData, function(win)
	{
		if(windowData.incognito && !win && urls.length > 1)
		{
			alert("You need to allow 'Bookmarks menu' to run in incognito! You can do it on extensions page.");
			return;
		}
		for(var idx = 1, len = urls.length; idx < len; idx++)
		{
			chrome.tabs.create({ url: urls[idx], windowId: win.id, selected: false });
		}
	});
}

document.addEventListener("DOMContentLoaded", function()
{
	chrome.browserAction.setBadgeBackgroundColor({ color: [ 24, 135, 185, 255 ] });
	if(isUseGoogleBookmarks())
	{
		chrome.browserAction.setBadgeText({ text: "G" });
	}
	chrome.extension.onConnect.addListener(onConnect);
	chrome.stable = navigator.appVersion.substr(navigator.appVersion.indexOf("Chrome") + 7).indexOf('4') == 0;
});

// vim: noet
