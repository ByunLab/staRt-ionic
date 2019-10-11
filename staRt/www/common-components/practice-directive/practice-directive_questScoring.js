/*global milestones:writable */

var practiceDirective = angular.module( 'practiceDirective' );
practiceDirective.factory('QuestScore', function QuestScoreFactory() {

	/* ---------------------------------------
  Purpose: Handles Quest scoring, milestone, and badging logic
  Ref: See https://github.com/ByunLab/staRt-ionic/wiki/Quest-Scoring
	*/

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

	// example data: will eventually be read in from fb user profile
	function FakeIn_questHighScores() {
		return  {
			mgibHx: [
				{score: 3, date: 1558537200 },
				{score: 4, date: 1554363300 },
				{score: 5, date: 1551855360 }
			],
			hsibHx: [
				{score: 6, date: 1539454440 },
				{score: 8, date: 1545427500 },
				{score: 10, date: 1562916120 }
			],
			mgiqHx: [
				{score: 44, date: 1539454440 },
				{score: 49, date: 1539454440 },
				{score: 50, date: 1539454440 }
			],
			hsiqHx: [
				{score: 140, date: 1539454440 },
				{score: 148, date: 1539454440 },
				{score: 150, date: 1539454440 }
			],
			streakHx: [
				{score: 4, date: 1539454440 },
				{score: 6, date: 1539454440 }
			],
			perfectBlockHx: [
				{ score: 1, date: 1539454440 }
			]
		};
	}

	// ----------------------------------------------
	// USED FOR IN GAME STATE -----------------------------
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
			performance: 0 // req'd for difficulty score
		};
	}

	function Badges() {
		// perfectBlock: false,
		// incrDiff: false
		return {
			flags: {
				questNewRecord: false,
				blockNewRecord: false,
				onARoll: false,
			},
			endBlockSum: {
				mgib: false,
				mgibCount: 0,
				hsib: false,
				hsibCount: 0,
				streak: false,
				streakCount: 0,
				perfectBlock: false,
				perfectBlockCount: 0
			},
			endQuestSum: []
		};
	}

	// ==============================================
	// INITS ------------------------
	var initCoinCounter = function(count, questCoins){
		var numStack = count/10;
		for(var i=0; i<numStack; i++) {
			// let rotation =
			var stack = { id: i };
			questCoins.push(stack);
		}
	};

	var initFakeHighScores = function(highscores) {
		highscores = undefined;
		highscores = new FakeIn_questHighScores();

		return highscores;
	};

	var initNewHighScores = function(highscores) {
		// not currently in use
		highscores = undefined;
		highscores = new NewQuestHighScores();

		return highscores;
	};

	var initMilestones = function(highscores) {
		milestones = undefined;
		milestones = new Milestones();
		//console.log(highscores);

		function mapHighscores(milestone) {
			var highscoresArr = highscores[milestone + 'Hx'].map(function(item) {
				return item.score;
			});
			//return(Math.max(...highscoresArr)); (won't work on iOS9?)
			return(Math.max.apply(Math, highscoresArr));
		}

		for (var key in milestones.highscores) {
			milestones.highscores[key] = mapHighscores(key);
		}
		//console.log(milestones);

		return milestones;
	};

	var initScores = function(scores) {
		scores = undefined;
		scores = new QuestScores();

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

	// -- called by checkUpdateMilestones() (each block)---
	var resetForNewBlock = function(scores, badges) {
		scores.block_score = 0;
		scores.block_display_score = 0;
		badges.blockNewRecord = false;

		badges.endBlockSum.mgib = false;
		badges.endBlockSum.hsib = false;
		badges.endBlockSum.streak = false;
		badges.endBlockSum.perfectBlock = false;
	};


	function updateMilestone(scores, milestones, msProp, scoresProp, scoresPropOpt) {
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
	// MAIN PROCS ===================================

	var endOfBlock = false;

	//called by questRating()
	var checkUpdateMilestones = function(scores, milestones, endOfBlock, badges) {

		// checked every trial -----------------------------
		if( scores.block_goldCount > milestones.highscores.mgib) {
			milestones.highscores.mgib = scores.block_goldCount;
			console.log('NEW RECORD: MOST GOLD IN BLOCK');
			badges.flags.onARoll = false;
			badges.flags.blockNewRecord = true;
			badges.endBlockSum.mgib = true;
			badges.endBlockSum.mgibCount = scores.block_goldCount;
			updateMilestone(scores, milestones, 'mgibHx', 'block_goldCount');
		}

		if( scores.block_display_score > milestones.highscores.hsib) {
			milestones.highscores.hsib = scores.block_display_score;
			console.log('NEW RECORD: HIGH SCORE IN BLOCK');
			badges.flags.onARoll = false;
			badges.flags.blockNewRecord = true;
			badges.endBlockSum.hsib = true;
			badges.endBlockSum.hsibCount = scores.block_display_score;
			updateMilestone(scores, milestones, 'hsibHx', 'block_display_score');
		}

		if( scores.display_score > milestones.highscores.hsiq) {
			milestones.highscores.hsiq = scores.display_score;
			console.log('NEW RECORD: HIGH SCORE IN QUEST');
			badges.flags.onARoll = false;
			badges.flags.questNewRecord = true;
			// queque endOfQuest milestone
			// queque endOfQuest milestoneCount
			updateMilestone(scores, milestones, 'hsiqHx', 'display_score');
		}

		if( scores.session_coins.gold > milestones.highscores.mgiq) {
			milestones.highscores.mgiq = scores.session_coins.gold;
			console.log('NEW RECORD: MOST GOLD IN QUEST');
			badges.flags.onARoll = false;
			badges.flags.questNewRecord = true;
			// queque endOfQuest milestone
			// queque endOfQuest milestoneCount
			updateMilestone(scores, milestones, 'mgiqHx', 'session_coins', 'gold');
		}

		if(scores.streak > 3) {
			badges.onARoll = true;
			console.log('ON A ROLL!!');
		} else {
			badges.onARoll = false;
		}
		if( scores.streak > milestones.highscores.streak ) {
			milestones.highscores.streak = scores.streak;
			console.log('NEW RECORD: STREAK');
			badges.flags.onARoll = false;
			badges.flags.blockNewRecord = true;
			badges.endBlockSum.streak = true;
			badges.endBlockSum.streakCount = scores.streak;
			updateMilestone(scores, milestones, 'streakHx', 'streak');
		}

		if(scores.block_goldCount === 10) {
			milestones.highscores.perfectBlock++;
			console.log('PERFECT BLOCK');
			badges.endBlockSum.perfectBlock = true,
			badges.endBlockSum.perfectBlockCount = milestones.highscores.perfectBlock;

			milestones.update.perfectBlockHx.score= milestones.highscores.perfectBlock;
			milestones.update.perfectBlockHx.date = Date.now();
			milestones.update.perfectBlockHx.sessionID = scores.sessionID;
			milestones.shouldUpdateFirebase = true;
		}

		// checked at end of block -----------------------------
		if( endOfBlock ) {
			console.log(milestones);
			scores.performance = scores.block_score/10;
			console.log(badges.endBlockSum);
			// queque endBlockSum Seq
			resetForNewBlock(scores, badges);
			endOfBlock = false;
		}
	}; //end checkUpdateMilestones


	//--------------------------------------------------
	//called by each rating button press
	var questRating = function(data, scores, milestones, currentWordIdx, badges) {
	  // update coin graphic
	  // update scores
	  // check for end of block
	  // call milestone update

		endOfBlock = false;

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
		}

		// check for end of block
		if (currentWordIdx % 10 == 0 && currentWordIdx != 0) {
			endOfBlock = true;
		}

		checkUpdateMilestones(scores, milestones, endOfBlock, badges);
	}; // end questRating()

	return {
		hello: function() { console.log('Hello from Score!'); },
		initCoinCounter: initCoinCounter,
		initNewHighScores: initNewHighScores,
		initFakeHighScores: initFakeHighScores,
		initMilestones: initMilestones,
		initScores: initScores,
		initBadges: initBadges,
		questRating: questRating,
	};
});
