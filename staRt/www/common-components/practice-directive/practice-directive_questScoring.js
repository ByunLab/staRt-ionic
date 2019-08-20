var practiceDirective = angular.module( 'practiceDirective' );
practiceDirective.factory('QuestScore', function QuestScoreFactory() {

/* ---------------------------------------
  Purpose: Handles Quest scoring, milestone, and badging logic
  Specs: See qtScoring.md

  Process:
    on each rating:
    - update data: scores, coin, streaks
    - check for end of block

    on end-of-block
      - check for new highscores
      - trigger badges
      - queque and run end-of-block seq

    on end-of-block seq: TODO
    end-of-quest seq: TODO
--------------------------------------- */

// Constructors ----
// leaderboard or sticker???
// ability to reset Milestone?

function Milestones() {
  return  {
    mgib: 0,
    mgibHx: [],
    hsib: 0,
    hsibHX: [],
    mgiq: 0,
    mgiqHx: [],
    hsiq: 0,
    hsiqHx: [],
    streak: 0,
    streakHx: [],
    perfectBlock: 0,
    perfectBlockHx: [],
    shouldUpdateFirebase: false
  }
}

function SeshScores() {
  return {
    block_display_score: 0, //user val
    block_coins: [[]],
    block_goldCount: 0,
    block_score: 0, // lab val (difficulty score)
    session_score: 0,
    display_score: 0,
    session_coins: {
      gold: 0,
      silver: 0,
      bronze: 0
    },
    streak: 0,
    performance: 0
  }
}


// BADGES ------------------------
var questNewRecord;
var blockNewRecord;
var onARoll;
var perfectBlock;
var incrDiff;
var badgeFlags = {
  questNewRecord: false,
  blockNewRecord: false,
  onARoll: false,
  perfectBlock: false,
  incrDiff: false
}


// DIALOG SEQUENCE QUEQUES ------------------------
var endBlockSum;

var endQuestSum;


// INITS ------------------------
var initFakeHighScores = { // for testing only
  mgib: 5,
  hsib: 19,
  mgiq: 50,
  hsiq: 150,
  streak: 7,
  perfectBlock: 1,
  shouldUpdateFirebase: false
}

var initHighscores = function(highscores) {
  // check if highscores exist?
  highscores = undefined;
  highscores = new Milestones();

  return highscores;
}

var initScores = function(scores, count) {
  // check if scores exist?
  scores = undefined;
  scores = new SeshScores();


  return scores;
}

var initCoinRow = function(count, questCoins) {
  var numStack = count/10;
  for(let i=0; i<numStack; i++) {
    // let rotation =
    let stack = { id: i }
    questCoins.push(stack)
  }
}

// ==============================================
// HELPERS ------------------------

// -- called by questRating() (each trial)  ------
// maps coin value(int) to color or userScore value
var mapCoinColor = {
  3: "gold",
  2: "silver",
  1: "bronze"
}

// for mapping coinColor values to values used for BITS research
var mapLabScore = {
  3: 1,
  2: .5,
  1: 0
}

var updateCoinGraphic = function(data, currentWordIdx) {
  console.log('currentWordIdx: ' + currentWordIdx);

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
}

// -- called by checkUpdateMilestones() (each block)---
var resetForNewBlock = function(scores) {
  scores.block_score = 0;
  scores.block_display_score = 0;
  //scores.block_coins.push([]);
}


// ==============================================
// MAIN PROCS ===================================

var endOfBlock = false;

//called by questRating()
var checkUpdateMilestones = function(scores, highscores, endOfBlock) {
  // every trial
  // end of block
  // reset if block end

  if( endOfBlock ) {
    console.log('endOfBlock TRUE');
    scores.performance = scores.block_score/10;
    console.log('performance: ' + scores.performance);
  }


  if( scores.block_goldCount > highscores.mgib) {
      // trigger newRecord badge
      console.log('NEW RECORD: MOST GOLD IN BLOCK');
      // queque endOfBlock milestone
      // record milestone?
      highscores.mgib = scores.block_goldCount;
      highscores.shouldUpdateFirebase = true;
  };

  if(scores.block_goldCount === 10) {
    // trigger perfectBlock badge
    console.log('PERFECT BLOCK');
    // queque endOfBlock milestone
    // record milestone?
    highscores.perfectBlock++;
    highscores.shouldUpdateFirebase = true;
  }

  if( scores.block_display_score > highscores.hsib) {
      // trigger newRecord badge
      console.log('NEW RECORD: HIGH SCORE IN BLOCK');
      // queque endOfBlock milestone
      // record milestone?
      highscores.hsib = scores.block_display_score;
      highscores.shouldUpdateFirebase = true;
  };

  if( scores.session_coins.gold > highscores.mgiq) {
      // trigger newRecord badge
      console.log('NEW RECORD: MOST GOLD IN QUEST');
      // queque endOfBlock milestone
      // record milestone?
      highscores.mgiq = scores.session_coins.gold;
      highscores.shouldUpdateFirebase = true;
  };

  if( scores.display_score > highscores.hsiq) {
      // trigger newRecord badge
      console.log('NEW RECORD: HIGH SCORE IN QUEST');
      // queque endOfBlock milestone
      // record milestone?
      highscores.hsiq = scores.display_score;
      highscores.shouldUpdateFirebase = true;
  };

  if( scores.streak > highscores.streak ) {
      console.log('NEW RECORD: STREAK');
      // queque endOfBlock milestone
      // record milestone?
      highscores.streak = scores.streak;
      highscores.shouldUpdateFirebase = true;
  };

  if(scores.streak > 3) {
    console.log('ON A ROLL!!');
    // trigger 'on a roll' badge
  }

  if( endOfBlock ) {
    resetForNewBlock(scores);
    endOfBlock = false;
    console.log('endOfBlock false');
  }

} //end checkUpdateMilestones

//called by each rating button press
var questRating = function(data, scores, highscores, currentWordIdx) {
  // update scores
  // check for end of block
  // check for highscores
  // trigger badge

  endOfBlock = false;

  // update the coin
  updateCoinGraphic(data, currentWordIdx);

  // update score data
  scores.display_score += data;
  scores.block_display_score += data;

  scores.block_goldCount = scores.block_gold = scores.block_coins[scores.block_coins.length - 1].filter(function(color) {
    return color === "gold";
  }).length;

  scores.session_coins[mapCoinColor[data]]++;

  // update lab score counters
  scores.block_score += mapLabScore[data]; // labScore
  scores.session_score += mapLabScore[data]; // labScore

  if (mapCoinColor[data] == "gold") {
    scores.streak++;
    // check high score for streak
  } else {
    scores.streak = 0;
  }

  // ---------------------------------------
  // check for end of block
  if (currentWordIdx % 10 == 0 && currentWordIdx != 0) {
      endOfBlock = true;
  }

  checkUpdateMilestones(scores, highscores, endOfBlock);
} // end questRating()

  return {
    hello: function() { console.log('Hello from Score!'); },
    initScores: initScores,
    questRating: questRating,
    initHighscores: initHighscores,
    initFakeHighScores: initFakeHighScores,
    initCoinRow: initCoinRow
  }
});
