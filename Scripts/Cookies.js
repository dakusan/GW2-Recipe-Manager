function SetCookie(Name, Value, SecondsToExpire, NotBasePath) { document.cookie=Name+"="+escape(Value)+"; expires="+new Date(new Date().getTime()+SecondsToExpire*1000).toUTCString()+(!NotBasePath ? '; path=/' : ''); }
function GetCookie(Name)
{
	var Match=document.cookie.match(new RegExp('(?:^|; ?)'+Name+'=(.*?)(?:;|$)'));
	return Match ? unescape(Match[1]) : null;
}