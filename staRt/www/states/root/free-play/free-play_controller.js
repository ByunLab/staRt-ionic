'use strict';

( function(  )
{
	var freePlay = angular.module( 'freePlay' );

	freePlay.controller('FreePlayController', function($scope, $timeout, $localForage, StartUIState, NotifyingService, $rootScope, $state, ProfileService, FirebaseService)
	{
		console.log('FreePlayController here!');

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

		ProfileService.getCurrentProfile().then(function (profile) {
			if (profile) {
				$scope.data.participant_name = profile.name;
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
