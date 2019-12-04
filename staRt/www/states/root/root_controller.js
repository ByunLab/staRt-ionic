'use strict';

( function(  )
{
	var root = angular.module( 'root' );

	root.controller('RootController', function($scope, $timeout, $localForage, $ionicNavBarDelegate, AutoService, FirebaseService, StartUIState, ProfileService, SessionStatsService, UploadService, $rootScope, $state)
	{
		//console.log('RootController here!');
		if (window.cordovaSQLiteDriver !== undefined) {
			$localForage._localforage.defineDriver(window.cordovaSQLiteDriver).then(function() {
				return $localForage._localforage.setDriver([
					// Try setting cordovaSQLiteDriver if available,
					window.cordovaSQLiteDriver._driver,
					// otherwise use one of the default localForage drivers as a fallback.
					// This should allow you to transparently do your tests in a browser
					$localForage._localforage.INDEXEDDB,
					$localForage._localforage.WEBSQL,
					$localForage._localforage.LOCALSTORAGE
				]);
			});
		}

		$scope.state = $state;
		$rootScope.loggedIn = !!firebase.auth().currentUser;

		$rootScope.safelySwitchStates = function(destination) {
			if (navigator.notification && !!$rootScope.isRecording) {
				navigator.notification.confirm('Are you sure you would like to leave this session?',
					function (index) {
						if (index === 1 ) {
							$rootScope.endSessionAndGo('root.' + destination);
						}
					}, 'Quit Session?',
					['Leave Session', 'Stay']);
			}
			else {
				$state.go('root.' + destination);
			}
		};


		// Please note that this function is notoriously buggy on firebase's end. https://github.com/firebase/quickstart-android/issues/80
		if (!$rootScope.firebaseCallbackSet) {
			$rootScope.firebaseCallbackSet = true;
			firebase.auth().onAuthStateChanged(function (user) {
				var wasLoggedIn = $rootScope.loggedIn;
				$rootScope.loggedIn = !!user;
				if (user) {
					$rootScope.needToPromptLogin = false;
					if (!wasLoggedIn) {
						$state.go('root.profiles', {}, {reload: false});
					}
				} else {
					if (!$rootScope.needToPromptLogin) {
						$rootScope.needToPromptLogin = true;
						$state.go('root', {}, {reload: true});
					}
				}
			});
		}


		$scope.$on('$ionicView.afterEnter', function () {
			if ($rootScope.needToPromptLogin) {
				setTimeout(function() {
					FirebaseService.startUi();
				}, 100);
			}
		});


		$scope.tabData = StartUIState.tabData;

		// -----------------------------------------------
		// Start Session Tracking & Protocol Services
		AutoService.init();
		SessionStatsService.init();
		/*
			NOTE: (not sure if this is correct, but here's what I think is happening -hc)

			AutoService communicates the status of a protocol-session with the variables, $rootScope.rootWaveHidden and $rootScope.rootWaveForced

			$rootScope.rootWaveHidden
			This will be FALSE if the user is in a BF auto-sesh.
			It will be TRUE if the user is in a noBF auto-sesh.
			It will be UNDEFINED if the user is not in an auto-sesh.

			$rootScope.rootWaveForced
			This will always be TRUE the user is in auto-sesh.
			It will be UNDEFINED if the user is not in an auto-sesh.

			#sjt:  ???
		*/

	});
})();
