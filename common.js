
function $(id) { return document.getElementById(id); }

NodeList.prototype.forEach = function(func)
{
	for(var idx = 0, len = this.length; idx < len; idx++)
	{
		func(this[idx], idx);
	}
}

chrome.i18n.initElements = function(el)
{
	(el ? el : document).querySelectorAll('[i18n]').forEach(function(node)
	{
		node.appendChild(document.createTextNode(chrome.i18n.getMessage(node.getAttribute('i18n'))));
		node.removeAttribute('i18n');
	});
};

function isBookmarklet(url)
{
	return url.substr(0, 11) == 'javascript:';
}

function getFavicon(url)
{
	return url == undefined ? 'icons/folder.png'
		: isBookmarklet(url) ? 'icons/js.png'
		: url.substr(0, 5) == 'file:' ? 'icons/html.png'
		: 'chrome://favicon/' + url;
//		: 'http://getfavicon.appspot.com/' + url;
}

// vim:noet
