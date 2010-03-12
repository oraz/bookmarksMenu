
// vim:noet ts=4 sw=4

function isJsURL(url)
{
	return url.substr(0, 11) == 'javascript:';
}

function isFileURL(url)
{
	return url.substr(0, 5) == 'file:';
}

function getFavicon(url)
{
	if(url == undefined)
	{
		return 'icons/folder.png';
	}
	if(isJsURL(url))
	{
		return 'icons/js.png';
	}
	if(isFileURL(url))
	{
		return 'icons/html.png';
	}
//	return 'chrome://favicon/' + url;
	return 'http://getfavicon.appspot.com/' + url;
}
