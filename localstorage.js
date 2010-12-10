
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

function isBookmarkHidden(title, useGoogleBookmarks)
{
	return localStorage[(useGoogleBookmarks ? 'g_' : '') + 'bookmark_' + title] == 'true';
}

function isSwitchToNewTab()
{
	return localStorage['switchToNewTab'] == 'true';
}

function getWindowMaxWidth()
{
	var maxWidth = localStorage['winMaxWidth'];
	return maxWidth == undefined ? 800 : parseInt(maxWidth);
}

function getWindowMaxHeight()
{
	var maxHeight = localStorage['winMaxHeight'];
	return maxHeight == undefined ? 600 : parseInt(maxHeight);
}

function getFontFamily()
{
	var fontFamily = localStorage['fontFamily'];
	return fontFamily ? fontFamily : "Verdana";
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

function isShowURL()
{
	return localStorage['showURL'] == 'true';
}

function getColor(name)
{
	var color = localStorage[name];
	return color ? color
		: name == 'bodyClr' || name == 'bmBgClr' || name == 'activeBmFntClr' ? 'FFF'
		: name == 'fntClr' ? '000'
		: name == 'activeBmBgClrFrom' ? '86ABD9'
		: name == 'activeBmBgClrTo' ? '1F5EAB'
		: 'BEBEBE'; // disabledItemFntClr
}

function getScrollBarWidth()
{
	var width = localStorage['scrollBarWidth'];
	return width ? width : '7';
}

function isUseGoogleBookmarks()
{
	return localStorage['useGoogleBookmarks'] == 'true';
}

function getLabelSeparator()
{
	var labelSeparator = localStorage['labelSeparator'];
	return labelSeparator ? labelSeparator : '>';
}

function getFaviconServiceForChrome()
{
	var service = localStorage['chbFaviconService'];
	return service == undefined ? 1 : service;
}

function getFaviconServiceForGoogle()
{
	var service = localStorage['gbFaviconService'];
	return service == undefined ? 2 : service;
}

function isHideCMModeSwitcher()
{
	return localStorage['hideCMModeSwitcher'] == 'true';
}

function isHideCMOpenIncognito()
{
	return localStorage['hideCMOpenIncognito'] == 'true';
}
