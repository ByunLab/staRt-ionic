/*globals console:false, angular:false, window:false, alert:false */
/*globals AudioPlugin:false */

'use strict';

( function(  )
{
	var words = angular.module( 'words' );

	words.controller('WordsController', function($scope, $timeout, $localForage, AutoService, FirebaseService, NotifyingService, ProfileService, StartUIState, $rootScope, $state, $cordovaDialogs)
	{
    console.log('WordsController here!');

		var lastChronoTime;
		var ticker = undefined;

		var logInterval = function() {
			if (ticker) {
				var nextChronoTime = Date.now();
				var duration = nextChronoTime - lastChronoTime;
				NotifyingService.notify("quest-tick", duration);
				lastChronoTime = nextChronoTime;
			}
		}

		var clearTimeLogger = function() {;
			if (ticker) {
				logInterval();
				clearInterval(ticker);
				ticker = undefined;
			}
		}

		$scope.practicing = false;
		$scope.configuring = false;
		$scope.order = "random";
		$scope.data = {
      categoriesRestricted: !!$rootScope.categoryRestrictions,
      categoryString: null,
			count: $rootScope.rootTrialCount || 50,
			csvs: [],
			navTitle: "Quest",
      selectedCategories: [],
      trialCountSelectorDisabled: !!$rootScope.rootTrialCount,
			type: null,
			waveHidden: false
		};
		if( $rootScope.rootWaveForced && $rootScope.rootWaveHidden ) {
			$scope.data.waveHidden = true;
		}


		$scope.categoryNames = [
			"Syllabic /r/",
			"Consonantal Front",
			"Consonantal Back",
			"Vocalic Front",
			"Vocalic Back"
		];

		$scope.syllableCategoryCSVs = [
			"data/sp_vocalic_all.csv",
			"data/sp_consonantal_front.csv",
			"data/sp_consonantal_back.csv",
			"data/sp_vocalic_front.csv",
			"data/sp_vocalic_back.csv"
		];

		$scope.wordCategoryCSVs = [
			"data/wp_vocalic_all.csv",
			"data/wp_consonantal_front.csv",
			"data/wp_consonantal_back.csv",
			"data/wp_vocalic_front.csv",
			"data/wp_vocalic_back.csv"
		];

		$scope.goBackToLanding = function() {
			console.log('back button clicked');
			$scope.practicing = false;
			$scope.configuring = false;
		}

		$scope.beginSyllableQuestConfiguration = function() {
			console.log("Begin syllable quest configuration");
			$scope.data.navTitle = "Syllable Quest";
			$scope.practicing = false;
			$scope.data.categoryString = null;
			$scope.data.selectedCategories = [];
			$scope.data.csvs = [];
			$scope.configuring = true;
			$scope.order = "random";
      $scope.data.type = "Syllable";
      if ($rootScope.categoryRestrictions) {
        for (var i = 0; i < $rootScope.categoryRestrictions.length; i++) {
          $scope.toggleRCategory($rootScope.categoryRestrictions[i], true);
        }
      }
		}

		$scope.beginWordQuestConfiguration = function() {
			console.log("Begin word quest configuration");
			$scope.data.navTitle = "Word Quest";
			$scope.practicing = false;
			$scope.data.categoryString = null;
			$scope.data.selectedCategories = [];
			$scope.data.csvs = [];
			$scope.configuring = true;
			$scope.order = "random";
      $scope.data.type = "Word";
      if ($rootScope.categoryRestrictions) {
        for (var i = 0; i < $rootScope.categoryRestrictions.length; i++) {
          $scope.toggleRCategory($rootScope.categoryRestrictions[i], true);
        }
      }
		}

		$scope.beginQuest = function() {
			console.log("Begin " + $scope.data.type + " quest");
			$scope.practicing = true;
			$scope.configuring = false;
			$scope.order = "random";
			$rootScope.finalSelectedCategories = $scope.data.selectedCategories;


			// TODO: Test that if we resume a formal session, then quit out, and then try to resume the formal session again by clicking quest, that
			// it does ~not~ actually resume the formal session.
			$rootScope.categoryRestrictions = false;


			// Start a timer to log the time spend in quest mode play
			NotifyingService.notify("quest-start");
			lastChronoTime = Date.now();
			ticker = setInterval(logInterval, 60000);
		};

		$scope.endQuestCallback = function() {
			$scope.practicing = false;
			$scope.configuring = false;
			$scope.data.csvs = [];
			$scope.data.navTitle = "Quest";
			clearTimeLogger();
		};

		$scope.toggleRCategory = function(wordCategoryIdx, force) {
      if (!force && !!$rootScope.categoryRestrictions) {
        $cordovaDialogs.alert("When resuming a session, you cannot change /r/ categories", "Session in progress");
        return;
      }

			var idx = $scope.data.selectedCategories.indexOf(wordCategoryIdx);
			if (idx === -1) {
				$scope.data.selectedCategories.push(wordCategoryIdx)
				$scope.data.selectedCategories.sort();
        AutoService.toggleCategoryRestriction(wordCategoryIdx, 1);
			} else {
        $scope.data.selectedCategories.splice(idx, 1);
        AutoService.toggleCategoryRestriction(wordCategoryIdx, 0);
			}

			var csvSource = $scope.data.type === "Word" ? $scope.wordCategoryCSVs : $scope.syllableCategoryCSVs;

			$scope.data.csvs = $scope.data.selectedCategories.map( function (x) { return csvSource[x]; } );
			var categories = $scope.data.selectedCategories.map( function (x) { return $scope.categoryNames[x]; } );
			$scope.data.categoryString = categories.join(", ");
		}

		$scope.updateCount = function() {
			console.log("count is now " + $scope.data.count);
		}

		$scope.$on('$destroy', function() {
			clearTimeLogger();
    });

		if ($rootScope.sessionToResume){
			$rootScope.categoryRestrictions = $rootScope.sessionToResume.categoryRestrictions;
			// previously, sessions were not saving categoryRestrictions. So we need to consider the posibility that there
			// are no categoryRestrictions remmebered for a quest, in which case we allow all categories. There's no better
			// fix I can think of, in any case this line of code should not be executed for any session that begins
			// after the update that includes this comment.
			if (!$rootScope.categoryRestrictions) {
				$rootScope.categoryRestrictions = [0, 1, 2, 3, 4];
			}
			if ($rootScope.sessionToResume.type === 'Word') {
				$scope.beginWordQuestConfiguration();
			} else {
				$scope.beginSyllableQuestConfiguration();
			}
			$scope.beginQuest();
		}

	});

} )(  );
