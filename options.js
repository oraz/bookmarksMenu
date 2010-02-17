function setMouseButtonAction(select, button)
{
    localStorage[button] = select.selectedIndex;
}

function setMenuMaxWidth(maxWidth)
{
    var maxWidthValue = maxWidth.value;
    var re = /^\d+$/;
    if(!re.test(maxWidthValue))
    {
        maxWidth.setAttribute('class', 'error');
        return;
    }
    maxWidth.removeAttribute('class');
    localStorage['maxWidth'] = maxWidthValue;
}

function setMenuMaxWidthMesure(maxWidthMesure)
{
    localStorage['maxWidthMesure'] = maxWidthMesure.options[maxWidthMesure.selectedIndex].value;
}

function setBookmarkHidden(title, hidden)
{
    if(hidden == true)
    {
        localStorage['bookmark_' + title] = true;
    }
    else
    {
        delete localStorage['bookmark_' + title];
    }
}

function setSwitchToNewTab(switchToNewTab)
{
    if(switchToNewTab)
    {
        localStorage['switchToNewTab'] = true;
    }
    else
    {
        delete localStorage['switchToNewTab'];
    }
}

window.onload = function()
{
    for(var idx = 0; idx < 3; idx++)
    {
        document.getElementById('btn' + idx).selectedIndex = getButtonAction(idx);
    }

    if(isSwitchToNewTab())
    {
        document.getElementById('switchToNewTab').checked = true;
    }

    document.getElementById('maxWidth').value = getMaxWidth();

    var mesure = getMaxWidthMesure();
    var maxWidthMesure = document.getElementById('maxWidthMesure');
    for(var idx = 0, len = maxWidthMesure.options.length; idx < len; idx++)
    {
        if(maxWidthMesure.options[idx].value == mesure)
        {
            maxWidthMesure.selectedIndex = idx;
            break;
        }
    }

    chrome.bookmarks.getTree(function(nodes)
    {
        var bookmarksShowHide = document.getElementById('bookmarksShowHide');
        for(var i = 0, nodesLength = nodes.length; i < nodesLength; i++)
        {
            var children = nodes[i].children;
            for(var j = 0, childrenLength = children.length; j < childrenLength; j++)
            {
                var children2 = children[j].children;
                for(var k = 0, children2Length = children2.length; k < children2Length; k++)
                {
                    var child = children2[k];
                    var div = document.createElement('div');
                    div.setAttribute('class', 'bookmark');

                    var checkbox = document.createElement('input');
                    checkbox.setAttribute('type', 'checkbox');
                    if(!isBookmarkHidden(child.title))
                    {
                        checkbox.setAttribute('checked', 'checked');
                    }
                    checkbox.setAttribute('onchange', 'setBookmarkHidden("' + child.title + '", !this.checked)');

                    var label = document.createElement('label');
                    label.appendChild(checkbox);

                    var img = document.createElement('img');
                    img.setAttribute('class', 'favicon');
                    img.setAttribute('src', getFavicon(child.url));
                    label.appendChild(img);
                    label.appendChild(document.createTextNode(child.title));

                    div.appendChild(label);

                    bookmarksShowHide.appendChild(div);
                }
            }
        }
    });
}
