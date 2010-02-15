
var selectedBookmark = undefined;
var maxWidth = getMaxWidth() + getMaxWidthMesure();

function isJsURL(url)
{
    return url.substr(0, 11) == 'javascript:';
}
function isFileURL(url)
{
    return url.substr(0, 5) == 'file:';
}
function isFolderURL(url)
{
    return url == 'folder:';
}

function openInNewTab(anchor)
{
    chrome.tabs.create({ url: anchor.href, selected: false });
    window.close();
}

function openInCurrentTab(anchor)
{
    var url = anchor.href;
    if(isJsURL(url))
    {
        chrome.tabs.executeScript(null, { 'code': unescape(url.substr(11)) });
        window.close();
    }
    else
    {
        chrome.tabs.getSelected(null, function(tab)
        {
            chrome.tabs.update(tab.id, { 'url': url });
            window.close();
        });
    }
}

function openLink(ev)
{
    var action = parseInt(getButtonAction(ev.button));
    switch(action)
    {
        case 0: // open in current tab
        {
            if(!isFolderURL(this.href))
                ev.ctrlKey ?  openInNewTab(this) : openInCurrentTab(this);
            break;
        }
        case 1: // open in new tab
        {
            if(!isFolderURL(this.href))
                openInNewTab(this);
            break;
        }
        case 2: // open pop up menu
        {
            selectedBookmark = this;
            var selected = this.parentNode;
            while(true)
            {
                selected.setAttribute('class', 'selected');
                selected = selected.parentNode.parentNode;
                if(selected.tagName != 'LI')
                {
                    break;
                }
            }
            var transparentLayerStyle = document.getElementById('transparentLayer').style;
            var body = document.body;
            transparentLayerStyle.width = document.body.clientWidth - 2 + 'px';
            transparentLayerStyle.height = document.body.scrollHeight - 2 + 'px';

            transparentLayerStyle.display = 'block';

            var popupMenu = document.getElementById('popupMenu');
            var popupMenuStyle = popupMenu.style;
            popupMenuStyle.display = 'block';
            if(ev.clientX + popupMenu.clientWidth > document.body.clientWidth)
            {
                popupMenuStyle.right = '2px';
            }
            else
            {
                popupMenuStyle.left = ev.clientX + 'px';
            }
            if(ev.clientY + popupMenu.clientHeight > document.body.clientHeight)
            {
                popupMenuStyle.bottom = '2px';
            }
            else
            {
                popupMenuStyle.top = ev.clientY + 'px';
            }
            break;
        }
    }
}
function unSelect()
{
    if(selectedBookmark != undefined)
    {
        var selected = selectedBookmark.parentNode;
        while(true)
        {
            selected.removeAttribute('class');
            selected = selected.parentNode.parentNode;
            if(selected.tagName != 'LI')
            {
                break;
            }
        }
    }
    document.getElementById('popupMenu').style.display = 'none';
    document.getElementById('transparentLayer').style.display = 'none';
}

function deleteSelected(ev)
{
  unSelect();
  if(ev.button == 0 && selectedBookmark != undefined)
  {
      chrome.bookmarks.remove(selectedBookmark.id);
      var li = selectedBookmark.parentNode;
      var ul = li.parentNode;
      ul.removeChild(li);
      if(ul.childNodes.length == 0)
      {
          addEmptyItem(ul);
          var parentLI = ul.parentNode;
          if(parentLI.tagName == 'LI')
          {
              parentLI.childNodes[0].onmouseup = openLink;
          }
      }
  }
  selectedBookmark = undefined;
}
                                    
function changeBodySize(anchor)
{
    var ul = anchor.parentNode.getElementsByTagName('ul')[0];
    var body = document.body;
    var style = body.style;

    var height = getY(anchor) + ul.clientHeight + 2;
    if(body.clientHeight < height)
    {
        style.height = (height > 600 ? 600 : height) + 'px';
    }

    var width = 0;
    var tmpUL = ul;
    while(tmpUL.parentNode.tagName != 'BODY')
    {
        tmpUL = tmpUL.parentNode.parentNode;
        width += tmpUL.clientWidth + 1;
    }
    if(width < 800 && anchor.data > 1)
    {
        var offset = (800 - width) / anchor.data;
        if(offset < ul.clientWidth)
        {
            ul.style.left = '-' + offset + 'px';
        }
    }
    var scrollBarWidth = (body.scrollHeight > 600 ? 15 : 0);
    width += ul.clientWidth + 2 + scrollBarWidth;
    if(width < 800 && body.clientWidth < width)
    {
        style.width = width + 'px';
    }
    else if(width > 800)
    {
        style.width = '800px';
        ul.style.left = '-' + (ul.clientWidth - (width - 800)) + 'px';
    }
}

