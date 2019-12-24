/* eslint-disable no-undef */
/*globals console:false, angular:false, window:false, alert:false */

'use strict';

var UploadStatus = Object.freeze({
	INCOMPLETE: 'INCOMPLETE',
	ERROR: 'ERROR',
	COMPLETE: 'COMPLETE'
});

function dateFromString(str) {
	var a = str.split(/[^0-9]/);
	a = a.map(function (s) { return parseInt(s, 10); });
	return new Date(a[0], a[1]-1 || 0, a[2] || 1, a[3] || 0, a[4] || 0, a[5] || 0, a[6] || 0);
}

function compareRecordings(ra, rb) {
	var da = dateFromString(ra.date);
	var db = dateFromString(rb.date);
	if (da > db) return -1;
	if (da === db) return 0;
	return 1;
}

( function(  )
{
	var profiles = angular.module( 'profiles');

	profiles.controller('ProfilesController', function($scope, $timeout, $localForage, AutoService, FirebaseService, StartUIState, NotifyingService, ProfileService, UploadService, UtilitiesService, $rootScope, $state, $cordovaDialogs)
	{
		console.log('profiles controller here');

		// Nota Bene: A valid profile must have the following kv pairs:
		// "name" (string) the name of the profile
		// "uuid" (string) some string that is unique to each account
		// "age" (int) age in years
		// "gender" (string) Male or Female
		// "heightFeet" (int) feet portion of height
		// "heightInches" (int) inches portion of heightInches
		// "targetF3" (double, optional) the saved target F3 value
		// "stdevF3" (double, optional) the saved stdeviation F3 value
		// "targetLPCOrder" (int, optional) the saved target LPC order
		$rootScope.initParticipants = function() {
			ProfileService.getCurrentProfile().then(function(res) {
				if (res) {
					$scope.data.currentProfile = res;
					$scope.data.currentProfileUUID = res.uuid;

					if (res.lpcOrder) {
						$scope.data.lpcOrder = res.lpcOrder;
					} else {
					// #stj Default just 35? Call the lookup fx?
						$scope.data.lpcOrder = 0;
					}

					// #sjt: I'm always getting undefined at this point,
					// so I moved the Plugin fx to the $watchCollection
					if (window.AudioPlugin !== undefined) {
						console.log('hey AudioPlugin');
					} // if window.AudioPlugin
				} // if (res)
			}).then(function () {
				ProfileService.getAllProfiles().then( function(res) {
					$timeout(function() {$scope.data.profiles = res;});
				});
			});
		};

		var getRecordingTimeString = function (recording) {
			if (!recording) {
				return 'Unknown';
			}
			var totalTime = dateFromString(recording.endDate) - dateFromString(recording.date);
			return timeToMinutesSeconds(totalTime);
		};

		var timeToMinutesSeconds = function (totalTime) {
			return Math.floor(totalTime / 60000) + ' min, ' + Math.floor((totalTime % 60000) / 1000) + ' sec';
		};

		function init()
		{
			$scope.noCompletedSessions = false;
			$scope.displayingProgressModal = false;
			$scope.slideModalUp = false;
			$scope.isEditing = false;
			$scope.uploadCount = 0;
			$scope.displayName = FirebaseService.userName();

			// use: to change display state of card
			//values: recordings || progress || profile || settings || home || slp
			$scope.cardState = 'profile';
			$scope.slpView = false;

			$scope.data = {};
			$scope.data.uploadMessage = '';
			$scope.data.selectedProfileRecordings = [];
			$scope.data.sessionIsActive = AutoService.isSessionActive();
			$scope.data.lpcOrder = 0; //Card-Settings: Sets init val for adjust-lpc slider. Will be overwritten once currentProfile lpcOrder data arrives.


			NotifyingService.subscribe('session-did-begin', $scope, function() {
				$scope.data.sessionIsActive = true;
			});

			NotifyingService.subscribe('session-did-end', $scope, function() {
				$scope.data.sessionIsActive = false;
			});

			NotifyingService.subscribe('profile-stats-updated', $scope, function(msg, updateData) {
				var profile = updateData[0];
				var currentProfileStats = updateData[1];
				var updateKeys = updateData[2];
				updateKeys.forEach(function(key) {
					$scope.data.currentProfile[key] = profile[key];
				});
			});

			$rootScope.initParticipants();

			var handleEmptyRecordingHistory = function() {
				// Switches the scope variable so that on the progress dashboard something such as "No Recording History Data For User, Start Your First Quest"
				$scope.noCompletedSessions = true;
			};


			var isQuest = function (recordingSession) {return recordingSession.probe == 'quest';};

			var isQuiz = function(recordingSession) {return isQuest(recordingSession);};

			var setProgressDashboardData = function() {
				console.log("spD called");
				var dashboardDataPoints = [];
				var recordingSessionHistory = $scope.data.currentProfile.recordingSessionHistory;

				if (!recordingSessionHistory) {
					console.log('its empty');
					handleEmptyRecordingHistory();
					return;
				}

				console.log('recording session history: %o', recordingSessionHistory);
				var completedSessions = recordingSessionHistory.filter(function (recordingSession) {return UtilitiesService.recordingSessionIsComplete(recordingSession);});

				if (completedSessions.length == 0) {
					console.log('empty completed sessions');
					handleEmptyRecordingHistory();
					return;
				}

				$scope.noCompletedSessions = false;


				completedSessions.forEach(function (recordingSession) {
					//console.log(recordingSession);
					var dataPoint = {};

					var questOrQuizStr = isQuest(recordingSession) ? 'Quest' : 'Quiz';
					dataPoint['sessionDescription'] = recordingSession.type.trim() + ' ' + questOrQuizStr;
					dataPoint['date'] = new Date(recordingSession.endTimestamp); // TODO: Convert to datestring.UtilitiesService.formatDate(

					var timeSeconds = (recordingSession.endTimestamp - recordingSession.startTimestamp);
					dataPoint['durationString'] = timeToMinutesSeconds(timeSeconds);

					var CORRECT_RATING = 3;
					var SILVER_RATING = 2;
					var BRONZE_RATING = 1;

					var trialsCompleted = recordingSession.ratings.length;
					var trialsCorrect = recordingSession.ratings.filter(function(ratingData) {return ratingData.rating == CORRECT_RATING;}).length;
					var percentCorrect = Math.floor((trialsCorrect /trialsCompleted * 100) + .5);

					dataPoint['totalGold'] = trialsCorrect;
					dataPoint['totalSilver'] = 0;
					dataPoint['totalBronze'] = 0;
					dataPoint['totalScore'] = 0;

					recordingSession.ratings.forEach(function(ratingData) {
						var rating = ratingData.rating;
						if (rating === SILVER_RATING) {
							dataPoint['totalSilver'] += 1;
						}
						if (rating === BRONZE_RATING) {
							dataPoint['totalBronze'] += 1;
						}
						dataPoint['totalScore'] += rating;
					});



					dataPoint['trialsCompleted'] = trialsCompleted;
					dataPoint['possiblePoints'] = trialsCompleted * 3;
					dataPoint['trialsScoredCorrect'] = dataPoint['totalGold'];
					dataPoint['percentCorrect'] = percentCorrect;
					dataPoint['performanceString'] = trialsCorrect + '/' + trialsCompleted + ' - ' + percentCorrect + '%';


					dashboardDataPoints.push(dataPoint);
				});
				dashboardDataPoints.sort(function(ra, rb) {return rb.date - ra.date;});
				$timeout($scope.dashboardDataPoints = dashboardDataPoints);
			};

			// Triggered when user selects a different profile from the drawer + on app startupp.
			// Note this function normally fires twice. This is because when a user selects a profile, we immediately switch
			// the currentProfile immediately, and then later switch it again once we update from firebase.
			$scope.$watchCollection('data.currentProfile', function(data)
			{

				if (data)
				{
					$scope.data.currentProfileUUID = $scope.data.currentProfile.uuid;

					if ($scope.data.currentProfile.lpcOrder)
					{
						if ($scope.data.lpcOrder !== $scope.data.currentProfile.lpcOrder) {
							$scope.data.lpcOrder = $scope.data.currentProfile.lpcOrder;

							if (window.AudioPlugin !== undefined) {
								console.log('watchCollection calls AudioPlugin with:' + $scope.data.lpcOrder);
								AudioPlugin.setLPCOrder('' + $scope.data.currentProfile.lpcOrder, $scope.logPluginLPCOrder);
							} else {
								console.log('dude no audio');
							}
						}

					} else {
						$scope.data.lpcOrder = 35; // updates display
					}



					$scope.updateRecordingsList();
					setProgressDashboardData();
				}
			});


			$scope.$on( '$ionicView.enter', function( scopes, states ) {
				$scope.updateRecordingsList();
			});
		}


		// ===========================================================
		// PROFILE DRAWER
		// ===========================================================
		$scope.updateCurrentProfile = function (profile) {
		  ProfileService.setCurrentProfileUUID(profile.uuid).then(function () {
		    ProfileService.getCurrentProfile().then(function (res) {
		      if (res) {
		        $scope.data.currentProfile = res;
		      }

		      ProfileService.runTransactionForCurrentProfile(function (handle, profileDoc, t) {
		        if (!profileDoc.data().email) {
		          t.update(handle, {
		            email: FirebaseService.userEmail()
		          });
		        }
		        t.update(handle, {
		          lastLoginTimestamp: Date.now()
		        });
		      });
	      });
	    });
		};

		$scope.createProfile = function()
		{
			$scope.data.currentProfile = ProfileService.createProfile();
			$scope.setIsEditing(true);
			$scope.slpView = false;
			$scope.setCardState('profile');
		};

		$scope.displayProgressModal = function () {
			$scope.displayingProgressModal = true;
			$timeout(function() {$scope.setupLineGraph($scope.dashboardDataPoints); $scope.slideModalUp = true;}, 15); // 15ms timeout to have the slide up animation word;
		};

		$scope.hideProgressModal = function () {
			$timeout(function() {$scope.slideModalUp = false;});
			$timeout(function() {$scope.displayingProgressModal = false;}, 15);
		};

		// Note this function does not work if the lineCanvas is being hidden via ng-hide.
		$scope.setupLineGraph = function (dashboardDataPoints) {

			/*
			<td>{{dataPoint.sessionDescription}}</td>
			<td>{{dataPoint.performanceString}}</td>
			percentCorrect
			<td>{{dataPoint.durationString}}</td>
			<td>{{dataPoint.date | date:"fullDate"}}</td>
*/
			var labels = [];
			var data = [];
			var sessionNumber = dashboardDataPoints.length;
			dashboardDataPoints.forEach(function (dataPoint) {
				// The extra space before Session is there so the titles of the tooltips have a space.
				labels.push(dataPoint['sessionDescription'] + '\n' + ' Session #' + sessionNumber--);
				data.push(
					{
						date: dataPoint['date'],
						performanceString: dataPoint['performanceString'],
						totalGold: dataPoint['totalGold'],
						totalSilver: dataPoint['totalSilver'],
						totalBronze: dataPoint['totalBronze'],
						totalScore: dataPoint['totalScore'],
						possiblePoints: dataPoint['possiblePoints'],
						y: dataPoint['percentCorrect'],

					});
			});

			// dashboard data points are stored from most recent to least recent, so first we need to reverse the graph.
			labels.reverse();
			data.reverse();

			var MAX_SESSIONS_TO_SHOW = 40;

			if (data.length > MAX_SESSIONS_TO_SHOW) {
				data = data.slice(data.length - MAX_SESSIONS_TO_SHOW, data.length);
				labels = labels.slice(labels.length - MAX_SESSIONS_TO_SHOW, labels.length);
			}

			this.lineChart = new Chart(angular.element( document.querySelector('#lineCanvas')), {
				type: 'line',
				data: {
					labels: labels,
					datasets: [
						{
							label: $scope.data.currentProfile.name + '\'s Progress',
							data: data,
							borderColor: '#3e95cd',
							fill: false
						}
					],
				},

				options: {
					scales: {
						yAxes: [{
							scaleLabel: {
								display: true,
								labelString: 'Percent Trials Correct'
							},
							ticks: {
								max: 100,
								min: 0
							}
						}],
						xAxes: [{
							scaleLabel: {
								display: false,
								labelString: 'Session'
							}
						}]
					},
					tooltips: {
						enabled: true,
						mode: 'single',
						callbacks: {
							label: function(tooltipItems, data) {
								var multiStringText = [];
								var dataPoint = data.datasets[0].data[tooltipItems.index];
								multiStringText.push(dataPoint.performanceString + ' trials correct.');
								multiStringText.push('Total Gold: ' + dataPoint.totalGold);
								multiStringText.push('Total Silver: ' +  dataPoint.totalSilver);
								multiStringText.push('Total Bronze: ' + dataPoint.totalBronze);
								multiStringText.push('Total Points / Total Possible Points: ' + dataPoint.totalScore + '/'  + dataPoint.possiblePoints);
								multiStringText.push('Completed on ' + dataPoint.date);
								return multiStringText;
							}
						}
					}
				},

				plugins: [{
					beforeInit: function (chart) {
						chart.data.labels.forEach(function (e, i, a) {
							if (/\n/.test(e)) {
								a[i] = e.split(/\n/);
							}
						});
					}
				}],
			});
		};


		// ===========================================================
		// CARD STATE
		// vals: 'recordings' || 'progress' || 'profile' || 'settings' || 'slp'
		// ===========================================================
		$scope.setCardState = function(navState) {
			$scope.cardState = navState;
		};
		$scope.openSlpView = function() {
			$scope.slpView = true;
			$scope.cardState = 'slp';
		};
		$scope.closeSlpView = function() {
			$scope.slpView = false;
			$scope.cardState = 'profile';
		};


		// ===========================================================
		// CARD: PROFILES
		// ===========================================================
		$scope.setIsEditing = function(isEditing) {
			$scope.isEditing = isEditing; // bool. state var.
			$scope.editing = isEditing ? 'editing' : ''; // ng-class var
		};

		$scope.cancelEdit = function()
		{
			ProfileService.getCurrentProfile().then( function(res) {
				$scope.data.currentProfile = res;
			});
			$scope.setIsEditing(false);
		};

		$scope.saveProfile = function()
		{
			if ($scope.data.currentProfile.name !== undefined &&
				$scope.data.currentProfile.age !== undefined &&
				$scope.data.currentProfile.heightFeet !== undefined &&
				$scope.data.currentProfile.heightInches !== undefined &&
				$scope.data.currentProfile.gender !== undefined)
			{
				ProfileService.saveProfile($scope.data.currentProfile).then(function()
				{
					ProfileService.getAllProfiles().then(function(res)
					{
						$scope.data.profiles = res;
						$scope.setIsEditing(false);
						ProfileService.setCurrentProfileUUID($scope.data.currentProfile.uuid);
					});
				});
			} else {
				alert('Profile is missing some data');
			}
		};

		function clamp(x, lo, hi)
		{
			return (x < lo ? lo : (x > hi ? hi : x));
		}

		$scope.deleteProfile = function(profile)
		{
			function doDelete()
			{
				var profileIdx = $scope.data.profiles.indexOf(profile);
				profileIdx = clamp(profileIdx, 0, $scope.data.profiles.length - 2);
				ProfileService.deleteProfile(profile).then(function()
				{
					ProfileService.getAllProfiles().then(function(res)
					{
						$scope.data.profiles = res;
						if(!res.length)
						{
							$scope.data.currentProfile = null;
							$scope.updateCurrentProfile(null);
						}
						else
						{
							$scope.data.currentProfile = $scope.data.profiles[profileIdx];
							$scope.updateCurrentProfile($scope.data.currentProfile);
						}
					});
				});
			}

			// Check if we're in the browser or in iOS
			if(navigator.notification)
			{
				navigator.notification.confirm('Are you sure you want to delete ' + profile.name + '?' , function(i)
				{
					if(i == 1)
					{
						doDelete();
					}
				}, 'Delete All', ['OK', 'Cancel']);
			}
			else
			{
				doDelete();
			}
		};

		$scope.optInFormalTesting = function() {
			ProfileService.getCurrentProfile().then(function (profile) {
				if (profile) AutoService.promptForFormalParticipation(profile);
			});
		};

		$scope.startSession = function() {
			AutoService.startSession();
		};

		$scope.stopSession = function() {
			AutoService.stopSession();
		};

		// ===========================================================
		// CARD: RECORDINGS
		// ===========================================================

		var sessionIDForRecording = function (recording) {
			return recording.Metadata.split('/').pop().substr(0, 36);
		};

		$scope.updateRecordingsList = function()
		{

			$scope.data.selectedProfileRecordings = [];
			ProfileService.getRecordingsForProfile($scope.data.currentProfile, function(recordings) {
				var statusesToFetch = [];
				recordings.sort(compareRecordings); // Prefer the recordings sorted from present to past
				recordings.forEach(function(recording) {
					statusesToFetch.push(
						UploadService.getUploadStatusForRecordingSessionID(sessionIDForRecording(recording))
							.then(function(status) {
								recording.uploaded = !!status.uploaded;
								if (recording.endDate && recording.endDate.length > 0) {
									recording.totalTimeString = getRecordingTimeString(recording);
								}
							})
					);
				});
				Promise.all(statusesToFetch).then(function() {
					$timeout(function() {$scope.data.currentProfileRecordings = recordings;});
				});
			});
		};

		$scope.recordingClicked = function (member) {
			var index = $scope.data.selectedProfileRecordings.indexOf(member);
			if(index > -1) {
				$scope.data.selectedProfileRecordings.splice(index, 1);
				member.selected = false;
			} else {
				$scope.data.selectedProfileRecordings.push(member);
				member.selected = true;
			}
		};

		$scope.resumeRecording = function (member) {
			var sessionid = sessionIDForRecording(member);
			ProfileService.getCurrentProfile().then(function(res) {
				ProfileService.resumeNormalRecordingSession(res, sessionid);
			});
		};

		$scope.deleteSelectedRecordings = function() {
			if (window.AudioPlugin) {
				if ($scope.data.selectedProfileRecordings.length) {
					var deletionPromises = [];
					$scope.data.selectedProfileRecordings.forEach(function (recording) {
						$scope.data.selectedProfileRecording = null;
						deletionPromises.push(new Promise(function (resolve, reject) {
							window.AudioPlugin.deleteRecording(recording, function() {
								resolve();
							}, function(err) {
								console.log(err);
								reject(err);
							});
						}));
					});

					Promise.all(deletionPromises).then(function (res) {
						$scope.updateRecordingsList();
					});
				}
			}
		};

		$scope.uploadSelectedRecordings = function() {

			$scope.data.selectedProfileRecordings.forEach(function (recording) {

				$scope.data.uploadMessage = 'Uploading...';

				function progress() {
					// do something
				}

				function win() {
					$cordovaDialogs.alert(
						'Session uploaded successfully',
						'Upload Complete',
						'Okay'
					);
					$scope.uploadCount -= 1;
					if ($scope.uploadCount === 0) $scope.data.uploadMessage = '';
					$scope.updateRecordingsList();
				}

				function fail(err) {
					$cordovaDialogs.alert(
						'Session upload failed',
						'Upload Error',
						'Okay'
					);
					$scope.uploadCount -= 1;
					if ($scope.uploadCount === 0) $scope.data.uploadMessage = '';
				}

				if (window.AudioPlugin) {
					if (recording) {
						var session = {
							id: null
						};
						session.files = {
							Metadata: recording.Metadata,
							Audio: recording.Audio,
							LPC: recording.LPC,
							Ratings: recording.Metadata.replace('-meta.csv', '-ratings.json')
						};
						session.id = session.files.Metadata.split('/').pop().substr(0, 36);
						$scope.uploadCount += 1;
						UploadService.uploadPracticeSessionFiles(session.files, session.id, progress, win, fail);
					}
				}
			});
		};


		// ===========================================================
		// CARD: PROGRESS
		// ===========================================================





		// ===========================================================
		// CARD: SETTINGS
		// ===========================================================
		// #sjt: fx copied & pasted from Resources controller

		$scope.logPluginLPCOrder = function(order) {
			console.log('Plugin LPC order is now: ' + order);
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

		$scope.setLPCOrder = function(order) {
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




		// ===========================================================
		// CARD: SLP Functions
		// ===========================================================

		$scope.deleteAllProfiles = function()
		{
			function doDelete()
			{
				ProfileService.deleteAllProfiles().then(function () {
					$scope.data.currentProfile = null;
					$scope.data.profiles = [];
					$scope.updateCurrentProfile(null);
				});
			}
			if(navigator.notification)
			{
				navigator.notification.confirm('Are you sure you want to delete all profiles?', function(i)
				{
					if(i == 1)
					{
						doDelete();
					}
				}, 'Delete All', ['OK', 'Cancel']);
			}
			else
			{
				doDelete();
			}
		};

		$scope.logOut = function() {
			firebase.auth().signOut().then(function (thing) {
				$localForage.clear();
				ProfileService.reloadProfilesInterfaceState();
			}, function (err) {
				console.trace(err);
			});
		};



		// -----------------------------------------------------------
		// qs for #sjt

		var selected = [];  // #sjt  I don't know which block this belongs to... any ideas?  SORRY!



		init();

	});

} )(  );
