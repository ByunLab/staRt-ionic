var LONG_SESSION_MILLIS = 600000; // Ten minutes

var sessionStatsService = angular.module('sessionStatsService', [ 'firebaseService', 'notifyingService', 'profileService' ]);

sessionStatsService.factory('SessionStatsService', function($rootScope, $localForage, $http, FirebaseService, NotifyingService, ProfileService, $state)
{
	var lastSessionChronoTime;
	var profileSessionTimerId;
	var profileLongSessionTimerId;

	function ProfileStats(contextString) {
	    this.thisContextString = contextString; // user-defined string specifying the context of the current session
	    this.thisQuestTrialsCompleted = 0; // trials completed since the start of this session
	    this.thisQuestTrialsCorrect = 0; // score since the start of this session
	    this.thisQuestPercentTrialsCorrect = 0; // 100 * correct / completed
	    this.thisSessionTime = 0; // time elapsed since the start of this session
	    this.thisFreeplayTime = 0; // time elapsed in freeplay since the start of this session
	    this.thisQuestTime = 0; // time elapsed in quest since the start of this session
	    this.thisCurrentView = $state.current.url; // whichever view the user is currently looking at
	}

	var currentProfileStats = null;

	function _handleSuccessfulChanges(changes) {
		var profileChanges = changes.profileChanges;
		var statsChanges = changes.statsChanges;
		if (currentProfileStats) Object.assign(currentProfileStats, statsChanges);
		ProfileService.getCurrentProfile().then(function(profile) {
			_notifyChanges(profile, currentProfileStats, Object.assign({}, profileChanges, statsChanges));
		});
	}

	function _incrementProfileStat(profile, stat, increment, changes) {
		var newValue = (profile[stat] ? profile[stat] : 0) + increment;
		_updateProfileStat(stat, newValue, changes);
	}

	function _updateProfileStat(stat, value, changes) {
		changes[stat] = value;
	}

	function _notifyChanges(profile, currentProfileStats, changes) {
		NotifyingService.notify('profile-stats-updated', [profile, currentProfileStats, Object.keys(changes)]);
	}

	function _updateProfileForRecording(msg, session) {
		ProfileService.runTransactionForCurrentProfile(function(handle, profileDoc, t) {
			var profile = profileDoc.data();
			var profileChanges = {};
			var statsChanges = {};
			if (profile.firstSessionTimestamp === null) {
				_updateProfileStat('firstSessionTimestamp', session.startTimestamp, profileChanges);
			}
			_updateProfileStat('lastSessionTimestamp', session.startTimestamp, profileChanges);


			if (session.ratings.length) {
				// Remember, each rating is an array of length 2, eg ["target", <rating>]
				var score = session.ratings.map(function (x) { return Math.max(0, (x.rating - 1) / 2 );})
					.reduce(function (x, accum) { return x + accum; });

				// Increment and calculate stats for the profile
				_incrementProfileStat(profile, 'allTrialsCompleted', session.ratings.length, profileChanges);
				_incrementProfileStat(profile, 'allTrialsCorrect', score, profileChanges);
				_updateProfileStat('percentTrialsCorrect', (100 * profile.allTrialsCorrect / profile.allTrialsCompleted), profileChanges);

				// Increment and calculate stats for the session
				if (currentProfileStats) {
					_incrementProfileStat(currentProfileStats, 'thisQuestTrialsCompleted', session.ratings.length, statsChanges);
					_incrementProfileStat(currentProfileStats, 'thisQuestTrialsCorrect', score, statsChanges);
					_updateProfileStat(
						'thisQuestPercentTrialsCorrect',
						(100 * statsChanges['thisQuestTrialsCorrect']) / statsChanges['thisQuestTrialsCompleted'],
						statsChanges
					);
				}
			}

			if (session.ratings.length === session.count) {
				_incrementProfileStat(profile, 'nQuestsCompleted', 1, profileChanges);
				if (session.type.toLowerCase() === 'word' && session.probe) _incrementProfileStat(profile, 'nWordQuizComplete', 1, profileChanges);
				if (session.type.toLowerCase() === 'syllable' && session.probe) _incrementProfileStat(profile, 'nSyllableQuizComplete', 1, profileChanges);
			}

			t.update(handle, profileChanges);
			return {profileChanges: profileChanges, statsChanges: statsChanges};

		}).then(function(changes) {
			_handleSuccessfulChanges(changes);
		}).catch(function(e) {
			console.log(e);
		});
	}

	// Notifications

	/* --------------------------------
	   visual reinforcement
  	   -------------------------------- */
	// NotifyingService.subscribe('update-highscores', $rootScope, _updateHighscores);


	NotifyingService.subscribe('recording-completed', $rootScope, _updateProfileForRecording);

	var subscribeToProfileChange = function(eventString, processProfileChange) {
		NotifyingService.subscribe(eventString, $rootScope, function (msg) {
			ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
				var profileChanges = {};
				var statsChanges = {};
				var profile = doc.data();
				processProfileChange(profileChanges, statsChanges, profile);
				t.update(handle, profileChanges);
				return {profileChanges: profileChanges, statsChanges: statsChanges};
			}).then(function(changes) {
				_handleSuccessfulChanges(changes);
			}).catch(function(e) {
				console.log(e);
			});
		});
	}



	subscribeToProfileChange('quest-start', function(profileChanges, statsChanges, profile) {
		_incrementProfileStat(profile, 'nQuestsInitiated', 1, profileChanges);
	});

	subscribeToProfileChange('intro-completed', function(profileChanges, statsChanges, profile) {
		_incrementProfileStat(profile, 'nIntroComplete', 1, profileChanges);
	});

	subscribeToProfileChange('tutorial-completed', function(profileChanges, statsChanges, profile) {
		_incrementProfileStat(profile, 'nTutorialComplete', 1, profileChanges);
	});

	subscribeToProfileChange('conclusion-completed', function(profileChanges, statsChanges, profile) {
		_incrementProfileStat(profile, 'nFormalTreatmentComplete', 1, profileChanges);
	});

	subscribeToProfileChange('formal-testing-validated', function(profileChanges, statsChanges, profile) {
		_updateProfileStat('formalTester', true, profileChanges);
	});

	NotifyingService.subscribe('session-completed', $rootScope, function(msg, data) {
		ProfileService.runTransactionForCurrentProfile(function(handle, doc, t) {
			var profileChanges = {};
			var statsChanges = {};
			var profile = doc.data();
			if (data.practice === 'BF') {
				_incrementProfileStat(profile, 'nBiofeedbackSessionsCompleted', 1, profileChanges);
			} else {
				_incrementProfileStat(profile, 'nNonBiofeedbackSessionsCompleted', 1, profileChanges);
			}
			t.update(handle, profileChanges);
			return {profileChanges: profileChanges, statsChanges: statsChanges};
		}).then(function(changes) {
			_handleSuccessfulChanges(changes);
		}).catch(function(e) {
			console.log(e);
		});
	});

	NotifyingService.subscribe('will-set-current-profile-uuid', $rootScope, function(msg, profileUUID) {

		if (profileUUID) {
			ProfileService.getProfileWithUUID(profileUUID).then(function(profile) {
				if (profile) {
					if (profileLongSessionTimerId) clearTimeout(profileLongSessionTimerId);
					profileLongSessionTimerId = null;
					profileLongSessionTimerId = setTimeout(function() {
						var handle = ProfileService.getProfileTransactionHandle(profile);
						ProfileService.runTransaction(handle, function(handle, doc, t) {
							var profileChanges = {};
							var statsChanges = {};
							_incrementProfileStat(doc.data(), 'nLongSessionsCompleted', 1, profileChanges);
							t.update(handle, profileChanges);
							return {profileChanges: profileChanges, statsChanges: statsChanges};
						}).then(function(changes) {
							_handleSuccessfulChanges(changes);
						}).catch(function(e) {
							console.log(e);
						});
					}, LONG_SESSION_MILLIS);

					{
						var handle = ProfileService.getProfileTransactionHandle(profile);
						ProfileService.runTransaction(handle, function(handle, doc, t) {
							var profileChanges = {};
							var statsChanges = {};
							_updateProfileStat('lastLoginTime', Date.now(), profileChanges);
							t.update(handle, profileChanges);
							return {profileChanges: profileChanges, statsChanges: statsChanges};
						}).then(function(changes) {
							_handleSuccessfulChanges(changes);
						}).catch(function(e) {
							console.log(e);
						});
					}

					// eslint-disable-next-line no-extra-boolean-cast
					if (!!profile.brandNew) {
						var handle = ProfileService.getProfileTransactionHandle(profile);
						ProfileService.runTransaction(handle, function(handle, doc, t) {
							var profileChanges = {};
							var statsChanges = {};
							_updateProfileStat('brandNew', false, profileChanges);
							t.update(handle, profileChanges);
							return {profileChanges: profileChanges, statsChanges: statsChanges};
						}).then(function(changes) {
							_handleSuccessfulChanges(changes);
						}).catch(function(e) {
							console.log(e);
						});
					}
				}
			});
		}
	});


	NotifyingService.subscribe('$stateChangeSuccess', $rootScope, function() {
		console.log('successful state change!');
		ProfileService.getCurrentProfile().then(function (profile) {
			if (profile) {
				var profileChanges = {};
				var statsChanges = {};
				if (currentProfileStats) _updateProfileStat('thisCurrentView', $state.current.url, statsChanges);
				var changes = {profileChanges: profileChanges, statsChanges: statsChanges};
				_handleSuccessfulChanges(changes);
			}
		});
	});

	// ---------------------------------------------

	return {
		init: function() {
			console.log('Session stats tracking initialized');
		},

		getCurrentProfileStats: function() {
			return currentProfileStats;
		},

	  beginContext: function(contextString) {
		    currentProfileStats = new ProfileStats(contextString);
	  },

	  endContext: function() {
		    currentProfileStats = null;
	  }
	};
});
