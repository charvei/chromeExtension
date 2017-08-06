/*Things to do:
	1. Make the comments popup divs look cool
		a) Add profile pictures
	2. Deal with overlapping timestamps
	3. Deal with resetting timestamp markers (i think they remain if clicking a link to another video [spf stuff])
	4. Make timestamps icons on progress bar appear as they're found, not after they're all found
*/


/*
I seem to have allowed for comments to be displayed as soon as they are found and not after they have all been retrieved
this is great because now the app will not have to wait 40 seconds into a video to display the comments
BUT:
>doesn't seem to be the best/most stable implementation, i'm kinda afraid of concurrency stuff with it.

Next: 
1)deal with video loading after timestamps resulting in NaN.
2)make comment divs look good & deal with when multiple occur at once
*/

/*Deal with multiple timestamps in the one comment: 1:30 for xxxx, 5:24 for xxxx*/


document.addEventListener("spfdone", startRunning);
//document.addEventListener("DOMContentLoaded", startRunning);
var key = "key=AIzaSyDrusteFhAYvTfF77mYNL-7MDmso7UyuVs";
var part = "part=snippet,replies";
//var videoId = "videoId=apbSsILLh28";
var videoId;
var APIurl = "https://www.googleapis.com/youtube/v3/commentThreads";
var maxResults = "maxResults=100";
var timeStampComments;
var timeStampRecord;
var jarray = 0;
var timer;
//videoLoaded; 0=video not loaded, 1=video has loaded for first time, 2=video has been loaded after more than 1 checks
var videoLoaded = 0;
$('<div id=timeStampList class=ytp-ad-progress-list"></div>').appendTo("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-progress-list");
//fetchComments();
startRunning();

//Start interval timer and allow for timestamps to be display
function startRunning() {
	process();
	videoId = getVideoId();
	timeStampComments = new Array();
	timeStampRecord = new Array();
	fetchComments();
	timer = checkVideoCurrentTimePeriodically();
	document.addEventListener("spfrequest", function() {
		clearInterval(timer);
		clearTimestampMarkers();
		timeStampComments = new Array();
		timeStampRecord = new Array();
		videoLoaded = false;
		jarray = 0;
	});
}

function getVideoId() {
	var url = window.location.href;
	var videoId = "videoId=";
	var endIndexOfVideoId;
	var startIndexOfVideoId = (url.indexOf("?v=") + 3);
//	var endIndexOfVideoId = indexOf("&", startIndexOfVideoId);
	if ((endIndexOfVideoId = url.indexOf("&", startIndexOfVideoId))==-1) {
		videoId += url.substr(startIndexOfVideoId, url.length);
	} else {
		videoId += url.substr(startIndexOfVideoId, endIndexOfVideoId);	
	}
	console.log(url);
	return videoId;
}

function fetchComments(nextPageToken) {
	var urlRequest = APIurl + "?" + part + "&" + videoId + "&" + key + "&" + maxResults;
	if (nextPageToken) {
		urlRequest = APIurl + "?" + part + "&" + videoId + "&" + maxResults + "&pageToken=" + nextPageToken + "&" + key;
	}
	console.log(urlRequest);

//fetch.then.then.catch skeleton borrowed from https://developers.google.com/web/ilt/pwa/working-with-the-fetch-api
	fetch(urlRequest).then(function(response) {
		if (!response.ok) {
			throw Error(response.statusText);
		}
		//Read the response as json.
		return response.json();
	}).then(function(responseAsJson) {
		//Do stuff with the JSON
		console.log(responseAsJson.items.length);
		if (responseAsJson.nextPageToken) {
			fetchComments(responseAsJson.nextPageToken);
			console.log("next page comments have been fetched for");
			parseResponseForStamps(responseAsJson);
//			makeTimeStampElements(jarray);
		} else {
			//function has retrieved all comments
			parseResponseForStamps(responseAsJson);
//			makeTimeStampElements(jarray);
			console.log("No next page");

		}
		console.log(responseAsJson);
	}).catch(function(error) {
		console.log('looks like there was a problem: ', error);
	});
}

function parseResponseForStamps(response) {
	//parse each comment (and their replies or no?) and see if they contain a timestamp... if so put em in array w/ author etc
	var timeStamp;
	for (i=0; i<response.items.length; i++) {
		var text = response.items[i].snippet.topLevelComment.snippet.textOriginal;
		//Pattern matching to find timestamp format
		var regex = /\d\d:\d\d:\d\d|\d:\d\d:\d\d|\d\d:\d\d|\d:\d\d/;
		if (timeStamp = text.match(regex)) {
			console.log("timestamp found");
			var author = response.items[i].snippet.topLevelComment.snippet.authorDisplayName;
			var likes = response.items[i].snippet.topLevelComment.snippet.likeCount;
			var profilePicUrl = response.items[i].snippet.topLevelComment.snippet.authorProfileImageUrl;
			var publishTime = response.items[i].snippet.topLevelComment.snippet.publishedAt;
			timeStampComments.push(new Array(author, text, likes, profilePicUrl, publishTime, timeStamp[0], convertStampToSeconds(timeStamp[0])));
		}
	}
	console.log(timeStampComments);
	//Is it better to add them all to one array, then parse the array or parse while in the json format.
	//I guess the latter...
}