function getY(el)
{
    var y = 0;
    while(el != null)
    {
        if(el.offsetTop > 0)
        {
            y += el.offsetTop;
        }
        el = el.offsetParent;
    }
    return y;
}

function createAnchor(node)
{
    var anchor = document.createElement('a');
    var favicon;
    anchor.id = node.id;
    anchor.setAttribute('onclick', 'return false;');
    anchor.onmouseup = openLink;
    anchor.style.maxWidth = maxWidth;
    if(node.url == undefined)
    {
        anchor.href = "folder://";
        favicon = 'icons/folder.png';
        anchor.setAttribute('onMouseOver', "changeBodySize(this);");
        if(node.children.length > 0)
        {
            anchor.onmouseup = undefined;
        }
    }
    else
    {
        var url = node.url;
        anchor.href = url;
        if(isJsURL(url))
        {
            favicon = 'icons/js.png';
        }
        else if(isFileURL(url))
        {
            favicon = 'icons/html.png';
        }
        else
        {
            favicon = 'http://getfavicon.appspot.com/' + url;
        }
    }
    anchor.innerHTML = '<img class="favicon" src="' + favicon + '"/>&nbsp;' + node.title;
    return anchor;
}

function addEmptyItem(ul)
{
    var li = document.createElement('li');
    li.setAttribute('class', 'empty');
    li.innerHTML = 'Empty';
    ul.appendChild(li);
}

function addChild(node, htmlNode)
{
    if(node.children == undefined)
    {
        var li = document.createElement('li');
        li.appendChild(createAnchor(node));
        htmlNode.appendChild(li);
    }
    else
    {
        var li = document.createElement('li');
        var anchor = createAnchor(node);
        li.appendChild(anchor);
        var ul = document.createElement('ul');
        li.appendChild(ul);
        htmlNode.appendChild(li);
        var children = node.children;
        var len = children.length;
        var hasSubMenus = false;
        if(len > 0)
        {
            for(var i = 0; i < len; i++)
            {
                addChild(children[i], ul);
                if(children[i].children != undefined)
                {
                    hasSubMenus = true;
                }
            }
        }
        else
        {
            addEmptyItem(ul);
        }

        if(!hasSubMenus)
        {
            var depth = 0;
            anchor.data = depth++;
            while(true)
            {
                if(anchor.data != undefined && anchor.data > depth)
                {
                    break;
                }
                anchor.data = depth++;
                li = li.parentNode.parentNode;
                if(li.tagName != 'LI')
                {
                    break;
                }
                anchor = li.childNodes[0];
            }
        }
    }
}

chrome.bookmarks.getTree(function(nodes)
{
    var ul = document.createElement('ul');
    ul.setAttribute('class', 'bookmarksTree');
    ul.setAttribute('id', 'bookmarksTree');
    document.body.appendChild(ul);
    for(var i = 0, nodesLength = nodes.length; i < nodesLength; i++)
    {
        var children = nodes[i].children;
        for(var j = 0, childrenLength = children.length; j < childrenLength; j++)
        {
            var children2 = children[j].children;
            for(var k = 0, children2Length = children2.length; k < children2Length; k++)
            {
                addChild(children2[k], ul);
            }
            if(j + 1 < childrenLength)
            {
                var li = document.createElement('li');
                li.appendChild(document.createElement('hr'));
                ul.appendChild(li);
            }
        }
    }
    var bodyStyle = document.body.style;
    bodyStyle.width = ul.clientWidth + 2 + 'px';
    bodyStyle.height = ul.clientHeight + 2 + 'px';
});

/*window.addEventListener('overflow', function() {
    alert(window.clientWidth + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
}, false);*/
