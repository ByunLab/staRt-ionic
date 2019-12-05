/*global milestones:writable */

var practiceDirective = angular.module( 'practiceDirective' );
practiceDirective.factory('QuestScore', function QuestScoreFactory() {

	/* ---------------------------------------
  Purpose: Handles Quest scoring, milestone, and badging logic
  Ref: See https://github.com/ByunLab/staRt-ionic/wiki/Quest-Scoring
	*/

	// used if an existing fb profile does not already have
	// a highscoreQuest object
	function NewQuestHighScores() { // for new accts
		return  {
			mgibHx: [ {score: 0, date: Date.now()} ],
			hsibHx: [ {score: 0, date: Date.now()} ],
			mgiqHx: [ {score: 0, date: Date.now()} ],
			hsiqHx: [ {score: 0, date: Date.now()} ],
			streakHx: [ {score: 0, date: Date.now()} ],
			perfectBlockHx: [ {score: 0, date: Date.now()} ],
		};
	}

	// handles state for active profile's highscores and milestone thresholds
	function Milestones() {
		return  {
			highscores: {
				mgib: 0,
				hsib: 0,
				mgiq: 0,
				hsiq: 0,
				streak: 0,
				perfectBlock: 0,
			},
			update: {
				mgibHx: {},
				hsibHx: {},
				mgiqHx: {},
				hsiqHx: {},
				streakHx: {},
				perfectBlockHx: {},
			},
			shouldUpdateFirebase: false
		};
	}

	// SCORES OBJECT: handles state for active Quest score counters
	/*
		scores.endOfBlock:
			True: Set by conditionals w/in questRating().
				  Checked on every trial.
			False: Set by ...
				   Checked on every trial.
	*/
	function QuestScores() {
		// sessionID is added by the controller
		return {
			block_display_score: 0, //user val
			block_coins: [[]],
			block_goldCount: 0,
			block_score: 0, // lab val or difficulty score
			session_score: 0,
			display_score: 0,
			session_coins: {
				gold: 0,
				silver: 0,
				bronze: 0
			},
			streak: 0,
			perfectBlock: 0,
			performance: 0, // req'd for difficulty score
			changeDifficulty: 0, // req'd for difficulty score. #hc TODO: #480
			endOfBlock: false, // req'd by prepEndOfBlock()
			totalTrials: 0, // // req'd by prepEndOfBlock()
		};
	}

	//handles state for Badges and Milestone Dialog Sequences
	function Badges() {
		// incrDiff: false
		return {
			onARoll: {
				flag: false,
				trials: 0,
				visible: false
			},
			newRecord: {
				flag: false,
				trials: 0,
				visible: false
			},
			endBlockSum: { // holds info about each 'achievement' milestone type
				mgib: {
					flag: false,
					title: 'Most Gold in Block!',
					count: 0,
					imgUrl: ''
				},
				hsib: {
					flag: false,
					title: 'High Score in Block!',
					count: 0,
					imgUrl: ''
				},
				streak: {
					flag: false,
					title: 'Gold Streak!',
					count: 0,
					imgUrl: ''
				},
				perfectBlock: {
					flag: false,
					title: 'Perfect Block!',
					count: 0,
					imgUrl: ''
				}
			},
			cardsBlockEnd: { // holds info about each 'achievement' milestone type
				mgib: {
					template: 'achievement',
					title: 'Most Gold in Block!',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				hsib: {
					template: 'achievement',
					title: 'High Score in Block!',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				streak: {
					template: 'achievement',
					title: 'Gold Streak!',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				perfectBlock: {
					template: 'achievement',
					title: 'Perfect Block!',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				incrDiff: {
					template: 'note',
					title: 'Increasing Difficulty!',
					bodyText: '',
					imgUrl: '',
					btnText: 'Next',
				},
				feedback: {
					template: 'note',
					title: 'Checkpoint',
					subtitle: '',
					imgUrl: '',
					bodyText: 'Please provide qualitative feedback on the participant\'s performance over the last ten trials.',
					btnText: 'See Scores',
				},
				progSum: {
					template: 'progSum',
					title: 'Progress Summary',
					btnText: 'Resume Quest',
				},
			},
			cardsQuestEnd: {
				mgiq: {
					flag: false,
					template: 'achievement',
					title: 'Most Gold in Quest!',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				hsiq: {
					flag: false,
					template: 'achievement',
					title: 'High Score in Quest!',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				endSum: {
					flag: true,
					template: 'endSum',
					title: 'Quest Complete!',
					// gold: scores.session_coins.gold,
					// silver: scores.session_coins.silver,
					// bronze: scores.session_coins.bronze,
					btnText: 'See Final Score',
				},
				finalScore: {
					flag: true,
					template: 'finalScore',
					title: 'Quest Complete!',
					subtitle: '',
					count: 0,
					btnText: 'Close',
				},
			},
			cardFlags: [], // flagged when a blockEnd milestone is achieved
			cardSeq: [],
			card: {}, // Holds the content to be displayed in the html template from badges.cardSeq[badges.cardNumber]
			endQuestSum: {},
			cardNumber: -1,
			qtDialog: {
				isVisible: false, // is the Dialog Box Visible
				isBlockEnd: false, // used for Block-End seq
				isFinal: false // used for Quest-End sequence
			},
			qtDialogTemplate: {
				achievement: false, // used by end-of-block 'New Record' sequence
				note: false, // used by Qualitative Feedback Reminder note
				progSum: false, // used by "Progress Summary" card
				endSum: false, // used by 'Quest Complete Summary'
				finalScore: false, // used by 'Final Score'
			}
		};
	}


	// ==============================================
	// INITS ------------------------
	var initCoinCounter = function(count, questCoins){
		var numStack = count/10;
		for(var i=0; i<numStack; i++) {
			var stack = { id: i };
			questCoins.push(stack);
		}
	};

	var initNewHighScores = function(highscores) {
		highscores = undefined;
		highscores = new NewQuestHighScores();
		return highscores;
	};

	var initMilestones = function(highscores) {
		milestones = undefined;
		milestones = new Milestones();

		var mapHighscores = function(milestone) {
			var highscoresArr = highscores[milestone + 'Hx'].map(function(item) {
				return item.score;
			});
			return(Math.max.apply(Math, highscoresArr));
		};

		for (var key in milestones.highscores) {
			milestones.highscores[key] = mapHighscores(key);
		}
		return milestones;
	};

	var initScores = function(scores, sessionCount) {
		scores = undefined;
		scores = new QuestScores();
		scores.totalTrials = sessionCount;
		return scores;
	};

	var initBadges = function(badges) {
		badges = undefined;
		badges = new Badges();
		return badges;
	};


	// ==============================================
	// RATING EVENT HELPERS ------------------------

	// -- called by questRating() (each trial)  ------
	// maps coin value to color or userScore value
	var mapCoinColor = {
		3: 'gold',
		2: 'silver',
		1: 'bronze'
	};

	// for mapping coinColor values to values used for BITS research
	var mapLabScore = {
		3: 1,
		2: .5,
		1: 0
	};

	var updateCoinGraphic = function(data, currentWordIdx) {
		//console.log('currentWordIdx: ' + currentWordIdx);

		//graphics use zero-based idx
		var wordIdx = currentWordIdx - 1;
		var stackIdx = (Math.floor(wordIdx/10));
		var stackID = 'div#stack' + stackIdx;
		var coinID = 'g#coin-' + (wordIdx - (stackIdx * 10));

		// queries for css & svg
		var coinQ = stackID + ' ' + coinID;
		var sideQ = coinQ + ' g.side';
		var topQ = coinQ + ' ellipse.top';
		var coin = angular.element( document.querySelector( coinQ ) );
		var side = angular.element( document.querySelector( sideQ ) );
		var top = angular.element( document.querySelector( topQ ) );
		side.addClass('coinSide-' + data);
		top.addClass('coinTop-' +  data);
		coin.removeClass('hidden');
		coin.addClass('animated', 'bounce');

		//console.log(stackID + ', ' + coinID);
	};


	// ==============================================
	// MILESTONE HELPERS ---------------------------

	// updates milestone props in badges object
	function updateMilestoneCard(msType, badgesIn, msProp, count) {
		var badgesOut = Object.assign({}, badgesIn);

		var hasFlag = badgesOut.cardFlags.includes(msProp);

		if (msType === 'block') {
			if(!hasFlag) { badgesOut.cardFlags.push(msProp); }
			badgesOut.cardsBlockEnd[msProp].count = count;
		} else if (msType === 'quest') {
			badgesOut.cardsQuestEnd[msProp].flag = true;
			badgesOut.cardsQuestEnd[msProp].count = count;
		}

		return badgesOut;
	}

	// updates milestone props in badges object
	function updateSummaryCards(badgesIn, typeProp, msProp, coinSum ) {
		var badgesOut = Object.assign({}, badgesIn);
		badgesOut[typeProp][msProp].gold = coinSum.gold;
		badgesOut[typeProp][msProp].silver = coinSum.silver;
		badgesOut[typeProp][msProp].bronze = coinSum.bronze;

		return badgesOut;
	}

	// updates milestone props in in milestone obj to be saved to firebase at end of Quest
	function updateMilestoneRecord(milestonesIn, msProp, newMilestone) {
		var milestonesOut = Object.assign({}, milestonesIn);

		milestonesOut.highscores[msProp] = newMilestone;
		var msHx = [msProp] + 'Hx';
		milestonesOut.update[msHx].score = newMilestone;
		milestonesOut.update[msHx].date = Date.now();
		//milestones.update[msHx].sessionID = scores.sessionID;
		milestonesOut.shouldUpdateFirebase = true;

		return milestonesOut;
	}


	// ==============================================
	// END-OF-BLOCK HELPERS (dialog cards and resets)

	function clearFlags(flagObj) {
		var clearedObj = Object.assign({}, flagObj);
		for (var prop in flagObj) {
		  if (flagObj.hasOwnProperty(prop)) {
			  clearedObj[prop] = false;
		  }
		}
		return clearedObj;
	}

	// used for badges.onARoll & badges.newRecord only
	function resetBadges(badges, badge) {
		badges[badge].flag = false;
		badges[badge].trials = 0;
		badges[badge].visible = false;
	}

	// ==============================================
	// BADGE HELPERS (in-game stickers) -------------
	function displayBadgeOnARoll(badges) {
		badges.newRecord.visible = false;
		badges.onARoll.flag = true;
		badges.onARoll.visible = true;
		badges.onARoll.trials++;
	}

	function displayBadgeNewRecord(badges) {
		if(badges.onARoll.flag === false ||
			badges.onARoll.trials > 2)
		{ // switch badges
			badges.onARoll.visible = false;
			badges.newRecord.flag = true;
			badges.newRecord.visible = true;
			badges.newRecord.trials++;
		} else {
			badges.newRecord.flag = true;
		}
	}


	// ==============================================
	// DIALOG BOX HELPERS ------------------------

	// called by controller: $scope.dialogResume()
	function resetForNewBlock(scores, badges) {
		badges.qtDialog = clearFlags(badges.qtDialog);
		badges.qtDialogTemplate = clearFlags(badges.qtDialogTemplate);

		// scoresObj
		scores.block_score = 0;
		scores.block_display_score = 0;
		scores.block_goldCount = 0;
		scores.endOfBlock = false;

		// milestones: no need to reset

		// badges: in-game stickers
		resetBadges(badges, 'newRecord');

		// badges: achievement cards
		badges.cardNumber = -1;
		badges.cardSeq = [];
		badges.card = {};
		// #hc #TODO // make better flag index
		badges.endBlockSum.mgib.flag = false;
		badges.endBlockSum.hsib.flag = false;
		badges.endBlockSum.streak.flag = false;
		badges.endBlockSum.perfectBlock.flag = false;
	}


	// ==============================================
	// DIALOG BOX HELPERS ------------------------
	var nextCard = function(badges) {
		console.log('nextCard is callled');
		badges.cardNumber++;
		badges.qtDialogTemplate = clearFlags(badges.qtDialogTemplate);
		badges.qtDialog.isVisible = true;

		var cardIndex = badges.cardSeq[badges.cardNumber];
		var template = cardIndex.template;

		var populateCard = function(fieldArr) {
			fieldArr.forEach(function(field) {
				badges.card[field] = cardIndex[field];
			});
		};
		//add common template fields here
		var commonFields = ['title', 'btnText'];
		populateCard(commonFields);

		if(template === 'achievement') {
			badges.qtDialogTemplate.achievement = true;
			badges.card.count = cardIndex.count;
		} else if (template === 'note') {
			badges.qtDialogTemplate.note = true;
			badges.card.bodyText = cardIndex.bodyText;
		} else if (template === 'progSum') {
			badges.qtDialogTemplate.progSum = true;
			var progSumFields = ['subtitle', 'gold', 'silver', 'bronze'];
			populateCard(progSumFields);
		}
	}; // advanceEndOfBlock

	// called by checkUpdateMilestones()
	var prepEndOfBlock = function(scores, badges, currentWordIdx) {
		console.log(badges);

		badges.qtDialog.isBlockEnd = true;
		if(currentWordIdx <= (scores.totalTrials -10)) {
			badges.qtDialog.isFinal = true;
		}
		// this should already be set by clear fn
		// badges.cardNumber = -1;

		var sumTemp = badges.endBlockSum;
		// badges.cardSeq = [];

		for (var key in sumTemp) {
			if (sumTemp[key].flag) {
				badges.cardSeq.push({
					template: 'achievement',
					title: sumTemp[key].title,
					count: sumTemp[key].count,
					imgUrl: sumTemp[key].imgUrl,
					btnText: 'Next',
					btnFn: 'dialogNext()'
				});
			}
		}
		badges.cardSeq.push({
			template: 'note',
			title: 'Checkpoint',
			subtitle: '',
			imgUrl: '',
			bodyText: 'Please provide qualitative feedback on the participant\'s performance over the last ten trials.',
			btnText: 'See Scores',
			btnFn: 'dialogNext()'
		});
		// if end-of-block TODO #hc #430
		//if(!badges.qtDialog.isFinal) {
		badges.cardSeq.push({
			template: 'progSum',
			title: 'Progress Summary',
			subtitle: currentWordIdx + ' / ' + scores.totalTrials + ' complete',
			gold: scores.session_coins.gold,
			silver: scores.session_coins.silver,
			bronze: scores.session_coins.bronze,
			btnText: 'Resume Quest',
			btnFn: 'dialogResume()',
		});
		//} TODO #hc #430
		/* TODO #hc #430 End-of-Quest card logic WIP
		// if end-of-quest
		if(badges.qtDialog.isFinal) {
			badges.cardSeq.push({
				template: 'endSum',
				title: 'Quest Complete!',
				subtitle: '',
				gold: scores.session_coins.gold,
				silver: scores.session_coins.silver,
				bronze: scores.session_coins.bronze,
				btnText: 'See Score',
				btnFn: 'dialogNext()'
			});
			badges.cardSeq.push({
				template: 'finalScore',
				title: 'Quest Complete!',
				subtitle: '',
				count: 0,
				btnText: 'Close',
				// btnFn: 'endPractice()'
			});
		}
		*/
		console.log(badges.cardSeq);
		nextCard(badges);
	};


	// ==============================================
	// MAIN PROCS ===================================

	//called by questRating() only
	var checkUpdateMilestones = function(scores, milestones, badges, currentWordIdx) {

		// checked every trial -----------------------------
		if(scores.streak > 2)	{
			displayBadgeOnARoll(badges);
		} else {
			resetBadges(badges, 'onARoll');
		}
		if(scores.streak < 2 && badges.newRecord.flag)	{
			badges.newRecord.visible = true;
		}

		// mgib: most gold in block
		if(scores.block_goldCount > 0) {
			if( scores.block_goldCount >= milestones.highscores.mgib) {
				console.log('NEW RECORD: MOST GOLD IN BLOCK');
				displayBadgeNewRecord(badges);
				var mgibNew = scores.block_goldCount;
				milestones = updateMilestoneRecord(milestones, 'mgib', mgibNew);
				badges = updateMilestoneCard('block', badges, 'mgib', milestones.highscores.mgib);
			}
		}

		// hsib: high score in block
		if(scores.block_goldCount > 10) {
			if( scores.block_display_score > milestones.highscores.hsib) {
				console.log('NEW RECORD: HIGH SCORE IN BLOCK');
				displayBadgeNewRecord(badges);
				var hsibNew = scores.block_display_score;
				milestones = updateMilestoneRecord(milestones, 'hsib', hsibNew);
				badges = updateMilestoneCard('block', badges, 'hsib', milestones.highscores.hsib);
			}
		}

		// hsiq: high score in quest
		if(scores.display_score > 15) {
			if( scores.display_score > milestones.highscores.hsiq) {
				console.log('NEW RECORD: HIGH SCORE IN QUEST');
				displayBadgeNewRecord(badges);
				var hsiqNew = scores.display_score;
				milestones = updateMilestoneRecord(milestones, 'hsiq', hsiqNew);
				badges = updateMilestoneCard('quest', badges, 'hsiq', hsiqNew);
			}
		}

		// mgiq: most gold in quest
		if(scores.session_coins.gold > 0) {
			if( scores.session_coins.gold > milestones.highscores.mgiq) {
				console.log('NEW RECORD: MOST GOLD IN QUEST');
				displayBadgeNewRecord(badges);
				var mgiqNew = scores.session_coins.gold;
				milestones = updateMilestoneRecord(milestones, 'mgiq', mgiqNew);
				badges = updateMilestoneCard('quest', badges, 'mgiq', mgiqNew);
			}
		}

		// streak: consequtive golds
		if ( scores.streak > 2 ) {
			if( scores.streak > milestones.highscores.streak ) {
				console.log('NEW RECORD: STREAK');
				displayBadgeNewRecord(badges);
				var streakNew = scores.streak;
				milestones = updateMilestoneRecord(milestones, 'streak', streakNew);
				badges = updateMilestoneCard('block', badges, 'streak', streakNew);
			}
		}

		if(scores.block_goldCount == 10) {
			console.log('PERFECT BLOCK');
			// no badge, achieved at end of block
			var perfectBlockNew = milestones.highscores.perfectBlock++;
			milestones = updateMilestoneRecord(milestones, 'perfectBlock', perfectBlockNew);
			badges = updateMilestoneCard('block', badges, 'perfectBlock', perfectBlockNew);
		}

		// checked at end of block -----------------------------
		if( scores.endOfBlock ) {
			//updateSummaryCards()
			var coinSum = scores.session_coins;
			badges = updateSummaryCards(badges, 'cardsBlockEnd', 'progSum', coinSum );
			badges = updateSummaryCards(badges, 'cardsQuestEnd', 'endSum', coinSum );

			//TODO: #356, #hc. Should Adapt Diff milestone be prepped here?
			scores.performance = scores.block_score/10;

			prepEndOfBlock(scores, badges, currentWordIdx);
		}
	}; //end checkUpdateMilestones


	//--------------------------------------------------
	// Called by each rating button press. Updates scores and coins.
	var questRating = function(data, scores, milestones, currentWordIdx, badges) {

		// update the coin
		updateCoinGraphic(data, currentWordIdx);

		// update score data
		scores.display_score += data;
		scores.block_display_score += data;

		if (mapCoinColor[data] == 'gold') {
			scores.block_goldCount += 1;
		}

		scores.session_coins[mapCoinColor[data]]++;

		// update lab score counters
		scores.block_score += mapLabScore[data]; // labScore
		scores.session_score += mapLabScore[data]; // labScore

		if (mapCoinColor[data] == 'gold') {
			scores.streak++;
		} else {
			scores.streak = 0;
			resetBadges(badges, 'onARoll');
		}

		// check for end of block
		scores.endOfBlock = (currentWordIdx % 10 == 0 && currentWordIdx > 0) ? true : false;

		checkUpdateMilestones(scores, milestones, badges, currentWordIdx);
	}; // end questRating()


	// #hc keep the function names consistent
	return {
		initCoinCounter: initCoinCounter,
		initNewHighScores: initNewHighScores,
		initMilestones: initMilestones,
		initScores: initScores,
		initBadges: initBadges,
		questRating: questRating,
		nextCard: nextCard,
		resetForNewBlock: resetForNewBlock
	};
});
