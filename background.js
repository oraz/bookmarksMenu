
chrome.stable = navigator.appVersion.substr(navigator.appVersion.indexOf("Chrome") + 7).indexOf('4') == 0;

function openUrlsInNewWindow(urls, incognito)
{
	var windowData = { url: urls[0] };
	if(!chrome.stable && incognito)
	{
		windowData.incognito = true;
	}
	chrome.windows.create(windowData, function(win)
	{
		for(var idx = 1, len = urls.length; idx < len; idx++)
		{
			chrome.tabs.create({ url: urls[idx], windowId: win.id, selected: false });
		}
	});
}

// vim: noet
