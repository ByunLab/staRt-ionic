var practiceDirective = angular.module( 'practiceDirective' );
practiceDirective.factory('Score', function ScoreFactory() {

// notes are in qtScoring.md

// badges
var newRecord;
var onARoll;
var perfectBlock;
var incrDiff;


var initFakeHighScores = { // for testing only
  mgib: 5,
  hsib: 19,
  mgiq: 50,
  hsiq: 150
}

var initHighscores = {
  mgib: 0,
  hsib: 0,
  mgiq: 0,
  hsiq: 0
}

var initScores = function(scores) {
    scores = undefined;
    scores = {
      block_score: 0,
      session_score: 0,
      display_score: 0,
      block_coins: [[]],
      session_coins: {
        gold: 0,
        silver: 0,
        bronze: 0
      },
      streak: 0,
    }
    return scores;
}

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

// ==============================================================
//incomingRating: incomingRating,
var questRating = function(data, scores) {
  //console.log(scores);
  console.log ('data: ' + data);

  // update for graphics
  scores.block_coins[scores.block_coins.length - 1].push(mapCoinColor[data]);

  scores.display_score += data;

  // update lab score counters
  scores.block_score += mapLabScore[data];
  scores.session_score += mapLabScore[data];

  // update milestone counters
  scores.session_coins[mapCoinColor[data]]++;

  if (mapCoinColor[data] == "gold") {
    scores.streak++;
    // check high score for streak
  } else {
    scores.streak = 0;
  }


} // end questRating

//updateHighscores: updateHighscores
// var updateHighscores = function(scores, highscores) {
//
// }

  return {
    hello: function() { console.log('Hello from Score!'); },
    initScores: initScores,
    questRating: questRating,
    initHighscores: initHighscores,
    initFakeHighScores: initFakeHighScores
  }
});
