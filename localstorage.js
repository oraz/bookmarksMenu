
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

function getWindowMaxWidth()
{
	var maxWidth = localStorage['winMaxWidth'];
	return maxWidth == undefined ? 800 : maxWidth;
}

function getWindowMaxHeight()
{
	var maxHeight = localStorage['winMaxHeight'];
	return maxHeight == undefined ? 600 : maxHeight;
}

function getFontSize()
{
	var fontSize = localStorage['fontSize'];
	return fontSize == undefined ? 13 : fontSize;
}

function getFavIconWidth()
{
	var favIconWidth = localStorage['favIconWidth'];
	return favIconWidth == undefined ? 16 : favIconWidth;
}

function isShowTooltip()
{
	return localStorage['showTooltip'] == 'true';
}

