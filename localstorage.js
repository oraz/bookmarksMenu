
function getButtonAction(btn)
{
    var action = localStorage[btn];
    if(action == undefined)
    {
        action = localStorage[btn] = btn;
    }
    return action;
}

function getMaxWidth()
{
    var maxWidth = localStorage['maxWidth'];
    if(maxWidth == undefined)
    {
        maxWidth = localStorage['maxWidth'] = 30;
    }
    return maxWidth;
}

function getMaxWidthMesure()
{
    var mesure = localStorage['maxWidthMesure'];
    if(mesure == undefined)
    {
        mesure = localStorage['maxWidthMesure'] = 'em';
    }
    return mesure;
}
