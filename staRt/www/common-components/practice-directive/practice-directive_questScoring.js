/*global milestones:writable */

var practiceDirective = angular.module( 'practiceDirective' );

practiceDirective.factory('QuestScore', function QuestScoreFactory( ScoreConstructors ) {

	/* ---------------------------------------
  Purpose: Handles Quest scoring, milestone, and badging logic
  Ref: See https://github.com/ByunLab/staRt-ionic/wiki/Quest-Scoring
	*/

	// handles state for active Quest score counters
	function QuestScores() {
		// sessionID is added by the controller
		return {
			block_display_score: 0, //user val
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
			performance: 0, // req'd for difficulty score
			changeDifficulty: 0, // req'd for difficulty score
			endOfBlock: false, // req'd by prepEndOfBlock()
			totalTrials: 0, // // req'd by prepEndOfBlock()
			isResumePrep: false, // used by resume-session feature
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
		highscores = ScoreConstructors.NewQuestHighScores();
		return highscores;
	};

	var initMilestones = function(highscores) {
		milestones = undefined;
		milestones = ScoreConstructors.Milestones();

		// highscores data --------------------------
		var mapHighscores = function(milestone) {
			var highscoresArr = highscores[milestone + 'Hx'].map(function(item) {
				return item.score;
			});
			return(Math.max.apply(Math, highscoresArr));
		};

		for (var key in milestones.highscores) {
			milestones.highscores[key] = mapHighscores(key);
		}

		console.log(milestones);
		// display data --------------------------
		var sandbank = ScoreConstructors.Sandbank();

		var displayTemp = {};

		for (var key in highscores) {
			var keyName = key.slice(0, -2);
			var keyIdxNewest = highscores[key].length -1;
			displayTemp[keyName] = highscores[key][keyIdxNewest];
			displayTemp[keyName].dateStr = new Date(displayTemp[keyName].date).toLocaleDateString();
		}
		for (var item in sandbank) {
			sandbank[item].score = displayTemp[item].score;
			sandbank[item].dateStr = displayTemp[item].dateStr;
			if (sandbank[item].score > sandbank[item].min) {
				sandbank[item].achieved = true;
			}
		}

		milestones.display = sandbank;

		// console.log(milestones.highscores);
		return milestones;
	};

	var initScores = function(scores, sessionCount) {
		scores = undefined;
		scores = new QuestScores();
		scores.totalTrials = sessionCount;
		return scores;
	};

	var initBadges = function(badges, userPrefs) {
		badges = undefined;
		badges = ScoreConstructors.Badges();
		badges = updateUserPrefs(badges, userPrefs);

		// updates $scope.badges
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
	function updateMilestoneCard(msType, badges, msProp, count) {
		var hasFlag = badges.cardFlags.includes(msProp);

		if (msType === 'block') {
			if(!hasFlag) { badges.cardFlags.push(msProp); }
			badges.cardsBlockEnd[msProp].count = count;
		} else if (msType === 'quest') {
			badges.cardsQuestEnd[msProp].flag = true;
			badges.cardsQuestEnd[msProp].count = count;
		}
	}

	// updates milestone props in badges object
	function updateSummaryCards(badges, typeProp, msProp, coinSum ) {
		badges[typeProp][msProp].gold = coinSum.gold;
		badges[typeProp][msProp].silver = coinSum.silver;
		badges[typeProp][msProp].bronze = coinSum.bronze;
	}

	// updates milestone props in in $scope.milestones to be saved to firebase at end of Quest
	function updateMilestoneRecord(milestones, msProp, newMilestone) {
		milestones.highscores[msProp] = newMilestone;

		// for fb update
		var msHx = [msProp] + 'Hx';
		milestones.update[msHx].score = newMilestone;
		milestones.update[msHx].date = Date.now();
		milestones.shouldUpdateFirebase = true;

		// for sandbank
		milestones.display[msProp].score = newMilestone;
		milestones.display[msProp].dateStr = 'TODAY!';
		milestones.display[msProp].achieved = true;
	}


	// ==============================================
	// END-OF-BLOCK HELPERS (dialog cards and resets)

	// called by resetForNewBlock(), nextCard()
	function clearFlags(flagObj) {
		for (var prop in flagObj) {
		  if (flagObj.hasOwnProperty(prop)) {
				flagObj[prop] = false;
		  }
		}
	}

	// used for badges.onARoll & badges.newRecord only
	function resetBadges(badges, badge) {
		badges[badge].flag = false;
		badges[badge].trials = 0;
		badges[badge].visible = false;
	}

	// ==============================================
	// ADAPTIVE DIFFICULTY HELPER
	function checkDifficulty(scores, badges) {
		// update performance
		scores.performance = scores.block_score/10;

		// update changeDiff
		var increase_difficulty_threshold = 0.8;
		var decrease_difficulty_threshold = 0.5;

		var should_increase_difficulty = function() {
			return scores.performance >= increase_difficulty_threshold;
		};
		var should_decrease_difficulty = function() {
			return scores.performance <= decrease_difficulty_threshold;
		};

		if (should_increase_difficulty()) {
			badges.cardFlags.push('incrDiff');
			scores.changeDifficulty = 1;
		} else if (should_decrease_difficulty()) {
			scores.changeDifficulty = -1;
		} else {
			scores.changeDifficulty = 0;
		}
	}

	// ==============================================
	// BADGE HELPERS (in-game stickers) -------------
	function displayBadgeOnARoll(badges) {
		if(!badges.badgesOn) {
			return;
		} else {
			badges.newRecord.visible = false;
			badges.onARoll.flag = true;
			badges.onARoll.visible = true;
			badges.onARoll.trials++;
		}
	}

	function displayBadgeNewRecord(badges) {
		if(!badges.badgesOn) {
			return;
		} else {
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
	}


	// ==============================================
	// DIALOG BOX HELPERS ------------------------
	function prepEndOfBlock(badges) {
		var showReminders = badges.remindersOn;
		var msFlags = badges.cardFlags; // array of milestones achieved in block
		//console.log(msFlags);

		// adds card template per milestone achieved in block + feedback card
		msFlags.forEach( function(ms) {
			var msCard = badges.cardsBlockEnd[ms];
			badges.cardSeq.push(msCard);
		});

		if(badges.qtDialog.isFinal) {
			if(badges.cardsQuestEnd.mgiq.flag) {
				badges.cardSeq.push( badges.cardsQuestEnd.mgiq );
			}
			if(badges.cardsQuestEnd.hsiq.flag) {
				badges.cardSeq.push( badges.cardsQuestEnd.hsiq );
			}
			if(showReminders) {
				badges.cardSeq.push( badges.cardsBlockEnd.feedback );
			}
			badges.cardSeq.push(badges.cardsQuestEnd.endSum);
			badges.cardSeq.push( badges.cardsQuestEnd.finalScore );

		} else { // normal end-of-block
			if(showReminders) {
				badges.cardSeq.push( badges.cardsBlockEnd.feedback );
			}
			badges.cardSeq.push( badges.cardsBlockEnd.progSum );
		}

		//console.log(badges.cardSeq);
		nextCard(badges);
	}

	// ==============================================
	// SANDBANK ------------------------
	// Updates the Sandbank scores an sets highlights
	// Called each time the user opens the Sandbank drawer
	function updateSandbank(scores, milestones) {
		var updateObj = {
			hsib: scores.block_display_score,
			mgib: scores.block_goldCount,
			streak: scores.streak,
			hsiq: scores.display_score,
			mgiq: scores.session_coins.gold,
			perfectBlock: milestones.highscores.perfectBlock,
		};

		for (var sb_item in milestones.display) {
			milestones.display[sb_item].currentValue = updateObj[sb_item];

			if(milestones.display[sb_item].currentValue > 0) {
				if( milestones.display[sb_item].currentValue > (milestones.display[sb_item].score - milestones.display[sb_item].highlightTest)) {
					milestones.display[sb_item].highlight = true;
				} else {
					milestones.display[sb_item].highlight = false;
				}
			}
		}
		//console.log(milestones.display);
	}

	function updateUserPrefs(badges, userPrefs) {
		badges.badgesOn = userPrefs.badgesOn;
		badges.cardsOn = userPrefs.cardsOn;
		badges.remindersOn = userPrefs.remindersOn;

		if(!badges.badgesOn) {
			resetBadges(badges, 'onARoll');
			resetBadges(badges, 'newRecord');
		}

		return badges;
	}


	// ==============================================
	// MAIN PROCS ===================================

	// called by controller: $scope.dialogResume()
	var resetForNewBlock = function (scores, badges) {
		clearFlags(badges.qtDialog);
		clearFlags(badges.qtDialogTemplate);

		// scoresObj
		scores.block_score = 0;
		scores.block_display_score = 0;
		scores.block_goldCount = 0;
		scores.endOfBlock = false;

		// milestones: no need to reset

		// badges: in-game stickers
		resetBadges(badges, 'newRecord');

		// badges: achievement cards
		badges.cardIndex = -1;
		badges.cardFlags = [];
		badges.cardSeq = [];
		badges.card = {};
	};

	// called by $scope.dialogNext();
	var nextCard = function(badges) {
		//console.log('nextCard is callled');
		clearFlags(badges.qtDialogTemplate);

		badges.cardIndex++;

		var currentCard = badges.cardSeq[badges.cardIndex];
		var template = currentCard.template;

		var populateCard = function(fieldArr) {
			fieldArr.forEach(function(field) {
				badges.card[field] = currentCard[field];
			});
		};
		//add common template fields here
		var commonFields = ['title', 'imgClass', 'btnText'];
		populateCard(commonFields);

		if(template === 'achievement') {
			badges.qtDialogTemplate.achievement = true;
			badges.card.count = currentCard.count;
		} else if (template === 'note') {
			badges.qtDialogTemplate.note = true;
			badges.card.bodyText = currentCard.bodyText;
		} else if (template === 'progSum') {
			badges.qtDialogTemplate.progSum = true;
			var progSumFields = ['subtitle', 'gold', 'silver', 'bronze'];
			populateCard(progSumFields);
		} else if (template === 'endSum') {
			badges.qtDialogTemplate.endSum = true;
			var endSumFields = ['subtitle', 'gold', 'silver', 'bronze'];
			populateCard(endSumFields);
		} else if (template === 'finalScore') {
			badges.qtDialogTemplate.finalScore = true;
			badges.card.count = currentCard.count;
		}


		if(badges.cardIndex >= 0) {
			badges.qtDialog.isVisible = true;
		}
	}; // advanceEndOfBlock

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
		if(( scores.block_goldCount > milestones.highscores.mgib) && (scores.block_goldCount > milestones.scoreMins.mgib)) {
			console.log('NEW RECORD: MOST GOLD IN BLOCK');
			displayBadgeNewRecord(badges);
			var mgibNew = scores.block_goldCount;
			updateMilestoneRecord(milestones, 'mgib', mgibNew);
			updateMilestoneCard('block', badges, 'mgib', mgibNew);
		}

		// hsib: high score in block
		if(( scores.block_display_score > milestones.highscores.hsib) && (scores.block_display_score > milestones.scoreMins.hsib)) {
			console.log('NEW RECORD: HIGH SCORE IN BLOCK');
			displayBadgeNewRecord(badges);
			var hsibNew = scores.block_display_score;
			updateMilestoneRecord(milestones, 'hsib', hsibNew);
			updateMilestoneCard('block', badges, 'hsib', hsibNew);
		}

		// hsiq: high score in quest
		if(( scores.display_score > milestones.highscores.hsiq) && (scores.display_score > milestones.scoreMins.hsiq)) {
			console.log('NEW RECORD: HIGH SCORE IN QUEST');
			if (!badges.newRecord.hsiq) {
				displayBadgeNewRecord(badges);
				badges.newRecord.hsiq = true;
			}
			var hsiqNew = scores.display_score;
			updateMilestoneRecord(milestones, 'hsiq', hsiqNew);
			updateMilestoneCard('quest', badges, 'hsiq', hsiqNew);
		}

		// mgiq: most gold in quest
		if(( scores.session_coins.gold > milestones.highscores.mgiq) && (scores.session_coins.gold > milestones.scoreMins.mgiq)) {
			console.log('NEW RECORD: MOST GOLD IN QUEST');
			if (!badges.newRecord.mgiq) {
				displayBadgeNewRecord(badges);
				badges.newRecord.mgiq = true;
			}
			var mgiqNew = scores.session_coins.gold;
			updateMilestoneRecord(milestones, 'mgiq', mgiqNew);
			updateMilestoneCard('quest', badges, 'mgiq', mgiqNew);
		}

		// streak: consecutive golds
		if(( scores.streak > milestones.highscores.streak ) && (scores.streak > milestones.scoreMins.streak)){
			console.log('NEW RECORD: STREAK');
			displayBadgeNewRecord(badges);
			var streakNew = scores.streak;
			updateMilestoneRecord(milestones, 'streak', streakNew);
			updateMilestoneCard('block', badges, 'streak', streakNew);
		}

		if(scores.block_goldCount == 10) {
			console.log('PERFECT BLOCK');
			// no badge, achieved at end of block
			var perfectBlockNew = milestones.highscores.perfectBlock + 1;
			updateMilestoneRecord(milestones, 'perfectBlock', perfectBlockNew);
			updateMilestoneCard('block', badges, 'perfectBlock', perfectBlockNew);
		}

		// checked at end of block -----------------------------
		if( scores.endOfBlock ) {

			var finalBlock = (currentWordIdx > (scores.totalTrials -10)) ? true : false;

			if(!finalBlock) { checkDifficulty(scores, badges); }

			//updateSummaryCards()
			badges.qtDialog.isBlockEnd = true;
			badges.cardsBlockEnd.progSum.subtitle = currentWordIdx + ' / ' + scores.totalTrials + ' complete';
			var coinSum = scores.session_coins;
			updateSummaryCards(badges, 'cardsBlockEnd', 'progSum', coinSum );

			if(finalBlock){
				badges.qtDialog.isFinal = true;
				updateSummaryCards(badges, 'cardsQuestEnd', 'endSum', coinSum );
				badges.cardsQuestEnd.finalScore.count = scores.display_score;
			}

			var skipBlock = !badges.cardsOn && !badges.qtDialog.isFinal;
			// skips the dialog box prep if we are resuming a saved session
			if(scores.isResumePrep || skipBlock){
				resetForNewBlock(scores, badges);
			} else {
				prepEndOfBlock(badges);
			}
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

	return {
		initCoinCounter: initCoinCounter,
		initNewHighScores: initNewHighScores,
		initMilestones: initMilestones,
		initScores: initScores,
		initBadges: initBadges,
		questRating: questRating,
		nextCard: nextCard,
		resetForNewBlock: resetForNewBlock,
		updateSandbank: updateSandbank,
		updateUserPrefs: updateUserPrefs,
	};
});
