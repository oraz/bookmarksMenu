
// vim:noet ts=4 sw=4

function getButtonAction(btn)
{
	var action = localStorage[btn];
	return action != undefined ? action : btn;
}

function getMaxWidth()
{
	var maxWidth = localStorage['maxWidth'];
	return maxWidth != undefined ? maxWidth : 30;
}

function getMaxWidthMesure()
{
	var mesure = localStorage['maxWidthMesure'];
	return mesure != undefined ? mesure : 'em';
}

function isBookmarkHidden(title)
{
	return localStorage['bookmark_' + title] == 'true';
}

function isSwitchToNewTab()
{
	return localStorage['switchToNewTab'] == 'true';
}
