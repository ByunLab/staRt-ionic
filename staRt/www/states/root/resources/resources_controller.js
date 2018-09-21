'use strict';

( function(  )
{
	var resources = angular.module( 'resources' );

	resources.controller('ResourcesController', function($scope, $timeout, $localForage, ProfileService, StartUIState, $rootScope, $state)
	{
		console.log('ResourcesController here!');

		$scope.data = {
			configuring: false,
      lpcOrder: 35,
      version: "",
      platform: "",
			navTitle: "SLP Resources"

    };
    cordova.getAppVersion.getVersionNumber().then(function (version) {
      $scope.data.version = `${version}`;
      $scope.data.platform = `${device.platform} ${device.version}`
    });

		$scope.$on("$ionicView.enter", function() {
			console.log('view content loaded!');
			if (window.AudioPlugin !== undefined)
			{
				console.log("Did enter resources view");
				ProfileService.getCurrentProfile().then( function(res) {
					console.log("Got current user profile");
					if (res && res.lpcOrder) {
						$scope.currentProfileName = res.name;
						$scope.data.lpcOrder = res.lpcOrder;
						AudioPlugin.setLPCOrder($scope.data.lpcOrder, $scope.logPluginLPCOrder);
					} else {
						$scope.resetPluginLPCOrder();
					}
				});
			};
		});

		$scope.configureLPC = function() {
			$scope.data.configuring = true;
		}

		$scope.logPluginLPCOrder = function(order)
		{
			console.log("Plugin LPC order is now: " + order);
		};

		$scope.resetPluginLPCOrder = function() {
			ProfileService.getCurrentProfile().then(function(res) {
				if (res) {
					$scope.data.lpcOrder = ProfileService.lookupDefaultFilterOrder(res);
				} else {
					$scope.data.lpcOrder = 35;
				}
				$scope.updatePluginLPCOrder();
			});
		};

		$scope.setLPCOrder = function(order)
		{
			$scope.data.lpcOrder = order;
		};

		$scope.updatePluginLPCOrder = function() {
			if (window.AudioPlugin !== undefined) {
        ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
          AudioPlugin.setLPCOrder($scope.data.lpcOrder, $scope.logPluginLPCOrder);
          t.update(handle, {lpcOrder: $scope.data.lpcOrder});
        });
			}
		};

	});

} )(  );
