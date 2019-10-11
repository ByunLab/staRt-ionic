# QUEST SCORING

**$scope.scores object holds the quest's in-game state.**   
Milestones, Badges, and AdaptDifficulty, and session data processes are checked against values in $scope.scores.

**creation:**
* created at the beginning of each new quest
* If the activity is resumed from a saved on-protocol session, the $scope.scores will be recreated from fb's saved data.

***

## Quest Scoring Scales:

### userScale (int) |  colorScale (str) |  labScale (float/decimal)
  3 | 'gold'   | 1.0  
  2 | 'silver' | 0.5  
  1 | 'bronze' | 0.0  
.  
**user scale:**
* same as data value from rating button
* used for in-game scoring and displaying screen info (score, badges, dialogs, etc)
* used in saved highscore and progress data read from firebase. Ex: quest/sandbank or profiles/progress    

**lab scale:**
* used for lab research
* saved to research server csv
* used by Adaptive Difficulty feature

**color scale:**
* used by counter-graphics logic


****
// TEMPLATE
**scores.property: init value**
* **purpose:** description
* **scale:** user (int) | color (str) | lab (float)
* **update:** each-trial | end-of-block | end-of-quest
* **savedBy:** if-highscore | sessionStat | ratingsData
* **savedBy:** if-highscore, else ratingsData
* **used by:**
  * graphics
  * midsession-resume
  * badges: questNewRecord, blockNewRecord, onARoll
  * milestones: mgib, hsib, mgiq, hsiq, streak, perfectBlock, increaseDiff
  * #undo
  * sessionStats

  ***
  ## Notes on $scope.scores Data

  > ### scores.property: init value
  > * **purpose:** description
  > * **scale:** user (int) | color (str) | lab (float)
  > * **update:** each-trial | end-of-block | end-of-quest
  > * **savedAs:** if-highscore | sessionStat | ratingsData
  > * **used by:** features that req this value

  ### scores.display_score: 0
  * **purpose:** int. sum of ratings data per quest
  * **scale:** user (int)
  * **update:** every trial
  * **used by:**
    * graphics
    * badges: questNewRecord, blockNewRecord
    * milestones: hsib, hsiq
    * #undo

  ### scores.block_display_score: 0
  * **purpose:** sum of ratings data per block
  * **scale:** user (int)
  * **update:** every trial
  * **savedBy:** if-highscore, else ratingsData
  * **used by:**
    * badges: blockNewRecord
    * milestones: hsib
    * #undo

  ### scores.block_coins: [[]]
  Should not currently be in use - backstop for past implementation method. If all goes well in 3.1.0, we can remove all refs it it.
  <!-- * **purpose:** array of arrays of 10 which hold the coin colors for each block -->

  ### scores.block_goldCount: 0
  * **scale:** in: color (str), out: user (int)

  ### scores.block_score: 0
  * **scale:** lab (float)

  ### scores.session_score: 0
  * **scale:** lab (float)

  ### scores.session_coins: { gold: 0, silver: 0, bronze: 0 }
  * **scale:** in: color (str), out: user (int)
  <!-- obj holding the number of each type of coin (gold, silver, bronze) earned in session -->

  ### scores.streak: 0
  * **scale:** in: color (str), out: user (int)

  ### scores.performance: 0.0 // req'd for difficulty score
  * **scale:** lab (float)


  --------------------
  badges:
    questNewRecord
    blockNewRecord
    onARoll

  milestones:
    mgib: 0,
    hsib: 0,
    mgiq: 0,
    hsiq: 0,
    streak: 0,
    perfectBlock: 0,
    increaseDiff

  sessionStats
  graphics
  midsession-resume
  badges:
  milestones:
  #undo




-------------------
MILESTONES & HIGHSCORES
In general, this will be read from the users Firebase data.
If new acct, {} is created w/ initHighscores()
  notes:
    "Most Gold" milestones are a measure of accuracy that will be meaningful to SLPs
    "High Score" -- self-explanatory

  highscores.mgib (Most Gold in Block): int.
    count of golds earned (1 gold = 1)

  highscores.hsib (High Score in Block): int.
    in userScore or coinColor scale

  highscores.mgiq (Most Gold in Quest): int.
    count of golds earned (1 gold = 1)

  highscores.hsiq (High Score in Quest): int.
    in userScore or coinColor scale


-------------------
BADGES & GRAPHICS
