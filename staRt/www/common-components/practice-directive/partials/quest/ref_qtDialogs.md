### hmc/qtDialog-endOfBlock-logic (branch)
Develop logic to queue the End of Block Sequence

............................
**on questRating(): _every trial_**
1. coin graphic updated
2. scores counters updated
3. currentWordIdx is checked for end of block
   - scores.endOfBlock (T/F) is set
4. checkUpdateMilestones()

............................
**on checkUpdateMilestones()**
1. if a new milestone is achieved:
   - updateMilestoneRecord()
     _- updates record that is saved to fb on completion of quest_
   - updateMilestoneCard()
     _- sets milestone achievement flags and data in badges.endBlockSum for use in end-of-block_ cards
2. if (scores.endOfBlock)
   - performance (diff level) is calc'd
   - prepEndOfBlock()

............................
**on prepEndOfBlock()**
1. check for is isFinal badges.qtDialog...
2. badges.endBlockSum (milestone data collected during the block) is read into badges.endBlockSeq
   - _badges.endBlockSeq is an array which combines the ms data with the appropriate ms achievement card template_
3. badges.qtDialogTemplate.cardNumber is set
4. advanceEndOfBlock();

............................
**on advanceEndOfBlock()**
1. badges.qtDialog.isVisible = true;
   - _trigger for achievement card dialog seq_
2. on the dialog box is on screen the seq is advanced thru the 'Next' or 'Resume Quest' btns

**TODO:**
- [x] figure out resume-quest proc
- [x] write end-of-block resets

### TODO in practice-directive_controller
See #464 for additional tasks


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

