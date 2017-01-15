/*globals console:false, angular:false, window:false, alert:false */
/*globals AudioPlugin:false */

'use strict';

( function(  )
{
	var words = angular.module( 'words' );

	words.controller('WordsController', function($scope, $timeout, $localForage, ProfileService, StartUIState, $rootScope, $state)
	{
		console.log('WordsController here!');

		$scope.$on("$ionicView.enter", function() {
			$scope.$broadcast("enter");
		});

		$scope.$on("$ionicView.afterEnter", function() {
			$scope.$broadcast("afterEnter");
		});

		$scope.$on("$ionicView.beforeLeave", function() {
			$scope.$broadcast("beforeLeave");
		});
	});

} )(  );
