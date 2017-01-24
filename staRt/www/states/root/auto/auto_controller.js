'use strict';

( function(  )
{
	var auto = angular.module( 'auto' );

	auto.controller('AutoController', function($scope, $timeout, $localForage, StartUIState, $rootScope, $state)
	{
		console.log('AutoController here!');

		$scope.practicing = false;
		$scope.csv = "";
		$scope.order = "random";
		$scope.count = 100;

		$scope.beginSyllableProbe = function() {
			console.log("Begin syllable probe");
			$scope.practicing = true;
			$scope.csv = "data/Syllable_Probe.csv";
			$scope.order = "sequential";
			$scope.count = 30;
		};

		$scope.beginWordProbe = function() {
			console.log("Begin word probe");
			$scope.practicing = true;
			$scope.csv = "data/Word_Probe.csv";
			$scope.order = "random";
			$scope.count = 50;
		};

		$scope.endProbeCallback = function() {
			$scope.practicing = false;
			$scope.csv = null;
		};
	});

} )(  );