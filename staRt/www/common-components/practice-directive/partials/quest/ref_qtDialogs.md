### hmc/qtDialog-endOfBlock-logic (branch)
<<<<<<< HEAD
=======
Develop logic to queue the End of Block Sequence
>>>>>>> 2bfe60bd3516668d98700b515487cea8ccb1da3c
last update: 12/06/19

............................
**on questRating(): _every trial_**
_purpose: update the $scope.scores_
1. coin graphic updated
2. scores counters updated
3. currentWordIdx is checked for end of block
   - scores.endOfBlock (T/F) is set
4. checkUpdateMilestones()

............................
**on checkUpdateMilestones() _every trial_**
_purpose: update the $scope.milestones & $scope.badges_
1. if a new milestone is achieved:
    - display an in-game badge, if appropriate
   - updateMilestoneRecord()
     _- updates record that is saved to fb on completion of quest_
   - updateMilestoneCard()
<<<<<<< HEAD
     - sets milestone achievement flags and data in $scope.badges for use in end-of-block cards
=======
     _- sets milestone achievement flags and data in $scope.badges for use in end-of-block cards
>>>>>>> 2bfe60bd3516668d98700b515487cea8ccb1da3c
2. if (scores.endOfBlock)
   - performance (diff level) is calc'd #TODO
   - prepare progSum or endSum card data
   - prepEndOfBlock()

............................
**on prepEndOfBlock()**
_purpose: create an array of card templates based on the milestones achieved in the block and badges.qtDialog status_
1. card templates and milestone data for each flagged milestone achievement is read into badges.cardSeq
2. end cards ('feedback', score summaries, etc) are added to badges.cardSeq
3. nextCard();

............................
**on nextCard()**
_called by checkUpdateMilestones() or $scope.nextCard()_
_purpose: controls card display and user input_
1. populates badges.card object (used by html) with correct card in sequence
2. badges.qtDialog.isVisible = true;
3. on the dialog box is on screen the seq is advanced thru the 'Next' or 'Resume Quest' btns



///////////////////////////////////////////////////////////////

# FIELDS FOR QT-DIALOG TEMPLATE BY TYPE:
Please keep this note here until development on the gamification suite is complete.

## badges.endBlockDisplay Objects (template data)

    {
        template: achievement,
        title: '',
        subtitle: '',
        count: '',
        imgUrl: '',
        btnText: 'Next',
        btnFn: 'dialogNext()'
    },

    {
        template: note,
        title: '',
        subtitle: '',
        imgUrl: '',
        text: ''
        btnText: 'See Scores'
        btnFn: dialogNext();
    },

    {
        template: progSum,
        title: '',
        subtitle: '',
        gold: 0,
        goldCoin: 'image url',
        silver: 0,
        silverCoin: 'image url',
        bronze: 0,
        bronzeCoin: 'image url',
        btnText: 'Resume Quest',
        btnFn: 'dialogResume()',
    },

    {
        template: endSum,
        title: 'Quest Complete!',
        subtitle: '',
        gold: 0,
        goldCoin: 'image url',
        silver: 0,
        silverCoin: 'image url',
        bronze: 0,
        bronzeCoin: 'image url',
        btnText: 'See Score',
        btnFn: 'dialogNext()'
    },

    {
        template: finalScore,
        title: 'Quest Complete!',
        subtitle: '',
        count: 0,
        btnText: 'Close',
        btnFn: 'dialogClose()'
    }

