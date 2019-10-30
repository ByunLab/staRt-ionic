'use strict';

( function(  )
{
	var auto = angular.module( 'auto' );

	auto.controller('AutoController', function($scope, $timeout, $localForage, $cordovaDialogs, StartUIState, $rootScope, $state)
	{
		console.log('AutoController here!');

		$scope.practicing = false;
		$scope.csv = "";
		$scope.order = "random";
		$scope.count = 100;
		$scope.data = {
			navTitle: "Quiz"
		};

		$scope.beginSyllableProbe = function() {
			console.log("Begin syllable probe");
			$scope.data.navTitle = "Syllable Quiz";

			$cordovaDialogs.alert(
				(
					"In this task, you will see some syllables " +
					"containing /r/. Your clinician will model " +
					"each syllable for you. Your task is to " +
					"listen, watch, and repeat the clinician " +
					"while making your best /r/ sound."
				),
				"Syllable Quiz",
				"Okay"
			);

			$scope.practicing = true;
			$scope.csvs = [ "data/Syllable_Probe.csv" ];
			$scope.order = "sequential";
			$scope.type = "Syllable";
			$scope.count = 30;
		};

		$scope.beginWordProbe = function(count) {
			console.log("Begin word probe");
			$scope.data.navTitle = (count < 40 ? "Short" : "Long") + " Word Quiz";
			$scope.practicing = true;
			$scope.csvs = [ "data/Word_Probe.csv" ];
			$scope.order = "random";
			$scope.type = "Word";
			$scope.count = count || 50;
		};

		$scope.endProbeCallback = function() {
			$scope.practicing = false;
			$scope.csvs = null;
			$scope.data.navTitle = "Quiz";
		};

		if ($rootScope.sessionToResume){
			console.log("We're resuming a session in quiz");
			if ($rootScope.sessionToResume.type === 'Word') {
				$scope.beginWordProbe($rootScope.sessionToResume.count);
			} else {
				$scope.beginSyllableProbe();
			}
		}
	});

} )(  );