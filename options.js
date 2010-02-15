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


window.onload = function()
{
    for(var idx = 0; idx < 3; idx++)
    {
        document.getElementById('btn' + idx).selectedIndex = getButtonAction(idx);
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
}
