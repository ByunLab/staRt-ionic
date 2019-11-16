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

	// handles state for active Quest score counters
	function QuestScores() {
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
			endOfBlock: false,
			totalTrials: 0,
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
			endBlockSum_old: {
				mgib: false,
				mgibCount: 0,
				hsib: false,
				hsibCount: 0,
				streak: false,
				streakCount: 0,
				perfectBlock: false,
				perfectBlockCount: 0
			},
			endBlockSum: {
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
			endBlockSeq: [],
			endBlockDisplay: {},
			endQuestSum: {},
			qtDialog: {
				isVisible: false, // is the Dialog Box Visible
				isBlockEnd: false, // holds 'End of Block' Sequence
				isBreak: false, // holds "Take a Break"
				isQuestEnd: false, // holds End-of-Quest Sequence
				isFinalScore: false, // hold 'Final Score' graphic
			},
			qtDialogTemplate: {
				cardNumber: -1,
				break: {},
				blockEnd: {
					title: '',
					count: '',
					imgUrl: '',
				},
				questEnd: {},
				finalScore: {}
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

		function mapHighscores(milestone) {
			var highscoresArr = highscores[milestone + 'Hx'].map(function(item) {
				return item.score;
			});
			return(Math.max.apply(Math, highscoresArr));
		}

		for (var key in milestones.highscores) {
			milestones.highscores[key] = mapHighscores(key);
		}
		//console.log(milestones);
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

	function resetBadges(badges, badge) {
		badges[badge].flag = false;
		badges[badge].trials = 0;
		badges[badge].visible = false;
		//console.log(badges);
	}

	function displayBadgeOnARoll(badges) {
		badges.newRecord.visible = false;
		badges.onARoll.flag = true;
		badges.onARoll.visible = true;
		badges.onARoll.trials++;
		//console.log('ON A ROLL!!');
		console.log(badges);
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
		//console.log(badges);
	}

	// -- called by checkUpdateMilestones() ---
	function resetForNewBlock(scores, badges) {
		scores.block_score = 0;
		scores.block_display_score = 0;
		scores.block_goldCount = 0;
		resetBadges(badges, 'newRecord');
	}

	// #TEMP
	function resetEndBlockBadges(badges) {
		badges.endBlockSum.mgib.flag = false;
		badges.endBlockSum.hsib.flag = false;
		badges.endBlockSum.streak.flag = false;
		badges.endBlockSum.perfectBlock.flag = false;
	}

	// updates prop in badges.endBlockSum[milestone] to be displayed at the end of the block
	function updateMilestoneCard(badges, msProp, count) {
		badges.endBlockSum[msProp].flag = true;
		badges.endBlockSum[msProp].count = count;
		//console.log(badges);
	}

	// updates milestone obj record to be saved to firebase at end of Quest
	function updateMilestoneRecord(scores, milestones, msProp, scoresProp, scoresPropOpt) {
		if(scoresPropOpt) {
			milestones.update[msProp].score = scores[scoresProp][scoresPropOpt];
		} else {
			milestones.update[msProp].score = scores[scoresProp];
		}
		milestones.update[msProp].date = Date.now();
		milestones.update[msProp].sessionID = scores.sessionID;
		milestones.shouldUpdateFirebase = true;
		//console.log(milestones);
	}


	// ==============================================
	// DIALOG BOX HELPERS ------------------------
	// var qtDialog_close;
	// var qtDialog_next;
	// var qtDialog_resume;

	var advanceEndOfBlock = function(badges) {
		badges.qtDialogTemplate.cardNumber++;

		var template = badges.endBlockSeq[badges.qtDialogTemplate.cardNumber].template;

		var card = badges.endBlockSeq[badges.qtDialogTemplate.cardNumber];

		if(template === 'blockEnd') {
			badges.endBlockDisplay.title = badges.endBlockSeq[badges.qtDialogTemplate.cardNumber].title;
			badges.endBlockDisplay.count = badges.endBlockSeq[badges.qtDialogTemplate.cardNumber].count;
		} else if (template === 'break') {
			badges.qtDialog.isBreak = true;
			badges.endBlockDisplay.title = card.title;
			badges.endBlockDisplay.subtitle = card.subtitle;
			badges.endBlockDisplay.gold = card.gold;
			badges.endBlockDisplay.silver = card.silver;
			badges.endBlockDisplay.bronze = card.bronze;
		}
	};

	// var resumeAfterBreak = function() {
	/*
		will be called from the dialog interface
		- unpause the wave
		- clear badges.endBlockSeq, badges.endBlockDisplay
		- reset for badges.endBlockSum
		- qtDialog: set all to F
		- qtDialogTemplate.cardNumber = -1;


	// resets badges display
	//resetEndBlockBadges(badges);

	// resets score counters & New Record counters
	//resetForNewBlock(scores, badges);

	//scores.endOfBlock = false;
	*/
	// };

	// called by
	var prepEndOfBlock = function(scores, badges, currentWordIdx) {
		//console.log('runEndOfBlock called');

		badges.qtDialog.isBlockEnd = true;

		var sumTemp = badges.endBlockSum;
		//badges.endBlockSeq = new EndBlockSeqObj();

		for (var key in sumTemp) {
			if (sumTemp[key].flag) {
				badges.endBlockSeq.push({
					template: 'blockEnd',
					title: sumTemp[key].title,
					count: sumTemp[key].count,
					imgUrl: sumTemp[key].imgUrl,
				});
			}
		}
		badges.endBlockSeq.push({
			template: 'break',
			title: 'Take a break!',
			subtitle: currentWordIdx + ' / ' + scores.totalTrials + ' completed',
			gold: scores.session_coins.gold,
			silver: scores.session_coins.silver,
			bronze: scores.session_coins.bronze
		});


		if(badges.endBlockSeq.length > 0){
			badges.qtDialog.isBlockEnd = true;
		} else {
			badges.qtDialog.isBreak = true;
		}
		badges.qtDialogTemplate.cardNumber = -1;

		advanceEndOfBlock(badges);

		badges.qtDialog.isVisible = true;
	};




	// ==============================================
	// MAIN PROCS ===================================

	//var endOfBlock = false;

	//called by questRating()
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
				milestones.highscores.mgib = scores.block_goldCount;
				console.log('NEW RECORD: MOST GOLD IN BLOCK');
				displayBadgeNewRecord(badges);
				updateMilestoneCard(badges, 'mgib', milestones.highscores.mgib);
				updateMilestoneRecord(scores, milestones, 'mgibHx', 'block_goldCount');
			}
		}

		// hsib: high score in block
		if(scores.block_goldCount > 0) {
			if( scores.block_display_score > milestones.highscores.hsib) {
				milestones.highscores.hsib = scores.block_display_score;
				console.log('NEW RECORD: HIGH SCORE IN BLOCK');
				displayBadgeNewRecord(badges);
				updateMilestoneCard(badges, 'hsib', milestones.highscores.hsib);
				updateMilestoneRecord(scores, milestones, 'hsibHx', 'block_display_score');
			}
		}

		// hsiq: high score in quest
		if(scores.display_score > 0) {
			if( scores.display_score > milestones.highscores.hsiq) {
				milestones.highscores.hsiq = scores.display_score;
				console.log('NEW RECORD: HIGH SCORE IN QUEST');
				displayBadgeNewRecord(badges);
				// badges.endBlockSum.hsiq = true;
				// badges.endBlockSum.hsiqCount = scores.display_score;
				updateMilestoneRecord(scores, milestones, 'hsiqHx', 'display_score');
			}
		}

		// mgiq: most gold in quest
		if(scores.session_coins.gold > 0) {
			if( scores.session_coins.gold > milestones.highscores.mgiq) {
				milestones.highscores.mgiq = scores.session_coins.gold;
				console.log('NEW RECORD: MOST GOLD IN QUEST');
				displayBadgeNewRecord(badges);
				// badges.endBlockSum.mgiq = true;
				// badges.endBlockSum.mgiqCount = milestones.highscores.mgiq;
				updateMilestoneRecord(scores, milestones, 'mgiqHx', 'session_coins', 'gold');
			}
		}

		if( scores.streak > milestones.highscores.streak ) {
			milestones.highscores.streak = scores.streak;
			console.log('NEW RECORD: STREAK');
			displayBadgeNewRecord(badges);
			updateMilestoneCard(badges, 'streak', milestones.highscores.streak);
			// badges.endBlockSum_old.streak = true;
			// badges.endBlockSum_old.streakCount = scores.streak;
			updateMilestoneRecord(scores, milestones, 'streakHx', 'streak');
		}

		if(scores.block_goldCount === 10) {
			milestones.highscores.perfectBlock++;
			console.log('PERFECT BLOCK');
			// no badge, achieved at end of block
			updateMilestoneCard(badges, 'perfectBlock', milestones.highscores.perfectBlock);
			milestones.update.perfectBlockHx.score= milestones.highscores.perfectBlock;
			milestones.update.perfectBlockHx.date = Date.now();
			milestones.update.perfectBlockHx.sessionID = scores.sessionID;
			milestones.shouldUpdateFirebase = true;
		}

		// checked at end of block -----------------------------
		if( scores.endOfBlock ) {
			scores.performance = scores.block_score/10;
			console.log('END OF BLOCK IS TRUE');
			//console.log('Current Word Index: ' + currentWordIdx);
			prepEndOfBlock(scores, badges, currentWordIdx);
		}
	}; //end checkUpdateMilestones


	//--------------------------------------------------
	//called by each rating button press
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
		if (currentWordIdx % 10 == 0 && currentWordIdx >= 10) {
			console.log('Current Word Index: ' + currentWordIdx);
			scores.endOfBlock = true;
		}

		checkUpdateMilestones(scores, milestones, badges, currentWordIdx);
	}; // end questRating()

	return {
		initCoinCounter: initCoinCounter,
		initNewHighScores: initNewHighScores,
		initMilestones: initMilestones,
		initScores: initScores,
		initBadges: initBadges,
		questRating: questRating,
		dialogNext: advanceEndOfBlock
	};
});
