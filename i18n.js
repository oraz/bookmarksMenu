
var i18n = chrome.i18n;

i18n.initElements = function(el)
{
	var snapshot = document.evaluate('//i18n[@msg]', el ? el : document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	for(var idx = snapshot.snapshotLength - 1; idx >= 0; idx--)
	{
		var item = snapshot.snapshotItem(idx);
		var itemParent = item.parentElement;
		itemParent.removeChild(item);
		itemParent.appendChild(document.createTextNode(this.getMessage(item.getAttribute('msg'))));
	}
};

// vim:noet
