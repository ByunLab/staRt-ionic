'use strict';

///////// Helpers //////////////////////////////////////////////////////////////

function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	s4() + '-' + s4() + s4() + s4();
};

function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
	.toString(16)
	.substring(1);
};

function parseCSV(str) {
	var arr = [];
	var quote = false;
	var row=0, col=0, c=0;
	for (; c < str.length; c++) {
		var cc = str[c], nc = str[c+1];
		arr[row] = arr[row] || [];
		arr[row][col] = arr[row][col] || '';
		if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
		if (cc == '"') { quote = !quote; continue; }
		if (cc == ',' && !quote) { ++col; continue; }
		if (cc == '\n' && !quote) { ++row; col = 0; continue; }
		arr[row][col] += cc;
	}
	return arr;
}

function scrambleArray(array) {
	for (var i=0; i<array.length; ++i) {
		var rndidx = Math.floor(Math.random()*array.length);
		var tmp = array[i];
		array[i] = array[rndidx];
		array[rndidx] = tmp;
	}
}

function initialPracticeSession() {
	return {
		id: guid(),
		ratings: []
	};
}

function uploadFile(absolutePath, destURL, mimeType, sessionID, progressCb, completeCb)
{
	var win = function (r) {
		console.log("Code = " + r.responseCode);
		console.log("Response = " + r.response);
		console.log("Sent = " + r.bytesSent);
		if (completeCb)
			completeCb(r);
	}

	var fail = function (error) {
		alert("An error has occurred: Code = " + error.code);
		console.log("upload error source " + error.source);
		console.log("upload error target " + error.target);
	}

	resolveLocalFileSystemURL("file://" + absolutePath, function(fileEntry) {
		fileEntry.file( function(file) {
			var options = new FileUploadOptions();
			options.fileName = absolutePath.substr(absolutePath.lastIndexOf('/') + 1);
			options.mimeType = mimeType;
			options.chunkedMode = false;

			var headers={
				'filename':options.fileName
			};
			options.headers = headers;
			var params = {
				"session_id": sessionID
			};
			options.params = params;

			// HACK: Add the session id to the URL, so that the server will recognize it
			destURL = destURL + "?session_id=" + sessionID;

			var ft = new FileTransfer();
			ft.onProgress = progressCb;
			ft.upload(fileEntry.toInternalURL(), encodeURI(destURL), win, fail, options);

		}, function(error) {
			console.log(error);
		});
		console.log(fileEntry.toInternalURL());
	}, function(error) {
		console.log(error);
	});
}

function createFile(dirEntry, fileName, dataObj, successCb)
{
		// Creates a new file or returns the file if it already exists.
		dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
			writeFile(fileEntry, dataObj, successCb);
		});
}

function writeFile(fileEntry, dataObj, successCb)
{
		// Create a FileWriter object for our FileEntry (log.txt).
		fileEntry.createWriter(function (fileWriter) {

			fileWriter.onwriteend = function() {
				console.log("Successful file read...");
				successCb();
			};

			fileWriter.onerror = function (e) {
				console.log("Failed file read: " + e.toString());
			};

			fileWriter.write(dataObj);
		});
}

function saveJSON(jsonObject, absolutePath, successCb)
{
	var storageDir = absolutePath.substring(0, absolutePath.lastIndexOf('/')+1);
	var filename = absolutePath.substr(absolutePath.lastIndexOf('/') + 1);
	resolveLocalFileSystemURL("file://" + storageDir, function(dirEntry) {
		createFile(dirEntry, filename, JSON.stringify(jsonObject), successCb);
	});
}

////////////////////////////////////////////////////////////////////////////////

var practiceDirective = angular.module( 'practiceDirective' );

