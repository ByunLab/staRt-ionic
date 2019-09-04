var practiceDirective = angular.module( 'practiceDirective' );
practiceDirective.factory('QuestScore', function QuestScoreFactory() {

/* ---------------------------------------
  Purpose: Handles Quest scoring, milestone, and badging logic
  Specs: See qtScoring.md, altho this may be out-of-date

  Process:
    on each rating:
    - update data: scores, coin, streaks
    - check for new highscores, which triggers badges
    - check for end of block

    on end-of-block
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
// var questNewRecord;
// var blockNewRecord;
// var onARoll;
// var perfectBlock;
// var incrDiff;


// INITS ------------------------
var initCoinCounter = function(count, questCoins){
  var numStack = count/10;
  for(let i=0; i<numStack; i++) {
    // let rotation =
    let stack = { id: i }
    questCoins.push(stack)
  }
}

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

var initScores = function() {
  // check if scores exist?
  scores = undefined;
  scores = new SeshScores();

  return scores;
}

var initBadges = function(badges) {
  badges = undefined;
  // perfectBlock: false,
  // incrDiff: false
  badges = {
    flags: {
      questNewRecord: false,
      blockNewRecord: true,
      onARoll: false,
    },
    endBlockSum: {
      mgib: false,
      mgibCount: 0,
      hsib: false,
      hsibCount: 0,
      streak: false,
      streakCount: 0,
    },
    endQuestSum: []
  }
  return badges;
}


// ==============================================
// HELPERS ------------------------

// -- called by questRating() (each trial)  ------
// maps coin value to color or userScore value
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
}

// -- called by checkUpdateMilestones() (each block)---
var resetForNewBlock = function(scores, badges) {
  scores.block_score = 0;
  scores.block_display_score = 0;
  badges.blockNewRecord = false;
  badges.endBlockSum.mgib = false;
  badges.endBlockSum.mgibCount = 0;
  badges.endBlockSum.hsib = false;
  badges.endBlockSum.hsibCount = 0;
  badges.endBlockSum.streak = false;
}

/*
var clearSetBadges = function(badges, key) {
  for (var key in badges) {
  	if (badges.hasOwnProperty(key)) {
  		badges[key] = false;
  	}
  }
  badges[key] = true;

  return badges;
}
*/


// ==============================================
// MAIN PROCS ===================================

var endOfBlock = false;

//called by questRating()
var checkUpdateMilestones = function(scores, highscores, endOfBlock, badges) {

  // checked every trial -----------------------------
  if( scores.block_goldCount > highscores.mgib) {
    //clearSetBadges(badges, 'blockNewRecord')
    badges.flags.onARoll = false;
    badges.flags.blockNewRecord = true;
    console.log('NEW RECORD: MOST GOLD IN BLOCK');

    badges.endBlockSum.mgib = true;
    badges.endBlockSum.mgibCount = scores.block_goldCount;

    highscores.mgib = scores.block_goldCount;
    highscores.shouldUpdateFirebase = true;
  };

  if( scores.block_display_score > highscores.hsib) {
    //clearSetBadges(badges, 'blockNewRecord')
    badges.flags.onARoll = false;
    badges.flags.blockNewRecord = true;
    console.log('NEW RECORD: HIGH SCORE IN BLOCK');

    badges.endBlockSum.hsib = true;
    badges.endBlockSum.hsibCount = scores.block_display_score;

    highscores.hsib = scores.block_display_score;
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

  if( scores.session_coins.gold > highscores.mgiq) {
    // trigger newRecord badge
    console.log('NEW RECORD: MOST GOLD IN QUEST');
    // queque endOfBlock milestone
    // record milestone?
    highscores.mgiq = scores.session_coins.gold;
    highscores.shouldUpdateFirebase = true;
  };

  if(scores.streak > 3) {
    badges.onARoll = true;
    console.log('ON A ROLL!!');
  } else {
    badges.onARoll = false;
  }
  if( scores.streak > highscores.streak ) {
    badges.flags.onARoll = false;
    badges.flags.blockNewRecord = true;
    console.log('NEW RECORD: STREAK');
    badges.endBlockSum.streak = true;
    badges.endBlockSum.streakCount = scores.streak;

    // record milestone?
    highscores.streak = scores.streak;
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

  // checked at end of block -----------------------------
  if( endOfBlock ) {
    scores.performance = scores.block_score/10;
    console.log(badges.endBlockSum);
    // queque endBlockSum Seq
    resetForNewBlock(scores, badges);
    endOfBlock = false;
  }
} //end checkUpdateMilestones


//--------------------------------------------------
//called by each rating button press
var questRating = function(data, scores, highscores, currentWordIdx, badges) {
  /*
  update coin graphic
  update scores
  check for end of block
  call milestone update
  */
  console.log('quest rating called');
  console.log(data);
  console.log(currentWordIdx);


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
  } else {
    scores.streak = 0;
  }

  // check for end of block
  if (currentWordIdx % 10 == 0 && currentWordIdx != 0) {
      endOfBlock = true;
  }

  checkUpdateMilestones(scores, highscores, endOfBlock, badges);
} // end questRating()

  return {
    hello: function() { console.log('Hello from Score!'); },
    initCoinCounter: initCoinCounter,
    initScores: initScores,
    initBadges: initBadges,
    questRating: questRating,
    initHighscores: initHighscores,
    initFakeHighScores: initFakeHighScores
  }
});
