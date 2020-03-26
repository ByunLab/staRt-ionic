/* eslint-disable no-extra-boolean-cast */
var autoService = angular.module('autoService', []);

var INTRO_FREEPLAY_TIME = 300000; // Five minutes
var SESSION_FREEPLAY_TIME = 300000; // Five minutes
var SPEEDY_INTRO_FREEPLAY_TIME = 1000; // One second. Use this if the profile is named 'Speedy' for testing
var SPEEDY_SESSION_FREEPLAY_TIME = 1000; // One second. Use this if the profile is named 'Speedy' for testing
var TOTAL_SESSION_COUNT = 16;
var TRIALS_PER_SESSION = 100;
var SPEEDY_TRIALS_PER_SESSION = 5;

function _hasIntersection(arrayA, arrayB) {
	return arrayA.filter(function (a) {
		return arrayB.indexOf(a) !== -1;
	}).length > 0;
}

function _scramble(array) {
	for (var i = 0; i < array.length; i++) {
		var swappI = Math.floor(Math.random() * array.length);
		var temp = array[i];
		array[i] = array[swappI];
		array[swappI] = temp;
	}
}

// -----------------------------------------------------------------------
// Object to hold state of user's progress thru the protocol

var AutoState = function (profile, currentStats, onShow, initialState) {
	this.onShow = onShow;
	this.currentStep = null;
	this.restrictions = {};
	this.contextString = 'abstact';
	this.state = Object.assign({}, initialState ? initialState : {});
};

AutoState.prototype = {
	currentMessage: function (profile, currentStats, changeList) {
		if (this.currentStep) {
			if (typeof (this.currentStep.dialog) === 'function') {
				return this.currentStep.dialog(profile, currentStats, changeList);
			} else {
				return this.currentStep.dialog;
			}
		}

		return null;
	},
	getState: function() {
		return Object.assign({}, this.state);
	},
	processUpdate: function (profile, currentStats, changeList) {

		var oldStep = this.currentStep;
		if (!this.currentStep) this.currentStep = this.firstStep;
		if (!this.currentStep) return;

		while (!!this.currentStep.next) {
			var nextStep = this.currentStep.next(profile, currentStats, changeList);
			if (!nextStep) break;
			this.currentStep = nextStep;
		}

		if (oldStep !== this.currentStep) {
			if (this.onShow) this.onShow(this.currentMessage(profile, currentStats), !this.currentStep.next);
		}
	}
};


// -----------------------------------------------------------------------
// Introductory auto guide, which helps the user get familiar with the app

/* NOTE: AutoState.call takes 'this' (IntroAuto state) and essentially initialises it with the AutoState prototype.
	 In this case, .call populates a new AutoState object (IntroAuto), with the data provided to IntroAuto constructor fn. The next assignment sets the IntroAuto.prototype as a descendant of AutoState.prototype -- it will inherit all methods from the AutoState.prototype.
*/
var IntroAuto = function (profile, currentStats, onShow, initialState) {

	AutoState.call(this, profile, currentStats, onShow, initialState);

	var steps = {};
	steps.welcome = {
		next: function (profile, currentStats, changeList) {
			if (profile.nWordQuizComplete >= 1) return steps.syllable;
			return null;
		},
		dialog: {
			text: 'Welcome to the staRt app! You will be taken to the Quiz section, please choose Long Word Quiz once there.',
			title: 'Welcome',
			navto: 'root.auto'
		}
	};

	steps.syllable = {
		next: function (profile, currentStats, changeList) {
			if (profile.nSyllableQuizComplete >= 1) return steps.tutorial;
			return null;
		},
		dialog: {
			text: 'Now please complete our Syllable Quiz measure.',
			title: 'Syllable Quiz',
			navto: 'root.auto'
		}
	};

	steps.tutorial = {
		next: function (profile, currentStats, changeList) {
			if (profile.nTutorialComplete >= 1) return steps.freePlay;
			return null;
		},
		dialog: {
			text: 'You will be taken to the Tutorial.',
			title: 'Tutorial',
			navto: 'root.tutorial.p01s1'
		}
	};

	steps.freePlay = {
		next: function (profile, currentStats, changeList) {
			if (currentStats.finishedFreePlay) return steps.complete;
			return null;
		},
		dialog: {
			text: 'You will be taken to Free Play to try out the wave for approximately five minutes.',
			title: 'Free Play',
			navto: 'root.free-play'
		}
	};

	steps.complete = {
		dialog: {
			text: 'You are done with your first session! Please come back soon to complete your first Quest.',
			title: 'All done'
		}
	};

	this.firstStep = steps.welcome;
	this.contextString = 'introduction';
};

