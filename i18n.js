
chrome.i18n.initElements = function(el)
{
	var snapshot = document.evaluate('//*[@i18n]', el ? el : document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for(var idx = 0, len = snapshot.snapshotLength; idx < len; idx++)
	{
		var item = snapshot.snapshotItem(idx);
		item.appendChild(document.createTextNode(this.getMessage(item.getAttribute('i18n'))));
		item.removeAttribute('i18n');
	}
};

// vim:noet
