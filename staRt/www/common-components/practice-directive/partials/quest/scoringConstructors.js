var practiceDirective = angular.module( 'practiceDirective' );

practiceDirective.factory('ScoreConstructors', function ScoreConstructorsFactory() {




	// used if an existing fb profile does not already have
	// a highscoreQuest object
	function NewQuestHighScores() { // for new accts
		return  {
			mgibHx: [ {score: 0, date: Date.now()} ],
			hsibHx: [ {score: 10, date: Date.now()} ],
			mgiqHx: [ {score: 0, date: Date.now()} ],
			hsiqHx: [ {score: 20, date: Date.now()} ],
			streakHx: [ {score: 0, date: Date.now()} ],
			perfectBlockHx: [ {score: 0, date: Date.now()} ],
		};
	}

	// handles state for active profile's highscores and milestone thresholds
	function Milestones() {
		return  {
			// highscores: holds current in-game state of highscores
			// created from firebase highscore data
			highscores: {
				mgib: 0,
				hsib: 0,
				mgiq: 0,
				hsiq: 0,
				streak: 0,
				perfectBlock: 0,
			},
			// defines minimum thresholds for badges and milestone progress cards
			scoreMins: {
				mgib: 1,
				hsib: 10,
				mgiq: 4,
				hsiq: 20,
				streak: 1,
				perfectBlock: 0,
			},
			// display: holds all the data (text, graphics, etc) for the sandbank display
			// it is created from the Sandbank constructor and updated from this.highscores
			display: undefined,
			// update: if a milestone is achieved during a Quest, this object is updated to hold highscore data to be push to firebase at the end of the quest
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
	// stickers are the On-A-Roll and New-Record in-game graphics
	function Stickers() {
		return ({
			onARoll: {
				flag: false,
				trials: 0,
				visible: false
			},
			newRecord: {
				flag: false,
				trials: 0,
				mgiq: false,
				hsiq: false,
				visible: false
			},
		});
	} // end stickers constructor

	//handles state for Badges and Milestone Dialog Sequences
	function Badges() {
		return {
			onARoll: {
				flag: false,
				trials: 0,
				visible: false
			},
			newRecord: {
				flag: false,
				trials: 0,
				mgiq: false,
				hsiq: false,
				visible: false
			},
			cardsBlockEnd: {
				mgib: {
					template: 'achievement',
					title: 'Most Gold in Block!',
					imgClass: 'mgib',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				hsib: {
					template: 'achievement',
					title: 'High Score in Block!',
					imgClass: 'hsib',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				streak: {
					template: 'achievement',
					title: 'Gold Streak!',
					imgClass: 'streak',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				perfectBlock: {
					template: 'achievement',
					title: 'Perfect Block!',
					imgClass: 'perfectBlock',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				incrDiff: {
					template: 'note',
					title: 'Increasing Difficulty!',
					imgClass: 'incrDiff',
					bodyText: 'Watch for new words.',
					imgUrl: '',
					btnText: 'Next',
				},
				feedback: {
					template: 'note',
					title: 'Checkpoint',
					subtitle: '',
					imgClass: 'feedback',
					imgUrl: '',
					bodyText: 'Please provide qualitative feedback on the participant\'s performance over the last ten trials.',
					btnText: 'See Scores',
				},
				progSum: {
					template: 'progSum',
					title: 'Progress Summary',
					subtitle: '',
					imgClass: '',
					gold: 0,
					silver: 0,
					bronze: 0,
					btnText: 'Resume',
				},
			},
			cardsQuestEnd: {
				mgiq: {
					flag: false,
					template: 'achievement',
					title: 'Most Gold in Quest!',
					imgClass: 'mgiq',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				hsiq: {
					flag: false,
					template: 'achievement',
					title: 'High Score in Quest!',
					imgClass: 'hsiq',
					count: 0,
					imgUrl: '',
					btnText: 'Next',
				},
				endSum: {
					flag: true,
					template: 'endSum',
					title: 'Quest Complete!',
					imgClass: 'hooray',
					gold: 0,
					silver: 0,
					bronze: 0,
					btnText: 'See Final Score',
				},
				finalScore: {
					flag: true,
					template: 'finalScore',
					title: 'Quest Complete!',
					imgClass: 'hooray',
					subtitle: '',
					count: 0,
					btnText: 'Close',
				},
			},
			cardFlags: [], // flagged when a blockEnd milestone is achieved
			cardSeq: [],
			card: {}, // Holds the content to be displayed in the html template from badges.cardSeq[badges.cardIndex]
			cardIndex: -1,
			qtDialog: {
				isVisible: false, // is the Dialog Box Visible
				isBlockEnd: false, // used for Block-End seq
				isFinal: false // used for Quest-End sequence
			},
			qtDialogTemplate: { // used by html templates
				achievement: false, // used by end-of-block 'New Record' card
				note: false, // used by Qualitative Feedback Reminder note
				progSum: false, // used by "Progress Summary" card
				endSum: false, // used by 'Quest Complete Summary'
				finalScore: false, // used by 'Final Score'
			},
			// COPIED FROM PROFILE SETTINGS DATA AT INIT
			// badgesOn: true,
			// cardsOn: true,
			// remindersOn: true,
		};
	} // end Badges

	// holds static data necessary to create Sandbank graphics
	function Sandbank() {
		return {
			hsib: {
				title: 'Most Points in Block',
				achieved: false,
				imgClass: 'hsib',
				min:10,
				highlightTest: 3,
				emptyText: 'Earn <span class="bold">10 points in a single block</span> to unlock this achievement.',
				score: 0, //should be same as milestones.highscores
				dateStr: '', //
				currentText: 'current block',
				currentValue: '{{scores.block_display_score}}',
				unit: 'points',
				highlight: false,
			},
			mgib: {
				title: 'Most Gold in Block',
				achieved: false,
				imgClass: 'mgib',
				min:0,
				highlightTest: 2,
				emptyText: 'Earn <span class="bold">a gold coin</span> to unlock this achievement.',
				score: 0,
				dateStr: '',
				currentText: 'current block',
				currentValue: '0',
				unit: 'coins',
				highlight: false,
			},
			streak: {
				title: 'Gold Streak',
				achieved: false,
				imgClass: 'streak',
				min:1,
				highlightTest: 1,
				emptyText: 'Earn <span class="bold">2 consecutive gold coins</span> to unlock this achievement.',
				score: 0,
				scoreClass: '',
				scoreText: '',
				scoreTextClass: '',
				dateStr: '',
				currentText: 'current streak',
				currentValue: '0',
				unit: 'coins',
				highlight: false,
			},
			hsiq: {
				title: 'Most Points in Quest',
				achieved: false,
				imgClass: 'hsiq',
				min: 20,
				highlightTest: 10,
				emptyText: 'Earn <span class="bold">20 points</span> to unlock this achievement.',
				score: 0,
				dateStr: '',
				currentText: 'current quest',
				currentValue: '0',
				unit: 'points',
				highlight: false,
			},
			mgiq: {
				title: 'Most Gold in Quest',
				achieved: false,
				imgClass: 'mgiq',
				min:0,
				highlightTest: 5,
				emptyText: 'Earn <span class="bold">a gold coin</span> to unlock this achievement.',
				score: 0,
				dateStr: '',
				currentText: 'current quest',
				currentValue: '0',
				unit: 'coins',
				highlight: false,
			},
			perfectBlock: {
				title: 'Perfect Block',
				achieved: false,
				imgClass: 'perfectBlock',
				min: 0,
				highlightTest: 1,
				emptyText: 'Earn <span class="bold">10 gold coins in a block</span> to unlock this achievement.',
				score: 0,
				scoreClass: 'score-perfectB',
				scoreText: 'times',
				scoreTextClass: 'perfectB-text',
				dateStr: '',
				currentText: 'current quest: ',
				currentValue: '0',
				unit: ' blocks',
				highlight: false,
			},
		};
	} // end sandbank constructor

	return {
		NewQuestHighScores: NewQuestHighScores,
		Milestones: Milestones,
		Badges: Badges,
		//Cards: Cards
		Sandbank: Sandbank,
		Stickers: Stickers,
	};
});

// // EXPORTS =======================================
// var lpcDirective = angular.module('lpcDirective');
// lpcDirective.value('Mesh', new Mesh());