
function BookmarksTree(isRoot)
{
    var ul = document.createElement('ul');
    if(isRoot)
    {
        ul.root = true;
        ul.id = ul.className = 'bookmarksTree';
    }
    return ul;
}

function Bookmark(bookmarkNode)
{
    var li = document.createElement('li');
    li.id = bookmarkNode.id;

    var anchor = document.createElement('a');
    anchor.setAttribute('onmousedown', 'return false;');
    anchor.setAttribute('onclick', 'return false;');
    var favicon = document.createElement('img');
    favicon.src = getFavicon(bookmarkNode.url);
    favicon.className = 'favicon';
    anchor.appendChild(favicon);
    anchor.appendChild(document.createTextNode(bookmarkNode.title));
    li.appendChild(anchor);

    if(bookmarkNode.url == undefined)
    {
        li.folder = true;
        li.childBookmarks = bookmarkNode.children;
        li.onmouseover = this.displayFolderContent;
    }
    else
    {
        li.onmouseover = this.highlight;
        li.onmouseout = this.unHighlight;
    }
    return li;
}

with(Bookmark)
{
    prototype.highlight = function()
    {
        this.setAttribute("class", "hover");
    }
    prototype.unHighlight = function()
    {
        if(this.getAttribute("class") == "hover")
        {
            this.removeAttribute("class");
        }
    }
    prototype.displayFolderContent = function()
    {
        if(this.getAttribute("class") == "hover")
        {
            return;
        }
        this.setAttribute("class", "hover");
        alert(this.rootFolder.id);
    }
}

with(HTMLUListElement)
{
    prototype.addBookmark = function(bookmark)
    {
        this.appendChild(bookmark);
    }
    prototype.addSeparator = function()
    {
        var separator = document.createElement('li');
        separator.className = 'separator';
        this.appendChild(separator);
    }
    prototype.fillTree = function(childBookmarks, completely)
    {
        var len = childBookmarks.length;
        if(len > 0)
        {
            for(var i = 0; i < len; i++)
            {
                if(this.root && isBookmarkHidden(childBookmarks[i].title))
                {
                    continue;
                }
                var bookmark = new Bookmark(childBookmarks[i]);
                this.appendChild(bookmark);
                bookmark.parentFolder = this.parentFolder; // undefined for top level items
                if(bookmark.folder)
                {
                    bookmark.rootFolder = this.root ? this : bookmark.parentFolder.rootFolder;
                    if(completely)
                    {
                        bookmark.fillFolder(true);
                    }
                }
            }
        }
        else
        {
            if(!this.root)
            {
                var li = document.createElement('li');
                li.setAttribute('class', 'empty');
                li.innerHTML = 'Empty';
                this.appendChild(li);
            }
        }
    }
}

with(HTMLLIElement)
{
    prototype.fillFolder = function(completely)
    {
        if(completely && this.folder)
        {
            var subTree = new BookmarksTree();
            this.appendChild(subTree);
            subTree.parentFolder = this;
            subTree.fillTree(this.childBookmarks, true);
        }
    }
    prototype.getRoot = function()
    {
        var tmp = this.parentFolder;
        while(!tmp.root)
        {
            tmp = tmp.parentFolder;
        }
        return tmp;
    }
}

chrome.bookmarks.getTree(function(nodes)
{
    document.body.style.fontSize = getFontSize() + 'px';

    var styleSheet = document.styleSheets[document.styleSheets.length - 1];
    var favIconWidth = getFavIconWidth();
    styleSheet.addRule('a > img.favicon', 'width: ' + favIconWidth + 'px; height: ' + favIconWidth + 'px;');
    styleSheet.addRule('#bookmarksTree a', 'max-width: ' + getMaxWidth() + getMaxWidthMesure() + ';');

    var bookmarksTree = new BookmarksTree(true);

    document.body.appendChild(bookmarksTree);
    for(var i = 0, nodesLength = nodes.length; i < nodesLength; i++)
    {
        var children = nodes[i].children;
        for(var j = 0, childrenLength = children.length; j < childrenLength; j++)
        {
            bookmarksTree.fillTree(children[j].children, false);
            if(j + 1 < childrenLength && bookmarksTree.childNodes.length > 0)
            {
                bookmarksTree.addSeparator();
            }
        }
    }

    // run filling in background to speed up rendering top items
    setTimeout("fillTree()", 50);
});

function fillTree()
{
    var bookmarksTree = document.getElementById('bookmarksTree');
    for(var i = 0, len = bookmarksTree.childNodes.length; i < len; i++)
    {
        var bookmark = bookmarksTree.childNodes[i];
        if(bookmark.folder)
        {
            bookmark.fillFolder(true);
            bookmark.removeAttribute('childBookmarks');
        }
    }
}

/*window.onload = function()
  {
  alert(document.getElementById('popupMenu'));
  }*/
