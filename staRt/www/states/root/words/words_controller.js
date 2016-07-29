/*globals console:false, angular:false, window:false, alert:false */
/*globals AudioPlugin:false */

'use strict';

( function(  )
{
	var words = angular.module( 'words' );

	words.controller('WordsController', function($scope, $timeout, $localForage, StartUIState, wordListData, $rootScope, $state)
	{
		console.log('WordsController here!');

		var uploadURL = "http://127.0.0.1:5000";

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

		$scope.isPracticing = false;
		$scope.currentWord = null;
		$scope.rating = 0;
		$scope.isRecording = false;
		$scope.isUploading = false;
		$scope.uploadProgress = 0;
		var wordList = parseCSV(wordListData.data).slice(1).map(function(w) {
			return w[0];
		});
		$scope.currentWordIdx = -1;
		var wordOrder = [];
		$scope.currentPracticeSession = null;
		for (var i=0; i<wordList.length; ++i) {
			wordOrder.push(i);
		}

		function scrambleArray(array) {
			for (var i=0; i<array.length; ++i) {
				var rndidx = Math.floor(Math.random()*array.length);
				var tmp = wordOrder[i];
				wordOrder[i] = wordOrder[rndidx];
				wordOrder[rndidx] = tmp;
			}
		}

		function initialPracticeSession() {
			return {ratings:[]};
		}

		function recordingDidStart(profileDescArray) {
			$scope.isRecording = true;
		}

		function recordingDidFail() {

		}

		function uploadFile(absolutePath, mimeType, progressCb, completeCb) 
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

					var headers={'filename':options.fileName};
					options.headers = headers;

					var ft = new FileTransfer();
					ft.onProgress = progressCb;
					ft.upload(fileEntry.toInternalURL(), encodeURI(uploadURL), win, fail, options);

				}, function(error) {
					console.log(error);
				});
				console.log(fileEntry.toInternalURL());
			}, function(error) {
				console.log(error);
			});
		}

		function createFile(dirEntry, fileName, dataObj, successCb) {
		    // Creates a new file or returns the file if it already exists.
		    dirEntry.getFile(fileName, {create: true, exclusive: false}, function(fileEntry) {
		        writeFile(fileEntry, dataObj, successCb);
		    });

		}

		function writeFile(fileEntry, dataObj, successCb) {
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
					mimeTypes[i],
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

			if ($scope.currentPracticeSession.ratings.length > 0) {
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
			}
			$scope.currentWordIdx = ($scope.currentWordIdx + 1) % wordOrder.length;
			if ($scope.currentWordIdx === 0) {
				scrambleArray(wordOrder);
			}
			$scope.currentWord = wordList[wordOrder[$scope.currentWordIdx]];
		}

		$scope.beginWordPractice = function() {
			console.log("Beginning to practice words");

			if (window.AudioPlugin === undefined) {
				alert("Can't record word practice --- no Audio");
			}

			$localForage.getItem('currentUser').then(
				function(res) {
					if (res) {
						beginPracticeForUser(res);
					} else {
						alert("Can't start word practice -- no current user");
					}
				}, function(err) {
					alert("Error starting word practice: " + err);
				}
			);
		};

		$scope.endWordPractice = function() {
			$scope.isPracticing = false;
			$scope.rating = 0;
			$scope.currentWord = null;
			$scope.currentWordIdx = -1;
			if (window.AudioPlugin !== undefined) {
				AudioPlugin.stopRecording(recordingDidStop, recordingDidFail);
			}
			console.log("Ending to practice words");
		};

		$scope.nextWord = function() {
			if ($scope.isPracticing)
				advanceWord();
		};
	});

} )(  );