function makeTimeStampElements() {
	//$('<div id=timeStampList"></div>').appendTo("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-progress-list");

	for (j=0; j<timeStampComments.length; j++) {
		var id = "" + j;
//		timeStampComments[j].push(j);
		makeDivForTimeStamp(id, timeStampComments[j][0], timeStampComments[j][1], timeStampComments[j][6]);
	}
}

function popTimeStampElements() {
	// for (i=0; i<timeStampComments.length; i++) {
	// 	var id = "" + jarray++;
	// 	console.log(jarray);
	// }
	while (timeStampComments.length>0) {
		var id = "" + jarray++;
		var timeStamp = timeStampComments.shift();
		timeStamp.push(jarray);
		timeStampRecord.push(timeStamp);
		console.log(timeStampRecord);
		makeDivForTimeStamp(id, timeStamp[0], timeStamp[1], timeStamp[6]);
	}
}

//Construct a div for a given timestamp
function makeDivForTimeStamp(timeStampId, author, text, timeStamp) {
	var videoDuration = $("#movie_player > div.html5-video-container > video").prop("duration");
	var timeStampXPos = (timeStamp/videoDuration)*100;
//	var timeStampXPos = videoDuration/timeStam;

	console.log("TIMESTAMP AND VIDEODURATION: " + timeStamp + ", " + videoDuration);

	//Just a test
	$('<div id=timeStamp' + timeStampId + ' class="ytp-paid-content-overlay timestampcomment" aria-live="assertive" aria-atomic="true" data-layer="4" style="display: none; background-color:rgba(0, 0, 0, 0.7); border-radius: 5px; padding-left: 5px; padding-right: 5px; transform: translate(-50%, 0); left : 50%; font-size: 16px; font-family: Arial; position: absolute; z-index: 24; height: auto;">' + author + ': ' + text + '</div>').appendTo("div#movie_player");
	//Add 'marker' in the progress bar... class: ytp-ad-progress'
//	$('<div id=timeStampPosition' + timeStampId + ' class="ytp-timestamp" style="transform: scaleX(' + timeStampXPos + '); width: 6px; z-index: 36; background: #fc0; display: block;"></div>').appendTo("div#timeStampList");
//	$('<div id=timeStampPosition' + timeStampId + ' class="ytp-ad-progress" style="transform: scaleX(' + timeStampXPos + '); width: 6px;"></div>').appendTo("div#timeStampList");
	$('<div id=timeStampPosition' + timeStampId + ' class="ytp-ad-progress timestampmarker" style="left:' + timeStampXPos + '%; width: 6px; background: #0fb707;"></div>').appendTo("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-progress-list");
}

//Function to convert timestamp format to seconds
function convertStampToSeconds(timeStamp){
	var timeStampSplit = timeStamp.split(':');
	var timeSeconds;
	//00:00:00
	if (timeStamp.length<6) {
		//max digit represents minutes
//		console.log("timest[0], [1] -->" + timeStampSplit[0]  + ", " + timeStampSplit[1]);
		timeSeconds = (+timeStampSplit[0])*60 + (+timeStampSplit[1]);
//		console.log("Timestamp: " + timeStamp + ", converted to seconds -> " + timeSeconds);
		return timeSeconds;
	} else if (timeStamp.length<9) {
		//max digit represents hours
		timeSeconds = (+timeStampSplit[0])*60*60 + (+timeStampSplit[1])*60 + (+timeStampSplit[2]);
//		console.log("timest[0], [1], [2] -->" + timeStampSplit[0]  + ", " + timeStampSplit[1] + ", " + timeStampSplit[]);
//		console.log("Timestamp: " + timeStamp + ", converted to seconds -> " + timeSeconds);
		return timeSeconds;
	} else {
		return false;
	}
}

//Check if video has been loaded sufficiently on page to retrieve data from it
function videoHasLoaded(){
	if (($("#movie_player > div.html5-video-container > video").prop("readyState"))>1) {
		//Video has loaded metadata
		console.log("VIDEO HAS LOADED META DATA");
		return 1;
	} else {
		console.log("VIDEO HAS NOTNOTNOTNOTNOTNOT loaded metadata");
		return 0;
	}
}

//Check if two time stamps are concurrently being shown
function concurrentTimeStampCheck(){

}

