/*Things to do:
	1. Basic options:
		>Enable/Disable the app by clicking the logo
		>Settings like change the font size/colour???
	2. Be able to reply to comments if you click/interact with them
	3. Deal with overlapping timestamps
	4. Deal with resetting timestamp markers (i think they remain if clicking a link to another video [spf stuff])
	5. Deal with comments that are 3:20AM in the morning comments / bible quotes lol
	6. Be able to hover over the timestamps to see a preview of them
	

*/

/*Deal with multiple timestamps in the one comment: 1:30 for xxxx, 5:24 for xxxx*/


document.addEventListener("yt-navigate-finish", startRunning);
var key = "key=AIzaSyDrusteFhAYvTfF77mYNL-7MDmso7UyuVs";
var part = "part=snippet,replies";
var videoId;
var APIurl = "https://www.googleapis.com/youtube/v3/commentThreads";
var maxResults = "maxResults=100";
var timeStampComments;
var timeStampRecord;
var jarray = 0;
var timer;
var videoLoaded = 0;
var maxCommentLength = 400;
$('<div id=timeStampList class=ytp-ad-progress-list"></div>').appendTo("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-progress-list");
//fetchComments();
startRunning();

//Start interval timer and allow for timestamps to be display
function startRunning() {
	videoId = getVideoId();
	timeStampComments = new Array();
	timeStampRecord = new Array();
	fetchComments();
	timer = checkVideoCurrentTimePeriodically();
	document.addEventListener("yt-navigate-finish", function() {
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
	if ((endIndexOfVideoId = url.indexOf("&", startIndexOfVideoId))==-1) {
		videoId += url.substr(startIndexOfVideoId, url.length);
	} else {
		videoId += url.substr(startIndexOfVideoId, endIndexOfVideoId);	
	}
	return videoId;
}

function fetchComments(nextPageToken) {
	var urlRequest = APIurl + "?" + part + "&" + videoId + "&" + key + "&" + maxResults;
	if (nextPageToken) {
		urlRequest = APIurl + "?" + part + "&" + videoId + "&" + maxResults + "&pageToken=" + nextPageToken + "&" + key;
	}

//fetch.then.then.catch skeleton borrowed from https://developers.google.com/web/ilt/pwa/working-with-the-fetch-api
	fetch(urlRequest).then(function(response) {
		if (!response.ok) {
			throw Error(response.statusText);
		}
		//Read the response as json.
		return response.json();
	}).then(function(responseAsJson) {
		//Do stuff with the JSON
		if (responseAsJson.nextPageToken) {
			fetchComments(responseAsJson.nextPageToken);
			parseResponseForStamps(responseAsJson);
		} else {
			//function has retrieved all comments
			parseResponseForStamps(responseAsJson);
		}
	}).catch(function(error) {
		console.log('looks like there was a problem: ', error);
	});
}

function parseResponseForStamps(response) {
	//parse each comment (and their replies or no?) and see if they contain a timestamp... if so put em in array w/ author etc
	var timeStamp;
	for (i=0; i<response.items.length; i++) {
		var text = response.items[i].snippet.topLevelComment.snippet.textOriginal;
		//check if message text is too long
		if (text.length > maxCommentLength) {
			break;
		}
		//Pattern matching to find timestamp format
		var regex = /\d\d:\d\d:\d\d|\d:\d\d:\d\d|\d\d:\d\d|\d:\d\d/;
		if (timeStamp = text.match(regex)) {
			var author = response.items[i].snippet.topLevelComment.snippet.authorDisplayName;
			var likes = response.items[i].snippet.topLevelComment.snippet.likeCount;
			var profilePicUrl = response.items[i].snippet.topLevelComment.snippet.authorProfileImageUrl;
			var publishTime = response.items[i].snippet.topLevelComment.snippet.publishedAt;
			timeStampComments.push(new Array(author, text, likes, profilePicUrl, publishTime, timeStamp[0], convertStampToSeconds(timeStamp[0])));
		}
	}
}

//Pop timestamp array elements from global array and create timestamp page elements to page
function popTimeStampElements() {
	while (timeStampComments.length>0) {
		var id = "" + jarray++;
		var timeStamp = timeStampComments.shift();
		timeStamp.push(jarray);
		timeStampRecord.push(timeStamp);
		makeDivForTimeStamp(id, timeStamp[0], timeStamp[1], timeStamp[6], timeStamp[3]);
	}
}

//Construct a div for a given timestamp
function makeDivForTimeStamp(timeStampId, author, text, timeStamp, displayPic) {
	var videoDuration = $("#movie_player > div.html5-video-container > video").prop("duration");
	var timeStampXPos = (timeStamp/videoDuration)*100;

	//The Div containing message to be displayed @ timestamp time.
	$('<div id=timeStamp' + timeStampId + ' class="timestampcomment" aria-live="assertive" aria-atomic="true" data-layer="4">' + '</div>').appendTo("div#movie_player");
	$('<div class="commentDisplayPic">' + '<img src=' + displayPic + '></div>').appendTo('div#timeStamp' + timeStampId + '');
	$('<div class="commentMessage"></div>').appendTo('div#timeStamp' + timeStampId + '');
	$('<div class="commentAuthor">' + author + ' said:</div>').appendTo('div#timeStamp' + timeStampId + '> div.commentMessage');
	$('<div class="commentText">' + text + '</div>').appendTo('div#timeStamp' + timeStampId + '> div.commentMessage');
	$('<div id=timeStampPosition' + timeStampId + ' class="ytp-ad-progress timestampmarker" style="left:' + timeStampXPos + '%; width: 6px; background: #0fb707;"></div>').appendTo("#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar > div.ytp-progress-list");
}

//Function to convert timestamp format to seconds
function convertStampToSeconds(timeStamp){
	var timeStampSplit = timeStamp.split(':');
	var timeSeconds;
	//00:00:00
	if (timeStamp.length<6) {
		//max digit represents minutes
		timeSeconds = (+timeStampSplit[0])*60 + (+timeStampSplit[1]);
		return timeSeconds;
	} else if (timeStamp.length<9) {
		//max digit represents hours
		timeSeconds = (+timeStampSplit[0])*60*60 + (+timeStampSplit[1])*60 + (+timeStampSplit[2]);
		return timeSeconds;
	} else {
		return false;
	}
}

//Check if video has been loaded sufficiently on page to retrieve data from it
function hasVideoLoaded(){
	if (($("#movie_player > div.html5-video-container > video").prop("readyState"))>1) {
		//Video has loaded metadata
		return 1;
	} else {
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
			var commentHeight;
			var concurrentStamps = 0;
			var durationSeconds = $("#movie_player > div.html5-video-container > video").prop("currentTime");
			if (((timeStampComments.length)>0) && hasVideoLoaded()) {
				popTimeStampElements();
			}
			for (i=0; i<timeStampRecord.length; i++) {
				if (compareStampToVideoTime(timeStampRecord[i][6], durationSeconds)) {
					//timeStamp within range of current time
					if (concurrentStamps<1) {
						$('div#timeStamp' + i + '').addClass("timestamp-displaying");
						$('div#timeStamp' + i + '').css('display', 'block');
						concurrentStamps++;
					} else {
						$('div#timeStamp' + i + '').css('display', 'none');
						concurrentStamps++;
					}	
				} else {
					//timeStamp not within range
					$('div#timeStamp' + i + '').css('display', 'none');
				}
			}
//			$('div.timestamp-displaying').append('<div>Concurrent: ' + concurrentStamps + '</div>');
		}, 500);
	return timer;
}

//End a given setinterval timer
function endTimer(timer){
	clearInterval(timer);
}

//Check if the current time of the video is within appropriate range to display timestamp(true) or not(false)
function compareStampToVideoTime(timeStampTime, durationSeconds) {
	if (((timeStampTime)<durationSeconds) && (durationSeconds<(timeStampTime+5))) {
		//Video is currently within the time of a stamp
		return true;
	} else {
		return false;
	}
}

/*Clears the timestamp markers in progress bar (useful for spf loading of videos)*/
function clearTimestampMarkers() {
	$('.timestampmarker').remove();
	$('.timestampcomment').remove();
}