practiceDirective.controller( 'PracticeDirectiveController',
	function($scope, $timeout, $localForage, ProfileService, StartUIState, $rootScope, $state, $http)
	{
		console.log('Practice Controller here!');

		$http.get($scope.data, {
			headers: {
				'Content-type': 'application/csv'
			}
		}).success(function (res) {
			$scope.parseWordList(res);
		});

		$scope.$on("enter", function() {
			$scope.active = true;
		});

		$scope.$on("beforeLeave", function() {
			$scope.active = false;
			if ($scope.isRecording) {
				$scope.endWordPractice();
			}
		});

		// var uploadURLs = [
		// 	"http://localhost:5000",
		// 	"http://localhost:5000",
		// 	"http://localhost:5000",
		// 	"http://localhost:5000"
		// ];

		var uploadURLs = [
			"https://byunlab.com/start/session/ratings",
			"https://byunlab.com/start/session/metadata",
			"https://byunlab.com/start/session/lpc",
			"https://byunlab.com/start/session/audio"
		];

		$scope.active = false;
		$scope.isPracticing = false;
		$scope.currentWord = null;
		$scope.rating = 0;
		$scope.isRecording = false;
		$scope.isUploading = false;
		$scope.uploadProgress = 0;

		$scope.currentWordIdx = -1;
		$scope.currentPracticeSession = null;

		function recordingDidStart(profileDescArray) {
			$scope.isRecording = true;
		}

		function recordingDidFail() {

		}

		function uploadCallbackForSession(session, idx) {
			return function uploadProgressHandler(progressEvent) {
				session.uploadProgress[idx] = progressEvent.loaded / progressEvent.total;
				$scope.uploadProgress = session.uploadProgress.reduce(function(x,y){return x+y;})/4;
			}
		}

		function completeCallbackForSession(session, idx) {
			return function completeProgressHandler(response) {
				session.uploadsComplete[idx] = true;
				if (session.uploadsComplete.lastIndexOf(false) === -1) {
					$scope.isUploading = false;
					navigator.notification.alert(null, null, "Upload Complete");
				}
			}
		}

		function uploadPracticeSessionFiles(session)
		{
			session.uploadProgress = [0, 0, 0, 0];
			session.uploadsComplete = [false, false, false, false];
			var filesToUpload = [session.files.Ratings, session.files.Metadata, session.files.LPC, session.files.Audio];
			var mimeTypes = ["text/json", "text/csv", "text/csv", "audio/wav"];
			for (var i=0; i<4; i++) {
				uploadFile(filesToUpload[i],
					uploadURLs[i],
					mimeTypes[i],
					session.id,
					uploadCallbackForSession(session, i),
					completeCallbackForSession(session, i)
					);
			}
			$scope.isUploading = true;
		}

		function recordingDidStop(files) {
			console.log("Finished recording");
			console.log("Metadata: " + files.Metadata);
			console.log("LPC: " + files.LPC);
			console.log("Audio: " + files.Audio);
			var jsonPath = files.Metadata.replace("-meta.csv", "-ratings.json");

			if ($scope.active && $scope.currentPracticeSession.ratings.length > 0) {
				saveJSON($scope.currentPracticeSession.ratings, jsonPath, function() {
					files.Ratings = jsonPath;
					$scope.currentPracticeSession.files = files;
					navigator.notification.confirm("Would you like to upload this word practice session?",
						function (index) {
							if (index == 1) {
								uploadPracticeSessionFiles($scope.currentPracticeSession);
							}
						}, "Upload",
						["OK", "Discard"]);
				});
			}

			$scope.isRecording = false;
		}

		function beginPracticeForUser(user) {
			$scope.isPracticing = true;
			$scope.currentPracticeSession = initialPracticeSession();
			if (window.AudioPlugin !== undefined) {
				AudioPlugin.startRecording(user, recordingDidStart, recordingDidFail);
			}
			advanceWord();
		}

		function advanceWord() {
			if ($scope.currentWord !== null) {
				if ($scope.rating === 0) {
					navigator.notification.alert("Rate pronunciation before advancing!", null, "Word not rated");
					return;
				}
				$scope.currentPracticeSession.ratings.push([$scope.currentWord, $scope.rating]);
				$scope.rating = 0;
				$scope.$broadcast("resetRating");
			}

			$scope.currentWordIdx++;

			if ($scope.count && $scope.currentWordIdx >= count) {
				$scope.endWordPractice();
			} else {
				var lookupIdx = $scope.currentWordIdx % $scope.wordOrder.length;
				if (lookupIdx && $scope.random) {
					scrambleArray($scope.wordOrder);
				}
				$scope.currentWord = $scope.wordList[$scope.wordOrder[lookupIdx]];
			}
		}

		$scope.beginWordPractice = function() {
			console.log("Beginning to practice words");

			if (window.AudioPlugin === undefined) {
				if (navigator.notification)
					navigator.notification.alert("Can't start work practice: no audio" , null, "Error");
			}

			ProfileService.getCurrentProfile().then(
				function(res) {
					if (res) {
						beginPracticeForUser(res);
					} else {
						if (navigator.notification)
							navigator.notification.alert("Can't start word practice -- create a profile first", null, "No profile");
					}
				}, function (err) {
					if (navigator.notification)
						navigator.notification.alert("Can't start work practice: " + err, null, "Error");
				}
				);
		};

		$scope.endWordPractice = function() {
			$scope.isPracticing = false;
			$scope.rating = 0;
			$scope.$broadcast("resetRating");
			$scope.currentWord = null;
			$scope.currentWordIdx = -1;
			if (window.AudioPlugin !== undefined) {
				AudioPlugin.stopRecording(recordingDidStop, recordingDidFail);
			}
			console.log("Ending word practice");
		};

		$scope.nextWord = function() {
			if ($scope.isPracticing)
				advanceWord();
		};

		$scope.parseWordList = function(wordListData) {
			$scope.wordList = parseCSV(wordListData).slice(1).map(function(w) {
				return w[0];
			});
			$scope.wordOrder = [];
			for (var i=0; i<$scope.wordList.length; ++i) {
				$scope.wordOrder.push(i);
			}
		}

		$scope.$on('ratingChange', function(event, data)
		{
			$scope.rating = data;
		});
	}
);