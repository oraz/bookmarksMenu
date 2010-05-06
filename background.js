function openAllInNewWindow(urls, incognito)
{
	chrome.windows.create({ url: urls[0], incognito: incognito }, function(win)
	{
		for(var idx = 1, len = urls.length; idx < len; idx++)
		{
			chrome.tabs.create({ url: urls[idx], windowId: win.id, selected: false });
		}
	});
}

function openAllInTabs(urls, firstInCurrentTab)
{
	var idx = 0;
	if(firstInCurrentTab)
	{
		openUrlInCurrentTab(urls[idx++]);
	}
	for(var len = urls.length; idx < len; idx++)
	{
		chrome.tabs.create({ url: urls[idx], selected: idx == 0 });
	}
}

function openUrlInCurrentTab(url)
{
	if(url.substr(0, 11) == 'javascript:')
	{
		chrome.tabs.executeScript(null, { code: unescape(url.substr(11)) });
	}
	else
	{
		chrome.tabs.getSelected(null, function(tab)
		{
			chrome.tabs.update(tab.id, { url: url });
		});
	}
}

// vim: noet
