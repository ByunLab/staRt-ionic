'use strict';

( function(  )
{
	var resources = angular.module( 'resources' );

	resources.controller('ResourcesController', function($scope, $timeout, $localForage, ProfileService, StartUIState, $rootScope, $state, FirebaseService)
	{
		//console.log('ResourcesController here!');

		$scope.data = {
      version: "",
      platform: "",
			navTitle: "SLP Resources"
    };

		ProfileService.getCurrentProfile().then(function(profile) {
	    $scope.data.participant_name = profile.name;
		});

		if (window.AudioPlugin !== undefined) {
	     cordova.getAppVersion.getVersionNumber().then(function (version) {
	       $scope.data.version = `${version}`;
	       $scope.data.platform = `${device.platform} ${device.version}`
	     });
		};

		$scope.$on("$ionicView.enter", function() {
			console.log('resources content loaded!');
		});

	});

} )(  );
