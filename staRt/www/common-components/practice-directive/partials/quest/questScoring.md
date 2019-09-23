SCORE COUNTERS
{} created w/ initScores()

  scores.block_coins: int.
  scores.session_score: int.
  scores.display_score: int.

  scores.block_coins: [[]]
    arrays of 10 which hold the coin colors for each block

  scores.session_coins: {}
    obj holding the number of each type of coin (gold, silver, bronze) earned in session

  scores.streak: int.
    counts consecutive golds


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
