
function $(id) { return document.getElementById(id); }

NodeList.prototype.forEach = function(func)
{
	var isString = typeof func == 'string';
	for(var idx = 0, len = this.length; idx < len; idx++)
	{
		if(isString)
		{
			var node = this[idx];
			eval(func);
		}
		else
		{
			func(this[idx], idx);
		}
	}
}

with(HTMLElement)
{
	prototype.show = function() { this.style.display = 'block'; }
	prototype.hide = function() { this.style.display = 'none'; }
}

chrome.i18n.initElement = function(el)
{
	el.appendChild(document.createTextNode(chrome.i18n.getMessage(el.getAttribute('i18n'))));
	el.removeAttribute('i18n');
}

chrome.i18n.initAll = function(el)
{
	var initElement = chrome.i18n.initElement;
	(el ? el : document).querySelectorAll('[i18n]').forEach('chrome.i18n.initElement(node)');
}

var MESSAGES = 
{
	REQ_LOAD_BOOKMARKS: 1,
	REQ_FORCE_LOAD_BOOKMARKS: 2,
	REQ_GET_TREE_STATUS: 3,
	RESP_TREE_IS_READY: 200,
	RESP_NEED_TO_LOAD: 201,
	RESP_FAILED: 400
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
