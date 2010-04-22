
function $(id) { return document.getElementById(id); }

function XPath(xpathExpression, contextNode, resultType)
{
	return document.evaluate(xpathExpression, contextNode, null, resultType, null);
}

XPathResult.prototype.forEach = function(func)
{
	if(this.resultType == this.ORDERED_NODE_SNAPSHOT_TYPE || this.resultType == this.UNORDERED_NODE_SNAPSHOT_TYPE)
	{
		for(var idx = 0, len = this.snapshotLength; idx < len; idx++)
		{
			func(this.snapshotItem(idx));
		}
	}
	else if(this.resultType == this.ORDERED_NODE_ITERATOR_TYPE || this.resultType == this.UNORDERED_NODE_ITERATOR_TYPE)
	{
		var node;
		while(node = this.iterateNext())
		{
			func(node);
		}
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

function isBookmarklet(url)
{
	return url.substr(0, 11) == 'javascript:';
}

function getFavicon(url)
{
	return url == undefined ? 'icons/folder.png'
		: isBookmarklet(url) ? 'icons/js.png'
		: url.substr(0, 5) == 'file:' ? 'icons/html.png'
//		: 'chrome://favicon/' + url;
		: 'http://getfavicon.appspot.com/' + url;
}

// vim:noet
