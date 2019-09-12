// bug: no rating transmitted on Wave Hidden (Trial number 10/11)
// todo: new layout to accomodate for extended words

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

var practiceDirective = angular.module( 'practiceDirective');

practiceDirective.controller( 'PracticeDirectiveController',
			      function($scope, $timeout, $localForage, AutoService, NotifyingService, FirebaseService, ProfileService, SessionStatsService, StartUIState, UploadService, UtilitiesService, $rootScope, $state, $http, $cordovaDialogs, ToolbarService)
    {
	ProfileService.getCurrentProfile().then(function (profile) {
		$scope.participant_name = profile.name;
		$scope.clinician_name = FirebaseService.userName();
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
		};
	}

	// var uploadURLs = [
	// 	"http://localhost:5000",
	// 	"http://localhost:5000",
	// 	"http://localhost:5000",
	// 	"http://localhost:5000"
	// ];

	$scope.active = true;
	$scope.isFeedbacking = false;
	$scope.isPracticing = false;
	$scope.currentWord = null;
	$scope.rating = 0;
	$scope.isRecording = false;
	$scope.hasValidWordList = false;
	$scope.uploadStatus = {
	    isUploading: false,
	    uploadProgress: 0
	}

	$scope.currentWordIdx = -1;
	$scope.currentPracticeSession = null;

  // TOOLBAR ----------------------------------------------------
  // TO BE IMPLEMENTED IN THE FUTURE / NOT CURRENTLY IN USE

  // holds toolbar content for the current practice state
  $scope.toolbar;

  // called by $scope.beginWordPractice()
  $scope.setupToolbar = function() {
    $scope.toolbar = ToolbarService.practice_initTB(
      $scope.probe, $scope.type,
      $scope.count, $scope.forceWaveHidden );
  } // end setupToolbar

  // assign event handlers to toolbar btns
  $scope.tbHelp = function(){
    var helpMsg = $scope.toolbar[$scope.toolbar.length -1].helpMsg;
    console.log( helpMsg );
  }
  $scope.tbStop = function() {
    if ($scope.isPracticing) {
      $scope.endWordPractice();
    }
  }

	/* --------------------------------
	   adaptive difficulty
  	   -------------------------------- */
	$scope.block_score = 0;
	$scope.session_score = 0;
	$scope.difficulty = 1;
	var carrier_phrases = carrier_phrases_bank[0];
	var increase_difficulty_threshold = 0.8;
	var decrease_difficulty_threshold = 0.5;

	// remap data according to specs
	var remap_adaptive_difficulty_score = {
	    3: 1,
	    2: .5,
	    1: 0
	};

	function calculate_difficulty_performance(total, count){
	    return total / count;
  };

  function handleRatingData($scope, data) {
    // visual reinforcement
    if (!$scope.probe) {
      $scope.block_coins[$scope.block_coins.length - 1].push(visual_reinforcement_coin_color_map[data]);
      $scope.session_coins[visual_reinforcement_coin_color_map[data]]++;
      if (visual_reinforcement_coin_color_map[data] == "gold") {
        $scope.consecutive_golds++;
        var temp_golds_consecutive_gold_display = 0;
        $scope.consecutive_golds_breakpoints.forEach(function (value) {
          if ($scope.consecutive_golds >= value) {
            temp_golds_consecutive_gold_display = value;
          }
        })
        $scope.consecutive_golds_display = temp_golds_consecutive_gold_display;
      } else {
        $scope.consecutive_golds = 0;
      }
    }

    // adaptive difficulty

    $scope.block_score += remap_adaptive_difficulty_score[data];
    $scope.session_score += remap_adaptive_difficulty_score[data];

    if ($scope.currentWordIdx % 10 == 0 &&
      $scope.currentWordIdx != 0) {
      // todo: ratingChange emit error is preventing accurate calculation

      // recalculate difficulty
      var performance = calculate_difficulty_performance(
        $scope.block_score,
        10 // working in blocks of ten
      );


      if (!$scope.probe) {
        // recalculate highscores
        $scope.block_score_highscore = Math.max($scope.block_score_highscore, $scope.block_score);
        $scope.block_golds_highscore = Math.max($scope.block_golds_highscore,
          $scope.block_coins[$scope.block_coins.length - 1].filter(function (color) {
            return color === "gold";
          }).length);

        // reset scores
        $scope.block_score = 0;

        // reset coins
        $scope.block_coins.push([]);

        // reset consecutive count
        $scope.consecutive_golds = 0;
        $scope.consecutive_golds_display = 0;
			}

			function should_increase_difficulty() {return performance >= increase_difficulty_threshold && $scope.difficulty < 5;}
			function should_decrease_difficulty() {return performance <= decrease_difficulty_threshold && $scope.difficulty > 1;}
			function update_difficulty(increment) {
				$scope.difficulty += increment;
				if (!($scope.type == "Syllable" || $scope.probe)) {
					update_carrier_phase();
					return $scope.reloadCSVData();
				}
				return Promise.resolve();
			}

      if (should_increase_difficulty()) {
				return update_difficulty(1);
      } else if (should_decrease_difficulty()) {
				return update_difficulty(-1);
			}
    }

    return Promise.resolve();
	}

	function update_carrier_phase() {
	  switch ($scope.difficulty) {
	    case 1:
	    case 2:
	    case 3:
	      carrier_phrases = carrier_phrases_bank[0];
	      break;
	    case 4:
	      carrier_phrases = carrier_phrases_bank[1];
	      break;
	    case 5:
	      carrier_phrases = carrier_phrases_bank[2];
	      break;
	    default:

	  }
	}



	/* --------------------------------
	   visual reinforcement
  	   -------------------------------- */
	if(!$scope.probe){
	    $scope.highscores = {
		session: {
		    score: {
			total: 0,
			date: null
		    },
		    golds: {
			total: 0,
			date: null
		    }
		},
		block: {
		    score: {
			total: 0,
			date: null
		    },
		    golds: {
			total: 0,
			date: null
		    }
		}
	    };

	    // push to array so that history can be preserved
	    $scope.block_coins = [[]];

	    // need history on session coins?
	    $scope.session_coins = {
		gold: 0,
		silver: 0,
		bronze: 0
	    };
	    $scope.block_golds_highscore = 0;
	    $scope.block_score_highscore = 0;

	    $scope.consecutive_golds = 0;
	    $scope.consecutive_golds_breakpoints = [3, 5, 8, 10];

	    // create helper variable to iterate through and create sandholes
	    $scope.sandholes = new Array(Math.ceil($scope.count / 10));
	}

	// need this outside for some reason
	var visual_reinforcement_coin_color_map = {
	    3: "gold",
	    2: "silver",
	    1: "bronze"
	}

  // ----------------------------------------------

	function recordingDidStart(profileDescArray) {
	    $scope.isRecording = true;
	}

	function recordingDidFail(err) {
	    console.log("Recording failed");
	}

	function sessionDisplayString() {
	    var type = $scope.type ? $scope.type.toLowerCase() : "word";
	    var sesh = $scope.probe ? "quiz" : "quest";
	    var hidden = $scope.forceWaveHidden ? " trad" : " bio";
	    var stats = SessionStatsService.getCurrentProfileStats();
	    var session = stats ? stats.thisContextString : "";
	    return type + " " + sesh + hidden + " " + session;
	}

	function uploadCallbackForSession(session) {
	  return function uploadProgressHandler(progressEvent, idx) {
	    session.uploadProgress[idx] = progressEvent.loaded / progressEvent.total;
	    $scope.uploadStatus.uploadProgress = session.uploadProgress.reduce(function (x, y) {
	      return x + y;
	    }) / 4;
	  }
	}

	function completeCallback() {
	  $scope.uploadStatus.isUploading = false;
	  $cordovaDialogs.alert(
	    "Session uploaded successfully",
	    "Upload Complete",
	    "Okay"
	  );
  }

  function errorCallback(error) {
    if (error.code === 3) {
      $cordovaDialogs.alert(
        "Server Upload Failed. Please check your internet connection and try again.",
        "Upload Error",
        "Okay"
      );
    } else {
      $cordovaDialogs.alert(
        "An error has occurred: Code = " + error.code,
        "Unexpected Error",
        "Okay"
      );
      console.log("upload error source " + error.source);
      console.log("upload error target " + error.target);
    }
	}
	
	function storeRecordingSession() {
		ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
			var recordingSessionHistory = doc.data().recordingSessionHistory;
			if (recordingSessionHistory == null) {
				recordingSessionHistory = [$scope.currentPracticeSession];
			} else {
				recordingSessionHistory.push($scope.currentPracticeSession);
			}
			t.update(handle, {recordingSessionHistory: recordingSessionHistory});
		})
	}

	function recordingDidStop(files) {
	  console.log("Finished recording");
	  console.log("Metadata: " + files.Metadata);
	  console.log("LPC: " + files.LPC);
	  console.log("Audio: " + files.Audio);
	  var jsonPath = files.Metadata.replace("-meta.csv", "-ratings.json");
	  $scope.currentPracticeSession.count = $scope.count;
    $scope.currentPracticeSession.endTimestamp = Date.now();

    // Ratings might contain files from previous uploads
    $scope.currentPracticeSession.ratings.forEach(function (rating) {
      if (!rating.audioFile) {
        rating.audioFile = files.Audio.substr(files.Audio.lastIndexOf('/') + 1);
      }
    });

	  ProfileService.getCurrentProfile().then(function (profile) {
      var doUpload = ($scope.currentPracticeSession.ratings.length > 0);
      var doStoreSession = false;
	    // If the user is not done yet, we should save all the data that we need
      // to restore the practice session.
      if (profile.formalTester) {
        doStoreSession = (
          $scope.currentPracticeSession.ratings.length > 0 &&
          $scope.currentPracticeSession.count > $scope.currentPracticeSession.ratings.length &&
          AutoService.isSessionActive()
        );
      }

      var storeTask = Promise.resolve();
      if (doStoreSession) {
        storeTask = $cordovaDialogs.confirm(
          "Do you want to resume this recording session later?",
          "Continue Later",
          ["Okay", "Not really"]
        ).then(function(index) {
          if (index === 1) {
            AutoService.pauseSession();
            ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
              var res = t.update(handle, { inProcessSession: $scope.currentPracticeSession });
              console.log(res);
            });
          } else {
            ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
              t.update(handle, { inProcessSession: null });
            });
          }
        });
      } else {
        ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
          t.update(handle, { inProcessSession: null });
        });
      }

      storeTask.then(function() {
        if (doUpload) {
          saveJSON($scope.currentPracticeSession.ratings, jsonPath, function () {
            files.Ratings = jsonPath;
            $scope.currentPracticeSession.files = files;
            var practiceTypeStr = sessionDisplayString();
            var session = $scope.currentPracticeSession;
            navigator.notification.confirm("Would you like to upload this " + practiceTypeStr + " session?",
              function (index) {
                NotifyingService.notify("recording-completed", session);
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
              }, "Upload",
              ["Okay", "Later"]);
          });
        }
      });

	  });
		storeRecordingSession();
	  $scope.isRecording = false;
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

  function beginPracticeForUser(user) {
    /* --------------------------------
	    visual reinforcement
		-------------------------------- */
    if (!$scope.probe) {
      if (user.highscores) {
        // if there is user data on highscores
        // load them here
        $scope.highscores = user.highscores;
      }
      // implied else
      // use default highscores
    }

    var sessionPrepTask = Promise.resolve();
		$scope.currentWordIdx = 0;
    if (user.inProcessSession) {
      $scope.currentPracticeSession = Object.assign({}, user.inProcessSession);

      var previousRatings = $scope.currentPracticeSession.ratings;
      sessionPrepTask = forEachPromise(previousRatings, function (rating) {
				$scope.currentWordIdx++;
        return handleRatingData($scope, rating.rating);
      }).then(function () {
        $scope.currentWordIdx = $scope.currentPracticeSession.ratings.length - 1;
      });
    } else {
			$scope.currentWordIdx = -1;
      $scope.currentPracticeSession = initialPracticeSession(
        Date.now(),
        $scope.type || "word",
        $scope.probe || "quest",
        $scope.count
      );
    }

    // Even if this is a continuation of a previous session, it still needs
    // a unique recording ID
    $scope.currentPracticeSession.id = UtilitiesService.guid();

    sessionPrepTask.then(function () {
      if (window.AudioPlugin !== undefined) {
        AudioPlugin.startRecording(user, sessionDisplayString(),  $scope.currentPracticeSession.id, recordingDidStart, recordingDidFail);
      }
      advanceWord();
		});
  }

	function advanceWord() {
	  if ($scope.currentWord !== null) {
	    if ($scope.rating === 0) {
	      navigator.notification.alert("Rate pronunciation before advancing!", null, "No rating");
	      return;
	    }
	    $scope.currentPracticeSession.ratings.push({
        target: $scope.currentWord,
        rating: $scope.rating,
        time: Date.now(),
      });
	    $scope.rating = 0;
	    $scope.$broadcast("resetRating");
	  }

		$scope.currentWordIdx++;

	  if ($scope.count && $scope.currentWordIdx >= $scope.count) {
	    $scope.endWordPractice();
	  } else {
			var lookupIdx = $scope.currentWordIdx % $scope.wordOrder.length;
			$scope.currentWord = $scope.wordList[$scope.wordOrder[lookupIdx]];

	    // also select a random carrier phrase
      $scope.carrier_phrase = carrier_phrases[Math.floor(Math.random() * carrier_phrases.length)];
      $scope.smallFont = $scope.carrier_phrase.length >= 16;
      $scope.tinyFont = $scope.carrier_phrase.length >= 32;
	  }

	  if ($scope.pauseEvery && $scope.pauseEvery > 0 && $scope.currentWordIdx > 0) {
	    if ($scope.currentWordIdx % $scope.pauseEvery === 0) {
	      $scope.isFeedbacking = true;
	      if (navigator.notification) {
	        // will not trigger if serving
	        navigator.notification.confirm("Pausing for feedback",
	          function () {
	            $scope.$apply(function () {
								// Current word was not properly being updated.
								lookupIdx = $scope.currentWordIdx % $scope.wordOrder.length;
								$scope.currentWord = $scope.wordList[$scope.wordOrder[lookupIdx]];
	              $scope.isFeedbacking = false;
	            });
	          }, "",
	          ["Done"]);
	      } else {}
	    }
	  }
	}

	$scope.beginWordPractice = function () {
    $scope.currentWord = null;
		if ($scope.isPracticing) return;
    $scope.isPracticing = true;
    $scope.setupToolbar();

	  console.log("Beginning " + sessionDisplayString());

	  if (window.AudioPlugin === undefined) {
	    if (navigator.notification)
	      navigator.notification.alert("Can't start " + sessionDisplayString() + ": no audio", null, "Error");
	  }

	  ProfileService.getCurrentProfile().then(
	    function (res) {
	      if (res) {
	        beginPracticeForUser(res);
	        if ($scope.startPracticeCallback) $scope.startPracticeCallback();
	      } else {
	        if (navigator.notification)
	          navigator.notification.alert("Can't start " + sessionDisplayString() + " -- create a profile first", null, "No profile");
	      }
	    },
	    function (err) {
	      if (navigator.notification)
	        navigator.notification.alert("Can't start " + sessionDisplayString() + ": " + err, null, "Error");
	    }
	  );
	};

	$scope.endWordPractice = function () {
	  /* --------------------------------
	       visual reinforcement
  	   -------------------------------- */
	  if (!$scope.probe) {
	    // check if new highscores
	    var shouldUpdateHighscores = false;
	    if ($scope.block_score_highscore > $scope.highscores.block.score.total) {
	      shouldUpdateHighscores = true;
	      $scope.highscores.block.score.total = $scope.block_score_highscore;
	      $scope.highscores.block.score.date = Date.now();
	    }
	    if ($scope.block_golds_highscore > $scope.highscores.block.golds.total) {
	      shouldUpdateHighscores = true;
	      $scope.highscores.block.golds.total = $scope.block_golds_highscore;
	      $scope.highscores.block.golds.date = Date.now();
	    }

	    if ($scope.session_score > $scope.highscores.session.score.total) {
	      shouldUpdateHighscores = true;
	      $scope.highscores.session.score.total = $scope.session_score;
	      $scope.highscores.session.score.date = Date.now();
	    }
	    if ($scope.session_coins['gold'] > $scope.highscores.session.golds.total) {
	      shouldUpdateHighscores = true;
	      $scope.highscores.session.golds.total = $scope.session_coins['gold'];
	      $scope.highscores.session.golds.date = Date.now();
	    }

	    if (shouldUpdateHighscores) {
	      NotifyingService.notify("update-highscores", $scope.highscores);
	    }
	  }

	  // todo: send highscores

	  $scope.isPracticing = false;
	  $scope.rating = 0;
	  $scope.$broadcast("resetRating");
	  $scope.currentWord = null;
	  $scope.currentWordIdx = -1;
	  if (window.AudioPlugin !== undefined) {
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
	}

	$scope.reorderWords = function(randomize = true) {
	    $scope.wordOrder = [];
	    $scope.hasValidWordList = $scope.wordList.length > 0;
	    for (var i=0; i<$scope.wordList.length; ++i) {
        $scope.wordOrder.push(i);
			}
			if (randomize) {
				console.log("Randomizing!");
				scrambleArray($scope.wordOrder);
			}
	}

	$scope.reloadCSVData = function () {
	  if ($scope.type === 'Word'
	    // hackzorz: we know that we're doing a Word Quiz and not a Quest
	    // if requested CSV is data/Word_Probe
	    &&
	    $scope.csvs[0] !== "data/Word_Probe.csv") {
	    var tempWordList = [];

	    // map csvs to adaptive difficulty key names
	    // to cause as few side effects as possible

	    $scope.csvs.forEach(function (csv) {
	      var key = csv.replace('data/wp_', '').replace('.csv', '');
	      if ($scope.difficulty <= 3) {
	        tempWordList = tempWordList.concat(words[key][$scope.difficulty]);
	      } else {
	        // difficulty is 4 or 5
	        tempWordList = tempWordList
	          .concat(words[key][1])
	          .concat(words[key][2])
	          .concat(words[key][3]);
	      }
	    });

			$scope.wordList = tempWordList;
      $scope.reorderWords();
      return Promise.resolve();
		}
	  if ($scope.type === "Syllable" ||
	    $scope.probe) {
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

	    return Promise.all(loadTasks).then(function (res) {
	      $scope.reorderWords(!($scope.type === "Syllable" && $scope.probe));
	    });
	  }
	}

	$scope.$on('ratingChange', function (event, data) {
	  console.log('rating change! ' + data);
	  $scope.rating = data === undefined ? 0 : data;
	  if (!!$scope.rating) {
	    $scope.nextWord();
	  }
	  // keep running average of ratings
	  if (data) {
      handleRatingData($scope, data);
	  }
	});

	$scope.$on('stopPractice', function (event) {
	  if ($scope.isPracticing) {
	    $scope.endWordPractice();
	  }
	});

	$scope.$watch("csvs", function () {
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

	var unsubscribe = $rootScope.$on("$urlChangeStart", function (event, next) {
	  if (next === $scope.myURL) {
	    $scope.active = true;
	  } else {
      if ($scope.isRecording) {
        $scope.endWordPractice();
      }
      $scope.active = false;
	  }
	});

	$scope.$on("$destroy", function() {
	    unsubscribe();
	});
    }
);


// save here to avoid async loads
var carrier_phrases_bank = [
    ["___"],
    ["Say ___ to me"],
    [
	"He got detention because he said ___",
	"When he said ___, she got mad at him",
	"She passed me a note that said ___",
	"I put ___ at the top of my list",
	"He hoped she would know how to say ___",
	"I want to put ___ on the envelope",
	"I paid 10 cents to copy a sheet that said ___",
	"She hoped he would say ___",
	"I made a label that said ___",
	"You should take ___ off of the list",
	"It was funny when you said ___",
	"She put ___ on the ticket",
	"I walked past a sign that said ___",
	"My dad bought a book called ___",
	"I didn't expect to see a football team called ___",
	"I laughed when she said ___",
	"I built him a lemonade stand and called it ___",
	"He wasn't listening when she said ___",
	"I named my dog ___"
    ]
];


var words = {
    'consonantal_back': {
	'1': [
	    'rod',
	    'rot',
	    'romp',
	    'rub',
	    'rough',
	    'rust',
	    'road',
	    'rogue',
	    'roam',
	    'rope',
	    'rote',
	    'roast',
	    'rue',
	    'roof',
	    'room',
	    'root'
	],
	'2': [
	    'robin',
	    'rocket',
	    'rotten',
	    'rusty',
	    'running',
	    'rugby',
	    'roping',
	    'roaming',
	    'romance',
	    'rotate',
	    'rooting',
	    'ruby',
	    'rudest',
	    'roommate'
	],
	'3': [
	    'roll',
	    'rolled',
	    'rule',
	    'ruled',
	    'robber',
	    'Ronald',
	    'rubber',
	    'rubble',
	    'runner',
	    'roughly',
	    'parole',
	    'rolling',
	    'roadless',
	    'rower',
	    'rudely',
	    'rueful',
	    'ruling',
	    'roomful'
	]
    },
    'consonantal_front': {
	'1': [
	    'raid',
	    'rain',
	    'ray',
	    'rate',
	    'wreck',
	    'rest',
	    'reef',
	    'reek',
	    'reap',
	    'rib',
	    'wrist',
	    'rich',
	    'rhyme',
	    'rice',
	    'right',
	    'ripe',
	    'rise',
	    'write'
	],
	'2': [
	    'raisin',
	    'raven',
	    'racing',
	    'resting',
	    'remnant',
	    'ready',
	    'reading',
	    'reason',
	    'written',
	    'rigging',
	    'ribbon',
	    'riddance',
	    'rhyming',
	    'rising',
	    'rhino',
	    'arrive'
	],
	'3': [
	    'rail',
	    'railed',
	    'real',
	    'rear',
	    'rile',
	    'riled',
	    'rear',
	    'railing',
	    'rainfall',
	    'razor',
	    'restful',
	    'rental',
	    'reckless',
	    'regal',
	    'relay',
	    'really',
	    'richly',
	    'ripple',
	    'riddle',
	    'Riley',
	    'rival',
	    'writer',
	    'rifle'
	]
    },
    'vocalic_all': {
	'1': [
	    'dirt',
	    'hurt',
	    'burn',
	    'first',
	    'serve',
	    'heard'
	],
	'2': [
	    'birthday',
	    'dirty',
	    'turkey',
	    'person',
	    'certain',
	    'hurry'
	],
	'3': [
	    'curl',
	    'girl',
	    'learn',
	    'blur',
	    'worst',
	    'worth',
	    'turtle',
	    'curly',
	    'working',
	    'worried',
	    'worship',
	    'worthy'
	]
    },
    'vocalic_back': {
	'1': [
	    'chart',
	    'dart',
	    'heart',
	    'park',
	    'smart',
	    'bark',
	    'poor',
	    'score',
	    'shore',
	    'bored',
	    'cord',
	    'torn'
	],
	'2': [
	    'party',
	    'guitar',
	    'carton',
	    'hearty',
	    'harden',
	    'garden',
	    'adore',
	    'ashore',
	    'forty',
	    'tortoise',
	    'boring',
	    'boarded'
	],
	'3': [
	    'lard',
	    'large',
	    'lark',
	    'Carl',
	    'snarl',
	    'wore',
	    'swore',
	    'warm',
	    'warn',
	    'quart',
	    'wart',
	    'hardly',
	    'partly',
	    'heartless',
	    'alarm',
	    'darling',
	    'startle',
	    'galore',
	    'normal',
	    'cordless',
	    'Laura',
	    'warning',
	    'coral'
	]
    },
    'vocalic_front': {
	'1': [
	    'cared',
	    'fair',
	    'hair',
	    'spare',
	    'dare',
	    'mare',
	    'deer',
	    'fear',
	    'gear',
	    'hear',
	    'near',
	    'steer'
	],
	'2': [
	    'haircut',
	    'marry',
	    'barefoot',
	    'carry',
	    'appear',
	    'hearing',
	    'cheering',
	    'smearing',
	    'steering',
	    'nearest'
	],
	'3': [
	    'glare',
	    'lair',
	    'wear',
	    'square',
	    "we're",
	    'cleared',
	    'leer',
	    'wearing',
	    'barely',
	    'careful',
	    'Larry',
	    'weary',
	    'leering',
	    'sheerly',
	    'fearless',
	    'nearly',
	    'bleary'
	]
    }
};
