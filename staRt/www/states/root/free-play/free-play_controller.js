'use strict';

( function(  )
{
	var freePlay = angular.module( 'freePlay' );

	freePlay.controller('FreePlayController', function($scope, $timeout, $localForage, StartUIState, NotifyingService, $rootScope, $state, ProfileService, FirebaseService)
	{
		console.log('FreePlayController here!');

		var SESSION_FREEPLAY_TIME = 300000; // Five minutes
		var SPEEDY_SESSION_FREEPLAY_TIME = 5000; // Five seconds.

		$scope.data = {
			navTitle: 'Free Play',
			waveHidden: false,
			researchSession: false
		};

		if( $rootScope.rootWaveForced && $rootScope.rootWaveHidden) {
			$scope.data.waveHidden = true;
			$scope.data.researchSession= true;
		} else if( $rootScope.rootWaveForced && !$rootScope.rootWaveHidden) {
			$scope.data.waveHidden = false;
			$scope.data.researchSession= true;
		} else if( !$rootScope.rootWaveForced && !$rootScope.rootWaveHidden) {
			$scope.data.waveHidden = false;
			$scope.data.researchSession= false;
		}

		$scope.freeplayTimeout = null;
		$scope.announceTimeUp = null;
		$scope.didAnnounceTimeUp = false;

		$scope.$on('$destroy', function() {
			if (!!$scope.freeplayTimeout) {
				$scope.announceTimeUp();
				clearTimeout($scope.freeplayTimeout);
			}
		});


		ProfileService.getCurrentProfile().then(function (profile) {
			if (profile) {
				$scope.data.participant_name = profile.name;
				var freeplayTime = profile.name === 'Speedy' ? SPEEDY_SESSION_FREEPLAY_TIME : SESSION_FREEPLAY_TIME;
				$scope.announceTimeUp = function() {
					if (!$scope.didAnnounceTimeUp) {
						$scope.didAnnounceTimeUp = true;
						NotifyingService.notify('finished-free-play');
					}
				}
				$scope.freeplayTimeout = setTimeout($scope.announceTimeUp, freeplayTime);

				if (profile.nIntroComplete >= 1) {
					$scope.data.session_number = profile.nBiofeedbackSessionsCompleted + profile.nNonBiofeedbackSessionsCompleted + 1;
				}
			} else {
				if (navigator.notification) {
					navigator.notification.alert(
						'Can\'t start free play -- create/select a profile first', function() {$state.go('root.profiles');}, 'No profile');
				}

			}
		});
	});

} )(  );
