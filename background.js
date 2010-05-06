function openUrlsInNewWindow(urls, incognito)
{
	chrome.windows.create({ url: urls[0], incognito: incognito }, function(win)
	{
		for(var idx = 1, len = urls.length; idx < len; idx++)
		{
			chrome.tabs.create({ url: urls[idx], windowId: win.id, selected: false });
		}
	});
}

// vim: noet
