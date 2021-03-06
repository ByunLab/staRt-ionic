/*global Promise resolveLocalFileSystemURL */
'use strict';

///////// Helpers //////////////////////////////////////////////////////////////

function scrambleArray(array) {
	for (var i=0; i<array.length; ++i) {
		var rndidx = Math.floor(Math.random()*array.length);
		var tmp = array[i];
		array[i] = array[rndidx];
		array[rndidx] = tmp;
	}
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
	    console.log('Successful file read...');
	    successCb();
		};

		fileWriter.onerror = function (e) {
	    console.log('Failed file read: ' + e.toString());
		};

		fileWriter.write(dataObj);
	});
}

function saveJSON(jsonObject, absolutePath, successCb)
{
	var storageDir = absolutePath.substring(0, absolutePath.lastIndexOf('/')+1);
	var filename = absolutePath.substr(absolutePath.lastIndexOf('/') + 1);
	resolveLocalFileSystemURL('file://' + storageDir, function(dirEntry) {
		createFile(dirEntry, filename, JSON.stringify(jsonObject), successCb);
	});
}

////////////////////////////////////////////////////////////////////////////////

var practiceDirective = angular.module( 'practiceDirective');

practiceDirective.controller( 'PracticeDirectiveController', function($scope, $timeout, $localForage, AutoService, NotifyingService, FirebaseService, ProfileService, SessionStatsService, StartUIState, UploadService, UtilitiesService, $rootScope, $state, $http, $cordovaDialogs, ToolbarService, QuestScore, QuizScore, AdaptDifficulty)
{
	ProfileService.getCurrentProfile().then(function (profile) {
		$scope.participant_name = profile.name;
		$scope.formalTester = !!profile.formalTester;
		if (profile.nIntroComplete >= 1) {
			$scope.session_number = profile.nBiofeedbackSessionsCompleted + profile.nNonBiofeedbackSessionsCompleted + 1;
		}
	});

	function initialPracticeSession(startTimestamp, type, probe, count) {
		return {
			id: UtilitiesService.guid(),
			ratings: [],
			probe: probe,
			type: type,
			startTimestamp: startTimestamp,
			endTimestamp: null,
			count: count,
			percentTrialsCorrect: 0,
			numberTrialsCorrect: 0
		};
	}

	// var uploadURLs = [
	// 	"http://localhost:5000",
	// 	"http://localhost:5000",
	// 	"http://localhost:5000",
	// 	"http://localhost:5000"
	// ];

	$scope.tinyFont = false;
	$scope.smallFont = false;
	$scope.active = true;
	$scope.isFeedbacking = false;
	$scope.isPracticing = false;
	$scope.currentWord = null;
	$scope.rating = 0;
	$rootScope.isRecording = false;
	$scope.hasValidWordList = false;
	$scope.uploadStatus = {
		isUploading: false,
		uploadProgress: 0
	};

	// We should rerandomize the word list when we've completed a cycle through all the words.
	// But this gets tricky when we add new words to our list from a difficulty change, and our currentWordIdx
	// is some value other than 0. So when we get a wordlist of a new length L we set reorderOffset to
	// currentWordIdx. So when currentWordIdx - reordOffset
	$scope.reorderOffset = 0;
	$scope.currentWordIdx = -1;
	$scope.currentPracticeSession = null;

	// quest-specific vars ---------------------------
	// see questscoring.md &
	// partials/quest/scoringConstructors.js
	$scope.questCoins = []; // holds stacks of Quest Coins
	$scope.highscores;
	$scope.milestones;
	$scope.scores; // handles state for active Quest score counters
	$scope.difficulty = 1; // adaptive difficulty level
	$scope.carrier_phrases = AdaptDifficulty.phrases[0];

	$scope.userPrefs = {};
	$scope.userPrefs.cardsOn = true;
	//cardsOn: Should cards be displayed at end of block?
	$scope.userPrefs.badgesOn = true;
	//badgesOn: Should in-game badges be displayed?
	$scope.userPrefs.remindersOn = true;
	//reminderOn: Should the verbal feedback reminder be added to the end-of-block card stack?

	$scope.sandbank = false;
	// flag, used to open/close Sandbank drawer
	$scope.sbInfoDrawer = false;
	// flag, used to open/close the sandbank More Info drawer
	$scope.sbSettings = false;
	// flag, used to toggle b/t 'Scoring Info' and 'Settings' in sbInfo drawer



	// quiz-specific vars
	$scope.quizType = undefined;

	// WIP Helpers --------------------------- //#hc
	$scope.qtScoreDebug = false;
	$scope.qtAdaptDiffDebug = false;
	$scope.qtBadgesDebug = true;
	$scope.qzGraphicsMode = true;

	// TOOLBAR (buttons in upper right) --------------------------

	// called by $scope.beginWordPractice()
	$scope.setupToolbar = function() {
		$scope.toolbar = ToolbarService.practice_initTB(
			$scope.probe, $scope.type,
			$scope.count, $scope.forceWaveHidden );
	}; // end setupToolbar

	// assign event handlers to toolbar btns
	$scope.tbHelp = function(){
		var helpMsg = $scope.toolbar[$scope.toolbar.length -1].helpMsg;
		console.log( helpMsg );
	};
	$scope.tbStop = function() {
		if ($scope.isPracticing) {
			if (window.AudioPlugin === undefined) {
				$scope.endWordPractice();
			} else {
				navigator.notification.confirm('Are you sure you would like to leave this session?', function (index) {
					if (index === 1 ) {
						$scope.endWordPractice();
					}}, 'Quit Session?',
				['Leave Session', 'Stay']);
			}
		} // if ($scope.isPracticing)
	};


	// RATINGS ---------------------------------------------------
	// data is a value of: 1, 2, or 3.
	function handleRatingData(data) {

		var update_difficulty = function(increment) {
			$scope.difficulty += increment;
			if ($scope.difficulty > 5) $scope.difficulty = 5;
			if ($scope.difficulty < 1) $scope.difficulty = 1;

			if (!($scope.type == 'Syllable' || $scope.probe)) {
				if($scope.difficulty >= 5) {
					$scope.carrier_phrases = AdaptDifficulty.phrases[2];
				} else if($scope.difficulty === 4) {
					$scope.carrier_phrases = AdaptDifficulty.phrases[1];
				} else {
					$scope.carrier_phrases = AdaptDifficulty.phrases[0];
				}
				console.log('reloading csv data');
				return $scope.reloadCSVData();
			}
			return Promise.resolve();
		};

		// process new rating
		if (!$scope.probe) { //quest

			// check for end of coinRow
			if($scope.scores.coinRowMultiples > 1) {
				if($scope.currentWordIdx > 0 &&
					(($scope.currentWordIdx)% $scope.scores.coinRowMax == 0))
				{
					console.log('RESET COIN ROW');
					$scope.questCoins = [];

					var remainingTrials = $scope.scores.totalTrials - ($scope.currentWordIdx + 1);

					$scope.scores.coinRowCounter = (remainingTrials > $scope.scores.coinRowMax) ? $scope.scores.coinRowMax : remainingTrials;

					QuestScore.initCoinCounter($scope.scores, $scope.questCoins);
				}

			}

			QuestScore.questRating(data, $scope.scores, $scope.milestones, $scope.currentWordIdx, $scope.badges, $scope.type);

			var NUM_WORDS_IN_BLOCK = 10;
			// if Quest end-of-block, check Adaptive Difficulty
			if ($scope.currentWordIdx % NUM_WORDS_IN_BLOCK == 0 &&
				$scope.currentWordIdx != 0 && $scope.scores.changeDifficulty != 0) {
				update_difficulty($scope.scores.changeDifficulty);
			}
			return Promise.resolve();

		} else { //else if quiz, no adapt Diff
			// I only have the qzSW svg at the moment
			if($scope.quizType === 'qzSW') {
				QuizScore.quizRating(data, $scope.quizType, $scope.currentWordIdx, $scope.qzGraphicsMode);
			}
			// console.log("QUIZ TYPE: " + $scope.quizType);
		}
	} // end handleRatingData


	// ----------------------------------------------
	// eslint-disable-next-line no-unused-vars
	function recordingDidStart(profileDescArray) {
		console.log('Recording did start');
		if (!!$state.current && ($state.current.url === 'words' || $state.current.url === 'auto')) {
			$rootScope.isRecording = true;
		}
		// This is the case where someone starts a recording session and immediately quits.
		else {
			$scope.endWordPractice();
		}
	}

	// eslint-disable-next-line no-unused-vars
	function recordingDidFail(err) {
		console.log('Recording failed');
	}

	function sessionDisplayString() {
	    var type = $scope.type ? $scope.type.toLowerCase() : 'word';
	    var quizOrQuest = $scope.probe ? 'quiz' : 'quest';
	    var stats = SessionStatsService.getCurrentProfileStats();
	    var session = stats ? stats.thisContextString : '';
	    return type + ' ' + quizOrQuest + ' ' + session;
	}

	function uploadCallbackForSession(session) {
	  return function uploadProgressHandler(progressEvent, idx) {
	    session.uploadProgress[idx] = progressEvent.loaded / progressEvent.total;
	    $scope.uploadStatus.uploadProgress = session.uploadProgress.reduce(function (x, y) {
	      return x + y;
	    }) / 4;
	  };
	}

	function completeCallback() {
	  $scope.uploadStatus.isUploading = false;
	  $cordovaDialogs.alert(
	    'Session uploaded successfully.',
	    'Upload Complete',
	    'Okay'
	  );
	}

	function errorCallback(error) {
		if (error.code === 3) {
			$cordovaDialogs.alert(
				'Server Upload Failed. Please check your internet connection and try again.',
				'Upload Error',
				'Okay'
			);
		} else {
			$cordovaDialogs.alert(
				'An error has occurred: Code = ' + error.code,
				'Unexpected Error',
				'Okay'
			);
			console.log('upload error source ' + error.source);
			console.log('upload error target ' + error.target);
		}
	}


	function createQuestHighscoresOnFB() {
		// should only be called by beginPracticeForUser(user)
		// inits a new highscoresQuest object on firebase, if no  highscores found in user profile
		var newHighScores = QuestScore.initNewHighScores();
		ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
			var highscoresFB = doc.data().highscoresQuest;
			if (!highscoresFB) highscoresFB = newHighScores;
			t.update(handle, {highscoresQuest: highscoresFB});
		}); // runTransaction
	}

	function updateQuestHighscores() {
		/*
		Called by:
			storeRecordingSession():
				Saves highscores only if the recording session is complete
		or by:
			endPractice(): if no recording session (window.AudioPlugin === undefined)
				Saves incomplete session highscores
				Purpose: debugging highscores logic
		*/
		if($scope.shouldUpdateHighscores) {
			var highscoresUpdateData = $scope.highscoresUpdateData;
			// console.log(highscoresUpdateData);
			ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
				var highscoresFB = doc.data().highscoresQuest;
				for (var key in highscoresUpdateData) {
					highscoresFB[key].push(highscoresUpdateData[key]);
				}
				t.update(handle, {highscoresQuest: highscoresFB});
			}); // runTransaction

			$scope.shouldUpdateHighscores = false;
		} // if if($scope.shouldUpdateHighscores)
	} // end updateHighscores()

	function resetQuestHighscores() {
		console.log('OBLITERATING HIGHSCORES OBJ');
		$scope.highscores = QuestScore.initNewHighScores($scope.highscores);

		ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
			t.update(handle, {highscoresQuest: null});
		});
		$scope.endWordPractice();
	}


	function storeRecordingSession() {
		// Should only be called from w/in recordingDidStop()
		var savedPracticeSession =  Object.assign({}, $scope.currentPracticeSession);
		savedPracticeSession.isFormalSession = AutoService.isSessionActive();
		ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
			var recordingSessionHistory = doc.data().recordingSessionHistory;
			if (recordingSessionHistory == null) {
				recordingSessionHistory = [savedPracticeSession];
			} else {
				recordingSessionHistory.push(savedPracticeSession);
			}
			t.update(handle, {recordingSessionHistory: recordingSessionHistory});
		});
		if(!$scope.probe) updateQuestHighscores();
	}

	function recordingDidStop(files) {
		console.log('Finished recording');
		console.log('Metadata: ' + files.Metadata);
		console.log('LPC: ' + files.LPC);
		console.log('Audio: ' + files.Audio);
		var jsonPath = files.Metadata.replace('-meta.csv', '-ratings.json');

		$scope.currentPracticeSession.count = $scope.count;
		$scope.currentPracticeSession.endTimestamp = Date.now();

		// Ratings might contain files from previous uploads
		$scope.currentPracticeSession.ratings.forEach(function (rating) {
			if (!rating.audioFile) {
				rating.audioFile = files.Audio.substr(files.Audio.lastIndexOf('/') + 1);
			}
		});

		var doUpload = ($scope.currentPracticeSession.ratings.length > 0 && $scope.formalTester);
		// If the user is not done yet, we should save all the data that we need
		// to restore the practice session.
		var didNotFinish = $scope.currentPracticeSession.ratings.length > 0 && $scope.currentPracticeSession.count > $scope.currentPracticeSession.ratings.length;

		var doStoreFormalSession = didNotFinish && AutoService.isSessionActive();
		var storeTask = Promise.resolve();


		storeRecordingSession();

		if (doStoreFormalSession) {
			console.log('storing formal session');
			AutoService.pauseSession(); // TODO: Perhaps set category restrictions to null.
			var currentPracticeSessionCopy = Object.assign({}, $scope.currentPracticeSession);
			ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
				t.update(handle, { inProcessSession: currentPracticeSessionCopy });
			});
		}
		else {
			ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
				t.update(handle, { inProcessSession: null });
			});
		}


		if ($scope.homeScreenClicked) {
			var resumeMessage = 'Hey, looks like you quit staRt mid session! You can resume quizzes and quests by going to the recordings section on the Profiles page.';
			if (doStoreFormalSession) {
				resumeMessage = 'You quit midway through a session. You can resume the formal session by going to the Profiles page and clicking Start Session.';
			}
			$cordovaDialogs.alert(
				resumeMessage,
				'Session Interrupted',
				'Got it!'
			).then(function() {$state.go($scope.recordingStoppedDestination);});
		} else {
			storeTask.then(function() {
				if (doUpload && $scope.formalTester) {
					saveJSON($scope.currentPracticeSession.ratings, jsonPath, function () {
						files.Ratings = jsonPath;
						$scope.currentPracticeSession.files = files;
						var practiceTypeStr = sessionDisplayString();
						var session = $scope.currentPracticeSession; //Object.assign({}, $scope.currentPracticeSession);
						navigator.notification.confirm('Would you like to upload this session?',
							function (index) {
								NotifyingService.notify('recording-completed', session);
								if (index === 1) {
									session.uploadProgress = [0, 0, 0, 0];
									UploadService.uploadPracticeSessionFiles(
										files,
										session.id,
										uploadCallbackForSession(session),
										completeCallback,
										errorCallback
									);
									$scope.uploadStatus.isUploading = true;
								}
								if ($scope.redirectAfterSession) {
									$state.go($scope.recordingStoppedDestination);
								}
							}, 'Upload',
							['Okay', 'Later']);
					});
				}
			});
		}
		$rootScope.isRecording = false;
	}

	function setQuizType_graphics() {
		if ($scope.type === 'Syllable') {
			$scope.quizType = 'qzSyll';
		} else if($scope.type === 'Word' && $scope.count < 40) {
			$scope.quizType = 'qzSW';
		} else if($scope.type === 'Word' && $scope.count > 40) {
			$scope.quizType = 'qzWord';
		} else {
			$scope.quizType = undefined;
		}
	}

	/**
   *
   * @param items An array of items.
   * @param fn A function that accepts an item from the array and returns a promise.
   * @returns {Promise}
   */
	function forEachPromise(items, fn) {
		return items.reduce(function (promise, item) {
			return promise.then(function () {
				return fn(item);
			});
		}, Promise.resolve());
	}

	// NOTE: This fn is called for BOTH quiz and quest during $scope.beginWordPractice().
	// However, it doesn't do anything if($scope.probe), b/c we aren't saving or resuming scores yet/
	function beginPracticeForUser(user) {
		//console.log(user);

		var sessionPrepTask = Promise.resolve();
		$scope.currentWordIdx = 0;
		var needToReload = false;

		// COLLECT SAVED-SESSION DATA ($scope.currentPracticeSession) AND HIGHSCORE DATA ($scope.highscores)
		// on-protocol quest && saved session

		$scope.isFormalSession = AutoService.isSessionActive()
		if (user.inProcessSession && AutoService.isSessionActive()) {
			needToReload = true;
			$scope.currentPracticeSession = Object.assign({}, user.inProcessSession);
		}
		// off-protocol quest and saved session
		if ($rootScope.sessionToResume && !AutoService.isSessionActive()) {
			needToReload = true;
			$scope.currentPracticeSession = Object.assign({}, $rootScope.sessionToResume);
		}
		// QUEST-ONLY: same for all, regardless of resumed-sesh and on-protocol status
		if (!$scope.probe) {
			if (user.highscoresQuest) {
				console.log('User has saved Highscores');
				$scope.highscores = Object.assign({}, user.highscoresQuest);

			} else {
				console.log('User has NO saved Highscores');
				$scope.highscores = QuestScore.initNewHighScores($scope.highscores);
				createQuestHighscoresOnFB();
			}
			//console.log($scope.highscores);
		}

		// TODO: Check to see if there's a better way to clear out the current session we're ressuming.
		$rootScope.sessionToResume = null;

		// QUEST-ONLY: ADDITIONAL INIT VALUES
		if (!$scope.probe) {
			// Same for all quests, regardless of resume-session status. For saved sessions, these vals are updated during the sessionPrepTask process
			$scope.scores = QuestScore.initScores($scope.scores, $scope.count, $scope.questCoins); // always new
			$scope.milestones = QuestScore.initMilestones($scope.highscores); // built from highscores
			$scope.badges = QuestScore.initBadges($scope.badges, $scope.userPrefs); // always new
			$scope.difficulty = 1;
		} //if (!$scope.probe)

		if (needToReload) { // QUEST & QUIZ: RESUME SESSION STATE
			var previousRatings = $scope.currentPracticeSession.ratings;
			console.log('previous ratings: %o', previousRatings);
			$scope.scores.isResumePrep = true;

			sessionPrepTask = forEachPromise(previousRatings, function (rating) {
				console.log('giving rating: %o', rating);
				$scope.currentWordIdx++;
				return handleRatingData(rating.rating);
			}).then(function () {
				$scope.currentWordIdx = $scope.currentPracticeSession.ratings.length - 1;
				$scope.scores.isResumePrep = false;
			});
		} else if (!needToReload) { // QUEST & QUIZ: INIT NEW SESSION
			$scope.currentWordIdx = -1;
			$scope.currentPracticeSession = initialPracticeSession(
				Date.now(),
				$scope.type || 'word',
				$scope.probe || 'quest',
				$scope.count
			);
		}

		if (!$scope.probe) {
			$scope.currentPracticeSession.categoryRestrictions = $rootScope.finalSelectedCategories;
		} else { // We explicitly set this to null so practice sessions stored in recordingHistory have a consistent set of keys.
			$scope.currentPracticeSession.categoryRestrictions = null;
		}
		$rootScope.finalSelectedCategories = null;
		// -----------------------------------------------------
		//IMPORTANT: Even if this is a continuation of a previous session, it still needs a unique recording ID; so you set/overwrite-the-old-one here.
		$scope.currentPracticeSession.id = UtilitiesService.guid();
		if(!$scope.probe) $scope.scores.sessionID = $scope.currentPracticeSession.id;

		sessionPrepTask.then(function () {
			if (window.AudioPlugin !== undefined) {
				AudioPlugin.startRecording(user, sessionDisplayString(),  $scope.currentPracticeSession.id, recordingDidStart, recordingDidFail);
			}
			$timeout(advanceWord);
		});
	}

	function setCurrentWord() {
		if ($scope.count && $scope.currentWordIdx >= $scope.count) {
			if($scope.probe) {
				$scope.endWordPractice();
			}
			// quest is ended via the end-of-block dialog boxes
		} else {
			var NUM_WORDS_IN_BLOCK = 10;
			var lookupIdx = $scope.currentWordIdx;
			if (!$rootScope.isRandomizeSession && !$scope.probe) {
				lookupIdx = Math.floor($scope.currentWordIdx / NUM_WORDS_IN_BLOCK);
			}
			lookupIdx = lookupIdx % $scope.wordOrder.length;
			$scope.currentWord = $scope.wordList[$scope.wordOrder[lookupIdx]];
			// also select a random carrier phrase
			$scope.carrier_phrase = $scope.carrier_phrases[Math.floor(Math.random() * $scope.carrier_phrases.length)];
			$scope.smallFont = $scope.carrier_phrase.length >= 16;
			$scope.tinyFont = $scope.carrier_phrase.length >= 32;
		}
	}

	function advanceWord() {
		if ($scope.currentWord !== null) {
			if ($scope.rating === 0) {
				console.log('Error - a given rating should never be 0');
				return;
			}
			$scope.currentPracticeSession.ratings.push({
				target: $scope.currentWord,
				rating: $scope.rating,
				time: Date.now(),
			});
			$scope.rating = 0;
			$scope.$broadcast('resetRating');
		}

		$scope.currentWordIdx++;

		setCurrentWord();

		if ($rootScope.isRandomizeSession && (1 + $scope.currentWordIdx - $scope.reorderOffset) % $scope.wordOrder.length == 0) {
			$scope.reorderWords(true);
		}
	} // advanceWord()

	$scope.beginWordPractice = function () {
		$scope.currentWord = null;
		if ($scope.isPracticing) return;

		$scope.isPracticing = true;
		$scope.setupToolbar();

		// $scope.quizType is used by svg in counters
		if ($scope.probe)  setQuizType_graphics();

		//console.log('QUIZ TYPE: ' + $scope.quizType);
		console.log('Beginning ' + sessionDisplayString());

		if (window.AudioPlugin === undefined) {
			if (navigator.notification) {
				navigator.notification.alert('Can\'t start ' + sessionDisplayString() + ': no audio', null, 'Error');
			}
		}

		ProfileService.getCurrentProfile().then(
			function (res) {
				if (res) {
					beginPracticeForUser(res);
					if ($scope.startPracticeCallback) $scope.startPracticeCallback();
				} else {
					if (navigator.notification) {
						navigator.notification.alert('Can\'t start ' + sessionDisplayString() + ', please select a profile first', null, 'No profile');
					}
				}
			},
			function (err) {
				if (navigator.notification) {
					navigator.notification.alert('Can\'t start ' + sessionDisplayString() + ': ' + err, null, 'Error');
				}
			}
		);
	};


	// BEGIN PAUSE-SETUP
	if ($rootScope.pauseListenersSet) {
		document.removeEventListener('pause', $rootScope.onPause);
		document.removeEventListener('resume', $rootScope.onResume);
	}

	$rootScope.onPause = function () {
		$scope.active = false;
		$scope.homeScreenClicked = true;
		$rootScope.endSessionAndGo('root.profiles');
	};

	$rootScope.onResume = function () {
		console.log('Resuming app, we should be switching states to profiles.');
	};

	document.addEventListener('pause', $rootScope.onPause);
	document.addEventListener('resume', $rootScope.onResume);
	$rootScope.pauseListenersSet = true;
	// END PAUSE-SETUP

	// END WORD PRACTICE SESSION ---------------------------------------
	$scope.endWordPractice = function () {

	  if (!$scope.probe) {
		  $scope.currentPracticeSession.numberTrialsCorrect = $scope.scores.session_coins.gold;

		  $scope.currentPracticeSession.percentTrialsCorrect = $scope.currentPracticeSession.numberTrialsCorrect/$scope.currentWordIdx;

		  // check if new highscores
		  $scope.shouldUpdateHighscores = false;
		  $scope.highscoresUpdateData = undefined;

		  if($scope.milestones.shouldUpdateFirebase) {
			  $scope.shouldUpdateHighscores = true;
			  var scoresPrep = $scope.milestones.update;
			  for (var key in scoresPrep) {
				  if (scoresPrep.hasOwnProperty(key)) {
					  if(Object.keys(scoresPrep[key]).length < 1) {
						  delete scoresPrep[key];
						} else {
							scoresPrep[key].sessionID = $scope.currentPracticeSession.id;
						}
					}
				}
				$scope.highscoresUpdateData = scoresPrep;
			}
		} // (!$scope.probe)

		$rootScope.isRecording = false;
		$scope.isPracticing = false;
		$scope.rating = 0;
		$scope.$broadcast('resetRating');
		$scope.currentWord = null;
		$scope.currentWordIdx = -1;
		$scope.quizType = undefined;

		if (window.AudioPlugin === undefined) {
			storeRecordingSession();
		} else if (window.AudioPlugin !== undefined) {
			AudioPlugin.stopRecording(recordingDidStop, recordingDidFail);
		}
		if ($scope.endPracticeCallback) $scope.endPracticeCallback();
	};

	$scope.nextWord = function() {
		if ($scope.isPracticing) advanceWord();
	};

	$scope.parseWordList = function(wordListData) {
		var nextWordList = UtilitiesService.parseCSV(wordListData).slice(1).map(function(w) {
			return w[0];
		});
		$scope.wordList = $scope.wordList.concat(nextWordList);
	};

	$scope.reorderWords = function(randomize) {
	    $scope.wordOrder = [];
	    $scope.hasValidWordList = $scope.wordList.length > 0;
	    for (var i=0; i<$scope.wordList.length; ++i) {
			$scope.wordOrder.push(i);
		}
		if (randomize) {
			console.log('Randomizing!');
			$scope.reorderOffset = $scope.currentWordIdx + 1;
			scrambleArray($scope.wordOrder);
		}
	};

	$scope.reloadCSVData = function () {
		// hackzorz: we know that we're doing a Word Quiz and not a Quest
	    // if requested CSV is data/Word_Probe
		if ($scope.type === 'Word' && $scope.csvs[0] !== 'data/Word_Probe.csv') {
			var tempWordList = [];
			// map csvs to adaptive difficulty key names
			// to cause as few side effects as possible

			$scope.csvs.forEach(function (csv) {
				var key = csv.replace('data/wp_', '').replace('.csv', '');
				if ($scope.difficulty <= 3) {
					tempWordList = tempWordList.concat(AdaptDifficulty.words[key][$scope.difficulty]);
				} else {
					// difficulty is 4 or 5
					tempWordList = tempWordList
						.concat(AdaptDifficulty.words[key][1])
						.concat(AdaptDifficulty.words[key][2])
						.concat(AdaptDifficulty.words[key][3]);
				}
			});
			$scope.wordList = tempWordList;
			$scope.reorderWords(true);
			// We need to manually set the current word if we update from a rating change.
			if ($scope.currentWordIdx != -1) {
				setCurrentWord();
			}
			return Promise.resolve();
		}

		if ($scope.type === 'Syllable' || $scope.probe) {
			$scope.wordList = [];
			var loadTasks = [];
			$scope.csvs.forEach(function (csv) {
				loadTasks.push(
					$http.get(csv, {
						headers: {
							'Content-type': 'application/csv'
						}
					}).then(function (res) {
						$scope.parseWordList(res.data);
					})
				);
			});

			// eslint-disable-next-line no-unused-vars
			return Promise.all(loadTasks).then(function (res) {
				$scope.reorderWords(!($scope.type === 'Syllable' && $scope.probe));
			});
		}
	};

	// IN-GAME BUTTON HANDLERS (except for toolbar) -----------------
	$scope.resetQuestHighscores = function() { resetQuestHighscores(); };

	// called by rating btns in ui
	$scope.onRating = function(data) {
		if (!$scope.probe && $scope.scores && $scope.scores.endOfBlock) {
			return;
		}
		$scope.rating = data;
		$scope.nextWord();
		handleRatingData(data);
	};

	// SANDBANK SETTINGS
	// $scope.sandbank = false; // used to open and close botton drawer
	// $scope.sbInfoDrawer = false; // used to open/close the sandbank More Info drawer
	// $scope.sbSettings = false; // used to toggle b/t 'Scoring Info' and 'Settings' in sbInfo drawer
	$scope.toggleSandBank = function() {
		QuestScore.updateSandbank($scope.scores, $scope.milestones);
		$scope.sandbank = !$scope.sandbank;

		if(!$scope.sandbank) {
			QuestScore.updateUserPrefs($scope.badges, $scope.userPrefs);
		}
	};

	$scope.toggle_sbInfoDrawer = function() {
		$scope.sbInfoDrawer = !$scope.sbInfoDrawer;
	};

	$scope.tap_sbSettings = function() { $scope.sbSettings = true; };

	$scope.tap_sbInfo = function() { $scope.sbSettings = false; };


	// DIALOG SEQUENCE HANDLERS ---------------------
	$scope.dialogEnd = function() {
		//if ($scope.currentWordIdx >= $scope.count) {}
		$scope.endWordPractice();
	};

	$scope.dialogResume = function() {
		QuestScore.resetForNewBlock($scope.scores, $scope.badges);
	};

	$scope.dialogNext = function() {
		QuestScore.nextCard($scope.badges);
	};


	$scope.$watch('csvs', function () {
		$scope.hasValidWordList = false;
		if ($scope.csvs) {
			$scope.reloadCSVData().then(function () {
				if ($scope.hasValidWordList && !$scope.isPracticing && $scope.beginOnLoad) {
					$scope.beginWordPractice();
				}
			});
		}
	});

	$scope.myURL = $state.current.name;

	$rootScope.endSessionAndGo = function (destination) {
		$scope.redirectAfterSession = true;
		$scope.recordingStoppedDestination = destination;
		$scope.endWordPractice();
	};

	var unsubscribe = $rootScope.$on('$urlChangeStart', function (event, next) {
		if (next === $scope.myURL) {
			$scope.active = true;
		} else {
			if ($rootScope.isRecording) {
				$scope.endWordPractice();
			}
			$scope.active = false;
	  }
	});

	$scope.$on('$destroy', function() {
	    unsubscribe();
	});
});
