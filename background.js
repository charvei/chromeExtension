console.log("hello!!!!!!");

if (window.jQuery) {
	console.log('yes');
} else {
	console.log("nah");
}

//$("div#watch8-secondary-actions").append()



chrome.browserAction.onClicked.addListener(function(tab) {
	console.log("elekrgjelkg");
//	chrome.tabs.executeScript({code: 'document.getElementById("page").style.backgroundColor = "blue"'});
	chrome.tabs.executeScript(null, {file: "jquery-3.2.1.js"});
	chrome.tabs.executeScript(null, {file: "script.js"});
	chrome.tabs.insertCSS(null, {file: "style.css"});

	if (window.jQuery) {
	console.log('yes');
} else {
	console.log("nah");
}


/*Need to do execute script to get the script to execute on the page your looking at, otherwise its doing it on the extension itself!*/

/*	$('<button/>', {
	id : 'timestamp-button',
	class : ['yt-uix-button', 'yt-uix-button-size-default', 'yt-uix-button-opacity', 'action-panel-trigger',
	'button-has-icon', 'no-icon-markup'],
	type : 'button',
	title : 'timestamps'
	}).appendTo("#watch8-secondary-actions");
*/
//	$("div#watch8-secondary-actions").append("<div>sdk;fglsdkjfg</div>");

$("div.spacer").append("<div>hiya!!!!!</div>");

});	