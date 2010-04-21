var searchString = window.location.search;
if(/^\?id=\d+$/.test(searchString))
{
	chrome.bookmarks.getChildren(searchString.split('=')[1], function(bookmarks)
	{
		chrome.tabs.getSelected(null, function(tab)
		{
			// close myself
			chrome.tabs.remove(tab.id);
		});
		for(var idx = 0, len = bookmarks.length; idx < len; idx++)
		{
			if(bookmarks[idx].url)
			{
				chrome.tabs.create({ url: bookmarks[idx].url, selected: false });
			}
		}
	});
}

// vim:noet
