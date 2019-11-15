var toolbarService = angular.module('toolbarService', []);

toolbarService.factory('ToolbarService', function()
{

	var tbArray;

	var tbBtns = {
		back: {
			icon: './img/icons/line/back.svg',
			title: 'Back',
			action: 'tbBack()'
		},
		stop: {
			icon: './img/icons/line/anchor.svg',
			title: 'Stop',
			action: 'tbStop()'
		},
		help: {
			icon: './img/icons/line/lifesaver.svg',
			title: 'Help',
			action: 'tbHelp()'
		}
	};

	var initTB_freePlay = function() {
		tbArray = [];
		tbArray.push( tbBtns.help);
		console.log('init toolbar for freePlay');
		return tbArray;
	};

	var initTB_questBF = function() {
		tbArray = [];
		tbArray.push( tbBtns.stop );
		tbArray.push( tbBtns.help );
		tbArray[tbArray.length -1].helpMsg = 'HELP clicked for questBF';
		console.log('init toolbar for questBF');
		return tbArray;
	};

	var initTB_questNoBF = function() {
		tbArray = [];
		tbArray.push( tbBtns.stop );
		tbArray.push( tbBtns.help );
		tbArray[tbArray.length -1].helpMsg = 'HELP clicked for questNoBF';
		console.log('init toolbar for questNoBF');
		return tbArray;
	};

	var initTB_quizSyll = function() {
		tbArray = [];
		tbArray.push( tbBtns.stop );
		tbArray.push( tbBtns.help );
		tbArray[tbArray.length -1].helpMsg = 'HELP clicked for qzSyll';
		console.log('init toolbar for quizSyll');
		return tbArray;
	};

	var initTB_quizSWQ = function() {
		tbArray = [];
		tbArray.push( tbBtns.stop );
		tbArray.push( tbBtns.help );
		tbArray[tbArray.length -1].helpMsg = 'HELP clicked for quizSWQ';
		console.log('init toolbar for quizSWQ');
		return tbArray;
	};

	var initTB_quizLWQ = function() {
		tbArray = [];
		tbArray.push( tbBtns.stop );
		tbArray.push( tbBtns.help );
		tbArray[tbArray.length -1].helpMsg = 'HELP clicked for quizLWQ';
		console.log('init toolbar for quizLWQ');
		return tbArray;
	};

	var practice_initTB = function( probe, type, count, forceWaveHidden )
	{
		if(probe) { // quizzes
			if(type === 'Syllable') { //qzSyll
				initTB_quizSyll();
			} else { // word quizzes
				(count < 30) ?  initTB_quizSWQ() : initTB_quizLWQ();
			}
		} else if(!probe) { // quests
			(forceWaveHidden) ? initTB_questNoBF() : initTB_questBF();
		} //end if !probe
	}; // end practice_initTB

	// SERVICE EXPORT ------------------------------------------
	return {
		logMe: function() { console.log('toolbarService works!'); },
		initTB_freePlay: initTB_freePlay,
		practice_initTB: practice_initTB
	}; //end return

});