//Function to trigger the display of timestamp at appropriate time in the video
function checkVideoCurrentTimePeriodically(){
	/*OPTIMIZATION: 
		-would be good if this stopped when the video was paused
		-might be useful to order the array ??? or maybe not
		-try to think of other ways to make it not so crazy (though it seems to be working just fine...)
	*/

	timer = setInterval(function() {
			var concurrentStamps = 0;
			var durationSeconds = $("#movie_player > div.html5-video-container > video").prop("currentTime");
			if (((timeStampComments.length)>0) && videoHasLoaded()) {
				popTimeStampElements();
			} else {
				console.log("failed if statement");
			}
			for (i=0; i<timeStampRecord.length; i++) {
//				console.log(timeStampComments[i][6]);
				if (compareStampToVideoTime(timeStampRecord[i][6], durationSeconds)) {
					//timeStamp within range of current time
					console.log("TIMESTAMP #" + i + " SHOULD BE SHOWN NOW, TIMESTAMP:" + timeStampRecord[i][6] + " , CURRENT VIDEO TIME:" + durationSeconds);
					if (concurrentStamps<1) {
						$('div#timeStamp' + i + '').addClass("timestamp-displaying");
						$('div#timeStamp' + i + '').css('display', 'inline-block');
						concurrentStamps++;
					} else {
//						$('div.timestamp-displaying').append('<div>Concurrent: ' + concurrentStamps + '</div>');
						$('div#timeStamp' + i + '').css('display', 'none');
						concurrentStamps++;
					}	
					console.log("CONCURRENT STAMPS: " + concurrentStamps);
				} else {
					//timeStamp not within range
					$('div#timeStamp' + i + '').css('display', 'none');
				}
			}
//			$('div.timestamp-displaying').append('<div>Concurrent: ' + concurrentStamps + '</div>');
			console.log("Interval function run; currenttime:" + durationSeconds);
		}, 1000);
	return timer;
}

//End a given setinterval timer
function endTimer(timer){
	clearInterval(timer);
}

//Check if the current time of the video is within appropriate range to display timestamp(true) or not(false)
function compareStampToVideoTime(timeStampTime, durationSeconds) {
	if (((timeStampTime-1)<durationSeconds) && (durationSeconds<(timeStampTime+7))) {
		//Video is currently within the time of a stamp
		return true;
	} else {
//		console.log("comparison false, stamp:" + timeStampTime + " , durationSeconds: " + durationSeconds);
		return false;
	}
}

function process() {
	$('<button/>', {
		id : 'timestamp-button',
		class : 'yt-uix-button yt-uix-button-size-default yt-uix-button-opacity action-panel-trigger yt-uix-tooltip button-show-icon button-show-text',
		type : 'button',
		title : 'Show time stamps'
		}).appendTo("#watch8-secondary-actions");

	$('<span/>', {
		id : 'timestamp-button-icon-wrapper',
		class : 'yt-uix-button-icon-wrapper'
	}).appendTo("#timestamp-button");

	$('<span/>', {
		id : 'timestamp-button-icon',
		class : 'yt-uix-button-icon yt-sprite'
	}).appendTo("#timestamp-button-icon-wrapper");

	$('<label/>', {
		class : 'enabled',
		innerHTML : 'enabled'
	}).appendTo("#timestamp-button-icon");

	$('<label/>', {
		class : 'disabled',
		innerHTML : 'disabled'
	}).appendTo("#timestamp-button-icon");


	$('<span/>', {
		id : 'timestamp-button-content',
		class : 'yt-uix-button-content'
	}).appendTo("#timestamp-button");

	$("#timestamp-button-content").html("TimeStamps");

	makeActionPanel();

	$('button#timestamp-button').on('click', function() {
		$('button#timestamp-button').toggleClass("timestamps-activated");
		$('button#timestamp-button').toggleClass("yt-uix-button-toggled");
		togglePanelDisplay();
		var durationSeconds = $("#movie_player > div.html5-video-container > video").prop("currentTime");
		console.log(durationSeconds);
		console.log(true);
		checkVideoCurrentTimePeriodically();
	});
}

/*Clears the timestamp markers in progress bar (useful for spf loading of videos)*/
function clearTimestampMarkers() {
	$('.timestampmarker').remove();
	$('.timestampcomment').remove();
}

function togglePanelDisplay() {
	$('div#watch-action-panels').toggleClass("hid");

	if ($('div#watch-action-panels').css('display') == 'none') {
		$('div#watch-action-panels').css('display', 'block');
	} else {
		$('div#watch-action-panels').css('display', 'none');
	}
	
	if ($('div#action-panel-timestamps').hasClass('hid')) {
		//Hide all sub divs of div#watch-action-panels
		$('div#watch-action-panels').children().addClass("hid");
		$('div#watch-action-panels').children().css('display', 'none');

		//Display timestamp panel
		$('div#action-panel-timestamps').toggleClass("hid");
		$('div#action-panel-timestamps').css('display', 'block');

	} else {
		$('div#action-panel-timestamps').toggleClass("hid");
		$('div#action-panel-timestamps').css('display', 'none');


	}
	
}

function makeActionPanel() {
	$('div#watch-action-panels').css('display', 'none');
	$('<div/>', {
		id : 'action-panel-timestamps',
		class : 'action-panel-content hid',
		style : 'display : none'
	}).appendTo('div#watch-action-panels');
	$('div#action-panel-timestamps').append("<div>Heya!</div>");
}


