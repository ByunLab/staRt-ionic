'use strict';

( function(  )
{
	var resources = angular.module( 'resources' );

	resources.controller('ResourcesController', function($scope, $timeout, $localForage, ProfileService, StartUIState, $rootScope, $state)
	{
		console.log('ResourcesController here!');

		$scope.logPluginLPCOrder = function(order)
		{
			console.log("Plugin LPC order is now: " + order);
		}

		$scope.setLPCOrder = function(order)
		{
			$scope.lpcOrder = order;
		};

		$scope.updatePluginLPCOrder = function() {
			if (window.AudioPlugin !== undefined) {
				AudioPlugin.setLPCOrder($scope.lpcOrder, $scope.logPluginLPCOrder);
				ProfileService.getCurrentProfile().then(function (res) {
					if (res) {
						res.lpcOrder = $scope.lpcOrder;
						ProfileService.saveProfile(res);
					}
				});
			}
		}

		$scope.$on('$ionicView.afterEnter', function(event)
		{
			console.log('view content loaded!');
			if (window.AudioPlugin !== undefined)
			{
				ProfileService.getCurrentProfile().then( function(res) {
					if (res && res.lpcOrder) {
						$scope.currentProfileName = res.name;
						$scope.lpcOrder = res.lpcOrder;
						AudioPlugin.setLPCOrder($scope.lpcOrder, $scope.logPluginLPCOrder);
					} else {
						AudioPlugin.getLPCOrder($scope.setLPCOrder);
					}
				});
			};
		});

	});

} )(  );
