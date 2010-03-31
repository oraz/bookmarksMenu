
function $(id) { return document.getElementById(id); }

function XPath(xpathExpression, contextNode, resultType)
{
	return document.evaluate(xpathExpression, contextNode, null, resultType, null);
}

XPathResult.prototype.forEach = function(func)
{
	for(var idx = 0, len = this.snapshotLength; idx < len; idx++)
	{
		func(this.snapshotItem(idx));
	}
};

chrome.i18n.initElements = function(el)
{
	XPath('.//*[@i18n]', el ? el : document, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE).forEach(function(node)
	{
		node.appendChild(document.createTextNode(chrome.i18n.getMessage(node.getAttribute('i18n'))));
		node.removeAttribute('i18n');
	});
};

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
	return url == undefined ? 'icons/folder.png'
		: isJsURL(url) ? 'icons/js.png'
		: isFileURL(url) ? 'icons/html.png'
//		: 'chrome://favicon/' + url;
		: 'http://getfavicon.appspot.com/' + url;
}

// vim:noet
