
var GBookmarksTree = null;
var needNotifyOptionsPage;

var GBookmarkUrl = 'http://www.google.com/bookmarks/';

NodeList.prototype.forEach = function(func)
{
	for(var idx = 0, len = this.length; idx < len; idx++)
	{
		func(this[idx], idx);
	}
}

function createFolder(parentFolder, fullName, folderSeparator)
{
	var names = fullName.split(folderSeparator, 2);
	var folder;
	for(var idx = 0, len = parentFolder.children.length; idx < len; idx++)
	{
		if(parentFolder.children[idx].title == names[0])
		{
			folder = parentFolder.children[idx];
			break;
		}
	}
	if(!folder)
	{
		folder = { title: names[0], id: names[0], children: new Array() };
		parentFolder.children.push(folder);
	}
	if(names[1])
	{
		createFolder(folder, names[1], folderSeparator);
	}
}

function findFolder(parentFolder, fullName, folderSeparator)
{
	var names = fullName.split(folderSeparator, 2);
	for(var idx = 0, len = parentFolder.children.length; idx < len; idx++)
	{
		var child = parentFolder.children[idx];
		if(child.url == undefined && child.title == names[0])
		{
			return names[1] ? findFolder(child, names[1], folderSeparator) : child;
		}
	}
}

function removeGBookmark(folder, id)
{
	var children = folder.children;
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
			return removeGBookmark(child, id);
		}
	}
}

function handleStateChange()
{
	if(this.readyState == 4)
	{
		var folderSeparator = getFolderSeparator();
		var parser = new DOMParser();
		GBookmarksTree = { children: new Array() };
		var xmlDoc = parser.parseFromString(this.responseText, 'text/xml');
		xmlDoc.querySelectorAll('label').forEach(function(node)
		{
			createFolder(GBookmarksTree, node.textContent, folderSeparator);
		});
		xmlDoc.querySelectorAll('bookmark').forEach(function(node)
		{
			var bm =
			{
				title: node.querySelector('title').textContent,
				url: node.querySelector('url').textContent,
				id: node.querySelector('id').textContent
			};
			var label = node.querySelector('label');
			if(label)
			{
				findFolder(GBookmarksTree, label.textContent, folderSeparator).children.push(bm);
			}
			else
			{
				GBookmarksTree.children.push(bm);
			}
		});
		sortFolder(GBookmarksTree);
		if(needNotifyOptionsPage)
		{
			notifyOptionsPage();
		}
	}
}

function sortFolder(folder)
{
	var children = folder.children;
	if(children)
	{
		children.sort(sorting);
		for(var idx = 0, len = children.length; idx < len; idx++)
		{
			var child = children[idx];
			if(child.children)
			{
				sortFolder(child);
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
	xhr.onreadystatechange = handleStateChange;
	xhr.open("GET", GBookmarkUrl + '?output=xml&num=10000', true);
	xhr.send();
}

function remove(id)
{
	var child = removeGBookmark(GBookmarksTree, id);
}

document.addEventListener("DOMContentLoaded", function()
{
	setUseGoogleBookmarks(isUseGoogleBookmarks());
});
// vim: noet
