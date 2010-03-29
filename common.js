
function XPath(xpathExpression, contextNode, resultType)
{
	return document.evaluate(xpathExpression, contextNode, null, resultType, null);
}

function $(id)
{
	return document.getElementById(id);
}

chrome.i18n.initElements = function(el)
{
	var snapshot = XPath('//*[@i18n]', el ? el : document, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE);
	for(var idx = 0, len = snapshot.snapshotLength; idx < len; idx++)
	{
		var item = snapshot.snapshotItem(idx);
		item.appendChild(document.createTextNode(this.getMessage(item.getAttribute('i18n'))));
		item.removeAttribute('i18n');
	}
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