// IntroAuto.prototype inherits all methods from from AutoState.prototype
IntroAuto.prototype = Object.create(AutoState.prototype);

IntroAuto.shouldBegin = function (profile) {
	return profile.nIntroComplete === 0 && profile.formalTester;
};


// -----------------------------------------------------------------------
// One of the sixteen guided runs through the app
var SessionAuto = function (profile, currentStats, onShow, initialState) {
	AutoState.call(this, profile, currentStats, onShow, initialState);

	if (initialState && initialState.categoryRestrictions) {
		this.restrictions.categoryRestrictions = Object.assign(initialState.categoryRestrictions);
	}

	this.state = Object.assign({
		hasAcceptedSessionPrompt: false,
		wantsToDoItLater: false,
		hasAcceptedBiofeedbackPrompt: false,
		hasAcceptedQuestPrompt: false,
		didFinishSession: false,
	}, this.state);

	var steps = {};
	var ordinals = ['Zeroeth', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth'];
	// start sessionIndex at 1 for better human readability
	var sessionIndex = profile.nBiofeedbackSessionsCompleted + profile.nNonBiofeedbackSessionsCompleted + 1;

	// Re-use the biofeedback constraint, if you have one saved
	if (!this.state.biofeedback) {
		var biofeedback = [];
		for (var i = 0; i < (TOTAL_SESSION_COUNT / 2); i++) {
			if (i >= profile.nBiofeedbackSessionsCompleted) {
				biofeedback.push('BF');
			}
			if (i >= profile.nNonBiofeedbackSessionsCompleted) {
				biofeedback.push('TRAD');
			}
		}
		_scramble(biofeedback);
		var biofeedbackTradDifference = profile.nBiofeedbackSessionCompleted - profile.nNonBiofeedbackSessionCompleted
		if (biofeedbackTradDifference >= 3) {
			this.state.biofeedback = 'TRAD';
		} else if (biofeedbackTradDifference <= -3) {
			this.state.biofeedback = 'BF';
		} else {
			this.state.biofeedback = biofeedback.pop();
		}
	}

	if (this.state.biofeedback === 'BF') {
		this.restrictions.rootWaveForced = true;
		this.restrictions.rootWaveHidden = false;
	} else {
		this.restrictions.rootWaveForced = true;
		this.restrictions.rootWaveHidden = true;
	}
	this.restrictions.rootTrialCount = profile.name === 'Speedy'
		? SPEEDY_TRIALS_PER_SESSION
		: TRIALS_PER_SESSION;

	steps.confirm = {
		next: (function () {
			if (this.state.hasAcceptedSessionPrompt) return steps.biofeedbackPrompt;
			if (this.state.wantsToDoItLater) return steps.laterPrompt;
			return null;
		}).bind(this),
		dialog: (function (profile, currentStats, changeList) {
			return {
				title: ordinals[sessionIndex] + ' Session',
				text: 'Welcome back. Would you like to complete your ' + ordinals[sessionIndex].toLowerCase() + ' session now?',
				buttons: ['Later', 'Okay'],
				callback: (function (index) {
					if (index === 0 || index === 1) {
						this.state.wantsToDoItLater = true;
					}
					if (index === 2) {
						this.state.hasAcceptedSessionPrompt = true;
					}
					this.processUpdate(profile, currentStats, []);
				}).bind(this)
			};
		}).bind(this)
	};

	steps.laterPrompt = {
		dialog: {
			title: 'See You Later',
			text: 'You\'ll be prompted to begin your session the next time you pick this profile.'
		}
	};

	steps.biofeedbackPrompt = {
		next: (function () {
			if (this.state.hasAcceptedBiofeedbackPrompt) return steps.freePlay;
			return null;
		}).bind(this),
		dialog: (function (profile, currentStats, changeList) {
			var text = this.state.biofeedback === 'BF' ?
				'Please complete this session with biofeedback.' :
				'Please complete this session using traditional (no-biofeedback) practice.';
			return {
				text: text,
				title: 'Session Type',
				button: 'Okay',
				callback: (function () {
					this.state.hasAcceptedBiofeedbackPrompt = true;
					this.processUpdate(profile, currentStats, []);
				}).bind(this)
			};
		}).bind(this)
	};

	steps.freePlay = {
		next: function (profile, currentStats) {
			if (currentStats.finishedFreePlay) return steps.quest;
			return null;
		},
		dialog: {
			text: 'You will be taken to Free Play to practice in any way you like for five minutes.',
			title: 'Free Play',
			button: 'Okay',
			navto: 'root.free-play'
		}
	};

	steps.quest = {
		next: (function (profile, currentStats) {
			if (this.state.hasAcceptedQuestPrompt && currentStats.thisCurrentView === 'words') return steps.whichQuest;
			return null;
		}).bind(this),
		dialog: (function (profile, currentStats, changeList) {
			return {
				text: 'You are ready to get started! You will be taken to the quest page to begin.',
				title: 'Quest Time',
				navto: 'root.words',
				callback: (function () {
					this.state.hasAcceptedQuestPrompt = true;
					this.processUpdate(profile, currentStats, []);
				}).bind(this)
			};
		}).bind(this)
	};

	var goal = profile.name === 'Speedy' ? SPEEDY_TRIALS_PER_SESSION : TRIALS_PER_SESSION;
	steps.whichQuest = {
		next: (function (profile, currentStats) {
			if (currentStats.thisQuestTrialsCompleted >= goal) {
				this.state.didFinishSession = true;
				return steps.allDone;
			}
			return null;
		}).bind(this),
		dialog: (function (profile, currentStats, changeList) {
			var text = "Please choose Syllable Quest or Word Quest based on your client's current stimulability level, and choose /r/ variants to target based on your clinical judgment. Please keep these settings constant across all Quest sessions for a participant in our research study. Each Quest should be 100 trials long, but you can break your Quest into shorter sessions if you need to. Remember that the clinician should provide a model only at the start of each block of 10 trials.";
			return {
				text: text,
				title: 'Quest'
			};
		}).bind(this)
	};

	steps.allDone = {
		dialog: function (profile, currentStats) {
			var text;
			if (sessionIndex === (TOTAL_SESSION_COUNT)) {
				var percentCorrectStr = profile.percentTrialsCorrect.toString().split('.')[0];
				text = 'Congratulations, you finished your sixteen quests! Your total accuracy was approximately ' + percentCorrectStr +
          '% correct. Your accuracy in your final session was approximately ' + currentStats.thisQuestPercentTrialsCorrect + '% correct.' +
          ' To complete your tasks as a formal pilot tester, please schedule one more visit to complete the Word Quiz and the Syllable Quiz ' +
          'at the post-treatment time point.';
			} else {
				var percentCorrectStr = currentStats.thisQuestPercentTrialsCorrect.toString().split('.')[0];
				text = 'Congratulations, you have completed this quest! You scored approximately ' +
        percentCorrectStr + '% correct. ' +
          'Please come back soon to complete your next session.';
			}
			return {
				text: text,
				title: 'All done'
			};
		}
	};

	this.firstStep = steps.confirm;
	this.contextString = this.state.biofeedback + '-' + sessionIndex;
};
SessionAuto.prototype = Object.create(AutoState.prototype);
SessionAuto.shouldBegin = function (profile) {
	var introGood = profile.nIntroComplete >= 1;
	var formalGood = !!profile.formalTester;
	var bfSessions = profile.nBiofeedbackSessionsCompleted;
	var tradSessions = profile.nNonBiofeedbackSessionsCompleted;
	var sessionsGood = (bfSessions + tradSessions) < TOTAL_SESSION_COUNT;
	var treatmentComplete = !!profile.nFormalTreatmentComplete;
	return introGood && formalGood && sessionsGood && !treatmentComplete;
};

// The concluding guided auto run, which measures syllable and word performance at the end of the series
var ConclusionAuto = function (profile, currentStats, onShow, initialState) {
	AutoState.call(this, profile, currentStats, onShow, initialState);

	this.state = Object.assign({
		hasAcceptedSessionPrompt: false,
		wantsToDoItLater: false,
		didFinishSession: false,
	}, this.state);

	var initialWordQuizCount = profile.nWordQuizComplete;
	var initialSyllableQuizCount = profile.nSyllableQuizComplete;

	var steps = {};

	steps.confirm = {
		next: (function () {
			if (this.state.hasAcceptedSessionPrompt) return steps.wordQuizPrompt;
			if (this.state.wantsToDoItLater) return steps.laterPrompt;
			return null;
		}).bind(this),
		dialog: (function (profile, currentStats, changeList) {
			return {
				title: 'Post-Treatment Assessment',
				text: 'Welcome back. Would you like to complete your post-treatment assessment now?',
				buttons: ['Later', 'Okay'],
				callback: (function (index) {
					if (index === 0 || index === 1) {
						this.state.wantsToDoItLater = true;
					}
					if (index === 2) {
						this.state.hasAcceptedSessionPrompt = true;
					}
					this.processUpdate(profile, currentStats, []);
				}).bind(this)
			};
		}).bind(this)
	};

	steps.laterPrompt = {
		dialog: {
			title: 'See You Later',
			text: 'You\'ll be prompted to complete your post-treatment assessment the next time you pick this profile.'
		}
	};

	steps.wordQuizPrompt = {
		next: function (profile, currentStats) {
			if (initialWordQuizCount < profile.nWordQuizComplete) return steps.syllableQuizPrompt;
			return null;
		},
		dialog: {
			text: 'You will be taken to the Quiz section to complete the final Long Word Quiz measure.',
			title: 'Word Quiz',
			button: 'Okay',
			navto: 'root.auto'
		}
	};

	steps.syllableQuizPrompt = {
		next: (function (profile, currentStats) {
			if (initialSyllableQuizCount < profile.nSyllableQuizComplete) {
				this.state.didFinishSession = true;
				return steps.conclusionPrompt;
			}
			return null;
		}).bind(this),
		dialog: {
			text: 'Now please complete the final Syllable Quiz measure.',
			title: 'Syllable Quiz',
			button: 'Okay',
			navto: 'root.auto'
		}
	};

	steps.conclusionPrompt = {
		dialog: function (profile, currentStats) {
			var text = 'Thank you again for supporting our research! ' +
        'You are free to keep using the staRt app, but your time as a formal pilot tester is complete.';
			return {
				text: text,
				title: 'All done'
			};
		}
	};

	this.firstStep = steps.confirm;
	this.contextString = 'assessment';
};
ConclusionAuto.prototype = Object.create(AutoState.prototype);
ConclusionAuto.shouldBegin = function (profile) {
	var biofeedbackCompleteGood = profile.nBiofeedbackSessionsCompleted >= (TOTAL_SESSION_COUNT / 2);
	var nonBiofeedbackCompleteGood = profile.nNonBiofeedbackSessionsCompleted >= (TOTAL_SESSION_COUNT / 2);
	var formalGood = !!profile.formalTester;
	var treatmentComplete = !!profile.nFormalTreatmentComplete;
	return biofeedbackCompleteGood && nonBiofeedbackCompleteGood && formalGood && !treatmentComplete;
};

// =============================================================================
autoService.factory('AutoService', function ($rootScope, $ionicPlatform, NotifyingService, ProfileService, SessionStatsService, $cordovaDialogs, $state) {
	var currentAuto = null;
	var currentRestrictions = null;

	function _setCurrentAuto(auto) {
		if (auto !== currentAuto) {
			if (currentRestrictions) {
				for (var restriction in currentRestrictions) {
					if (currentRestrictions.hasOwnProperty(restriction)) {
						delete $rootScope[restriction];
					}
				}
			}

			if (currentAuto) {
				SessionStatsService.endContext();
				NotifyingService.notify('session-did-end', currentAuto);
			}
		}

		currentAuto = auto;
		currentRestrictions = {};

		if (currentAuto) {
			if (currentAuto.restrictions) {
				for (var restriction in currentAuto.restrictions) {
					if (currentAuto.restrictions.hasOwnProperty(restriction)) {
						currentRestrictions[restriction] = currentAuto.restrictions[restriction];
						$rootScope[restriction] = currentAuto.restrictions[restriction];
					}
				}
			}

			SessionStatsService.beginContext(currentAuto.contextString);
			NotifyingService.notify('session-did-begin', currentAuto);
		}
	}

	function _checkForAuto(profile, currentStats, changeList, initialState) {
		if (!currentAuto) {

			// Intro session
			if (!currentAuto && IntroAuto.shouldBegin(profile)) {
				_setCurrentAuto(new IntroAuto(profile, currentStats, function (message, completed) {
					if (message) _showMessage(message);
					if (completed) {
						NotifyingService.notify('intro-completed', profile);
						_setCurrentAuto(null);
					}
				}, initialState));
			}

			// Subsequent sessions
			if (!currentAuto && SessionAuto.shouldBegin(profile, currentStats)) {
				_setCurrentAuto(new SessionAuto(profile, currentStats, function (message, completed) {
					if (message) _showMessage(message);
					if (completed) {
						if (currentAuto.state.didFinishSession) {
							NotifyingService.notify('session-completed', {
								profile: profile,
								practice: currentAuto.state.biofeedback
							});
						}
						_setCurrentAuto(null);
					}
				}, initialState));
			}

			// Conclusion session
			if (!currentAuto && ConclusionAuto.shouldBegin(profile, currentStats)) {
				_setCurrentAuto(new ConclusionAuto(profile, currentStats, function (message, completed) {
					if (message) _showMessage(message);
					if (completed) {
						if (currentAuto.state.didFinishSession) {
							NotifyingService.notify('conclusion-completed', {
								profile: profile
							});
						}
						_setCurrentAuto(null);
					}
				}, initialState));
			}

			if (currentAuto) currentAuto.processUpdate(profile, currentStats, changeList);
		}
	}

	function _showMessage(message) {
		if (message.buttons) {
			$cordovaDialogs.confirm(
				message.text,
				message.title,
				message.buttons
			).then(function (idx) {
				if (message.callback) message.callback(idx);
				if (message.navto) $state.go(message.navto);
			});
		} else {
			$cordovaDialogs.alert(
				message.text,
				message.title,
				message.button || 'Okay'
			).then(function () {
				if (message.callback) message.callback();
				if (message.navto) $state.go(message.navto);
			});
		}
	}

	function _presentFormalPasswordChallenge(profile) {
		var weblink = 'https://wp.nyu.edu/byunlab/projects/start/participate/';
		$cordovaDialogs.prompt(
			'To initiate formal testing mode, please enter the code that you received after completion of the consent process.',
			'Research Participation',
			['Cancel', 'Confirm']
		).then(function (result) {
			if (result.buttonIndex <= 1) {
				$cordovaDialogs.alert(
					'If you decide later that you want to be a formal tester, you can opt in from the profiles page.',
					'Research Participation'
				);
			} else {
				if (result.input1 !== 'biofeedback') {
					$cordovaDialogs.confirm(
						'Please see our website for information on research participation and to receive a code to begin testing.',
						'Invalid Password',
						['Okay', 'Visit Website']
					).then(function (idx) {
						if (idx === 2) window.open(weblink, '_blank', 'location=yes');
					});
				} else {
					NotifyingService.notify('formal-testing-validated', profile);
				}
			}
		});
	}

	function _promptForFormalParticipation(profile) {

		if (profile.formalTester) {
			$cordovaDialogs.alert(
				profile.name + ' is already participating as a formal pilot tester.',
				'Research Participation'
			);

			return;
		}

		var weblink = 'https://wp.nyu.edu/byunlab/projects/start/participate/';
		var = "Do you want to participate as a formal tester in our research study? Please note that we must obtain informed consent from the client and client's family before formal participation is possible. Please see our website or email nyuchildspeech@gmail.com for more information."
		$cordovaDialogs.confirm(
			text,
			'Research Participation',
			['No', 'Visit Website', 'Yes']
		).then(function (idx) {
			if (idx === 0 || idx === 1) {
				$cordovaDialogs.alert(
					'If you decide later that you want to be a formal tester, you can opt in from the profiles page.',
					'Research Participation'
				);
			} else if (idx === 2) {
				window.open(weblink, '_blank', 'location=yes');
			} else if (idx === 3) {
				_presentFormalPasswordChallenge(profile);
			}
		});
	}

	function _doPauseSession() {
		var state = currentAuto.getState();
		ProfileService.getCurrentProfile().then(function (profile) {
			if (profile) {
				ProfileService.runTransactionForCurrentProfile(function (handle, doc, t) {
					t.update(handle, {
						inProcessSessionState: state
					});
				});
			}
		});
		_setCurrentAuto(null);
	}

	function _doStartSession() {
		console.log('Starting session');
		ProfileService.getCurrentProfile().then(function (profile) {
			if (profile) {
				var currentStats = SessionStatsService.getCurrentProfileStats() || {};
				var changeList = ['resume'];

				if (profile.inProcessSession) {
					$cordovaDialogs.confirm(
						'It looks like you were in the middle of a session. Would you like to resume or start over?',
						'Resume Session',
						['Resume', 'Start over']
					).then(function(index) {
						if (index === 1) {
							_checkForAuto(profile, currentStats, changeList, profile.inProcessSessionState);
						} else {
							ProfileService.clearInProgressSessionForCurrentProfile().then(function() {
								_checkForAuto(profile, currentStats, changeList, {});
							});
						}
					});
				} else {
					ProfileService.clearInProgressSessionForCurrentProfile().then(function() {
						_checkForAuto(profile, currentStats, changeList, {});
					});
				}
			}
		});
	}

	function _doStopSession() {
		console.log('Stopping session');
		ProfileService.getCurrentProfile().then(function (profile) {
			if (profile) {
				var state = currentAuto.getState();
				ProfileService.runTransactionForCurrentProfile(function (handle, doc, t) {
					t.update(handle, {
						inProcessSessionState: null
					});
				});
			}
		});
		_setCurrentAuto(null);
	}

	NotifyingService.subscribe('will-set-current-profile-uuid', $rootScope, function (msg, profileUUID) {
		_setCurrentAuto(null);
		if (!profileUUID) return;
		ProfileService.getProfileWithUUID(profileUUID).then(function (profile) {
			if (profile && profile.formalTester && (profile.nFormalTreatmentComplete === 0)) {
				$cordovaDialogs.alert(
					'Welcome back! Please press the purple "start session" button to begin your next session.',
					'Introduction',
					'Okay'
				).then(function () {
					// no-op
				});
			}
		});
	});

	NotifyingService.subscribe('profile-stats-updated', $rootScope, function (msg, data) {
		var profile = data[0];
		var currentStats = data[1];
		var changeList = data[2];

		if (currentAuto) {
			currentAuto.processUpdate(profile, currentStats, changeList);
		} else if (changeList.indexOf('brandNew') !== -1) {
			_promptForFormalParticipation(profile);
		} else if (changeList.indexOf('formalTester') !== -1) {

			$cordovaDialogs.alert(
				'Welcome to the formal testing program! Please press the purple "start session" button at any time to begin.',
				'Introduction',
				'Okay'
			).then(function () {
				// no-op
			});

			// _checkForAuto(profile, SessionStatsService.getCurrentProfileStats(), changeList);
		}
	});

	return {
		init: function () {
			console.log('Auto Service initialized');
		},

		isSessionActive: function () {
			return currentAuto !== null;
		},

		pauseSession: function() {
			if (this.isSessionActive) _doPauseSession();
		},

		promptForFormalParticipation: function (profile) {
			_promptForFormalParticipation(profile);
		},

		startSession: function() {
			_doStartSession();
		},

		stopSession: function() {
			_doStopSession();
		},

		toggleCategoryRestriction: function (index, state) {
			if (currentAuto) {
				if (!currentAuto.state.categoryRestrictions) {
					currentAuto.state.categoryRestrictions = [];
				}

				if (state && currentAuto.state.categoryRestrictions.indexOf(index) === -1) {
					currentAuto.state.categoryRestrictions.push(index);
				} else if (!state && currentAuto.state.categoryRestrictions.indexOf(index) !== -1) {
					var pos = currentAuto.state.categoryRestrictions.indexOf(index);
					currentAuto.state.categoryRestrictions.splice(pos, 1);
				}
			}
		},
	};
});
