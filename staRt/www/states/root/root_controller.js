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
		$scope.state.loggedIn = !!firebase.auth().currentUser;

		$rootScope.safelySwitchStates = function(destination) {
			if (navigator.notification && !!$rootScope.isRecording) {
				navigator.notification.confirm('Are you sure you would like to leave this session?',
					function (index) {
						if (index === 1 ) {
							$state.go('root.' + destination);
						}}, 'Quit Session?',
					['Leave Session', 'Stay']);
			}
			else {
				$state.go('root.' + destination);
			}
		};

		// Initialize UI
		StartUIState.getLastActiveIndex($localForage).then(function(data)
		{
			$scope.startUIState = data;
			firebase.auth().onAuthStateChanged(function (user) {
				if (user) {
					console.log('Logged in as ' + user);
				}

				var wasLoggedIn = $scope.state.loggedIn;
				$scope.state.loggedIn == !!user;

				if (!user) {
					if (wasLoggedIn) $state.go('root', {}, { reload: true });
				} else {
					if (!wasLoggedIn) {
						$state.go('root.profiles', {}, { reload: true });
					} else {
						// I have no idea why the navbar hides itself after login. I promise to
						// investigate this an fix it later—removing this extremely gross hack—
						// later when other more important things are done
						console.log('Gross (but hopefully harmless) hack still at play');
						$ionicNavBarDelegate.title('Profiles');
						$ionicNavBarDelegate.showBar(true);
					}
				}
			});

			if (firebase.auth().currentUser === null) {
				console.log('Prompting for login');
				FirebaseService.startUi();
			}
		});

		//console.log($scope.state);

		$scope.selectIndex = function(index)
		{
			StartUIState.setLastActiveIndex($localForage, index);
			$scope.content = StartUIState.content[index];
		};

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

} )(  );
