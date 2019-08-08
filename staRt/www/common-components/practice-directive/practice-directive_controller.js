// bug: no rating transmitted on Wave Hidden (Trial number 10/11)
// todo: new layout to accomodate for extended words

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

function initialPracticeSession(startTimestamp, type, probe, count) {
  return {
    id: guid(),
    ratings: [],
    probe: probe,
    type: type,
    startTimestamp: startTimestamp,
    endTimestamp: null,
    count: count,
  };
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
			      function($scope, $timeout, $localForage, AutoService, NotifyingService, FirebaseService, ProfileService, SessionStatsService, StartUIState, UploadService, $rootScope, $state, $http, $cordovaDialogs, ToolbarService, AdaptDiff, CSVhelp, Score)
    {
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
  $scope.scores = undefined;
	$scope.uploadStatus = {
	    isUploading: false,
	    uploadProgress: 0
	}

	$scope.currentWordIdx = -1;
	$scope.currentPracticeSession = null;

  // TODO: get aDiff record from fb profile ???
  // if no aDiff in fb profile, then start at 0
  $scope.difficulty = 1;


  // TOOLBAR ----------------------------------------------------
  // TO BE IMPLEMENTED IN THE FUTURE / NOT CURRENTLY IN USE

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

	//var carrier_phrases = carrier_phrases_bank[0];
  $scope.carrier_phrases = AdaptDiff.phrases[0];

	var increase_difficulty_threshold = 0.8;
	var decrease_difficulty_threshold = 0.5;

	function calculate_difficulty_performance(total, count){
	    return total / count;
  };


  function handleRatingData($scope, data) {

    if (!$scope.probe) { // visual reinforcement
      // see 'helpers/qtScoring'
      // updates all score and milestone counters
      Score.questRating(data, $scope.scores, $scope.highscores, $scope.currentWordIdx);
      //console.log($scope.scores);
    }

    // end of block calculations
    if ($scope.currentWordIdx % 10 == 0 &&
      $scope.currentWordIdx != 0) {

      // recalculate difficulty
      // NEED TO RE-LINK THIS
      var performance = calculate_difficulty_performance(
        $scope.scores.block_score,
        10 // working in blocks of ten only
      );
      // console.log('performance: ' + performance);

      if (performance >= increase_difficulty_threshold &&
        $scope.difficulty < 5) {
        $scope.difficulty++;
        revise_difficulty();
        return $scope.reloadCSVData();
      } else if (performance <= decrease_difficulty_threshold &&
        $scope.difficulty > 1) {
        $scope.difficulty--;
        revise_difficulty();
        return $scope.reloadCSVData();
      }
      // implied else
      // keep difficulty the same
    }


    return Promise.resolve();
  }

	function revise_difficulty() {
	  if ($scope.type == "Syllable" || $scope.probe) {
	    // don't modify carrier phrase if doing a Syllable Quest or Word Quiz
	    return;
	  }

	  switch ($scope.difficulty) {
	    case 1:
	    case 2:
	    case 3:
	      //carrier_phrases = carrier_phrases_bank[0];
        $scope.carrier_phrases = AdaptDiff.phrases[0];
	      break;
	    case 4:
	      //carrier_phrases = carrier_phrases_bank[1];
        $scope.carrier_phrases = AdaptDiff.phrases[1];
	      break;
	    case 5:
	      //carrier_phrases = carrier_phrases_bank[2];
        $scope.carrier_phrases = AdaptDiff.phrases[2];
	      break;
	    default:
	  }
	}


  // ----------------------------------------------

	/* --------------------------------
	   visual reinforcement
  	   -------------------------------- */
	if(!$scope.probe){
	    // #hc Check that this still works when resume a sesh
	    // $scope.sandholes = new Array(Math.ceil($scope.count / 10));
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
        //TODO: $scope.highscores = user.highscores;
      } else {
        $scope.highscores = Score.initFakeHighScores; //#hc
      }
      $scope.scores = Score.initScores();
      $scope.sandholes = new Array(Math.ceil($scope.count / 10)); //#hc
      console.log($scope.scores);
      console.log($scope.highscores);
    }

    var sessionPrepTask = Promise.resolve();

    if (user.inProcessSession) {
      $scope.currentPracticeSession = Object.assign({}, user.inProcessSession);

      var previousRatings = $scope.currentPracticeSession.ratings;
      $scope.currentWordIdx = 0;
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
    console.log($scope.currentPracticeSession);

    // Even if this is a continuation of a previous session, it still needs
    // a unique recording ID
    $scope.currentPracticeSession.id = guid();

    sessionPrepTask.then(function () {
      if (window.AudioPlugin !== undefined) {
        AudioPlugin.startRecording(user, sessionDisplayString(), recordingDidStart, recordingDidFail);
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
	    if ((lookupIdx === 0) && ($scope.order === "random")) {
	      scrambleArray($scope.wordOrder);
	    }
	    $scope.currentWord = $scope.wordList[$scope.wordOrder[lookupIdx]];

	    // also select a random carrier phrase
      // $scope.carrier_phrase = carrier_phrases[Math.floor(Math.random() * carrier_phrases.length)];
      $scope.carrier_phrase = $scope.carrier_phrases[Math.floor(Math.random() * $scope.carrier_phrases.length)];
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
          console.log(res);
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
	  if (!$scope.probe) {

      // #hc: Check if milestone.shouldUpdateFirebase =true
      // #hc: What quest SeshStats should be updated (SLP dashboard)

	    // if (shouldUpdateHighscores) {
	    //   NotifyingService.notify("update-highscores", $scope.highscores);
	    // }
	  }

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
	    var nextWordList = parseCSV(wordListData).slice(1).map(function(w) {
		return w[0];
	    });
	    $scope.wordList = $scope.wordList.concat(nextWordList);
	}

	$scope.reorderWords = function() {
	    $scope.wordOrder = [];
	    $scope.hasValidWordList = $scope.wordList.length > 0;
	    for (var i=0; i<$scope.wordList.length; ++i) {
        $scope.wordOrder.push(i);
      }
      scrambleArray($scope.wordOrder);
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
	        // tempWordList = tempWordList.concat(words[key][$scope.difficulty]);
          tempWordList = tempWordList.concat(AdaptDiff.words[key][$scope.difficulty]);
	      } else {
	        // difficulty is 4 or 5
	        tempWordList = tempWordList
	          .concat(AdaptDiff.words[key][1])
	          .concat(AdaptDiff.words[key][2])
	          .concat(AdaptDiff.words[key][3]);
	      }
	    });

	    $scope.wordList = tempWordList;

      $scope.reorderWords();
      return Promise.resolve();
	  }
	  if ($scope.type === "Syllable" || $scope.probe) {
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
	          //console.log("Appending word list");
	          //console.log($scope.wordList);
	        })
	      );
	    });
	    return Promise.all(loadTasks).then(function (res) {
	      $scope.reorderWords();
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

	if ($scope.csvs) {
    $scope.reloadCSVData().then(function () {
      if ($scope.hasValidWordList && !$scope.isPracticing && $scope.beginOnLoad) {
        $scope.beginWordPractice();
      }
    });
  }

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

/*
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
*/

/*
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
*/
