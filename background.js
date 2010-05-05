function openAllInNewWindow(folderId, incognito)
{
	chrome.bookmarks.getChildren(folderId, function(bookmarks)
	{
		var idx = 0;
		while(!bookmarks[idx].url)
		{
			idx++;
		}
		chrome.windows.create({ url: bookmarks[idx++].url, incognito: incognito }, function(win)
		{
			for(var len = bookmarks.length; idx < len; idx++)
			{
				if(bookmarks[idx].url)
				{
					chrome.tabs.create({ url: bookmarks[idx].url, windowId: win.id, selected: false });
				}
			}
		});
	});
}

// vim: noet
