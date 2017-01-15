'use strict';

( function(  )
{
	var auto = angular.module( 'auto' );

	auto.controller('AutoController', function($scope, $timeout, $localForage, StartUIState, $rootScope, $state)
	{
		console.log('AutoController here!');

		$scope.practicing = false;
		$scope.csv = "";

		$scope.beginSyllableProbe = function() {
			$scope.practicing = true;
		};

		$scope.beginWordProbe = function() {
			$scope.practicing = true;
		};
	});

} )(  );