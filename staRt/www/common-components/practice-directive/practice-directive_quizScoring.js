var practiceDirective = angular.module( 'practiceDirective' );
practiceDirective.factory('QuizScore', function QuizScoreFactory() {

	/* ---------------------------------------
  Purpose: Handles Quiz scoring and counter updates

  Process:
    on each rating:
    - update data: scores & item

    on end-of-quiz seq: TODO
--------------------------------------- */

	var rateGold = function( step ) {
		step.addClass('gold');
		//$scope.score.gold += 1;
		//$scope.update();
	};
	var rateSilver = function( step ) {
		step.addClass('silver');
		//$scope.score.silver += 1;
		//$scope.update();
	};
	var rateBronze = function( step ) {
		step.addClass('bronze');
		//$scope.score.bronze += 1;
		//$scope.update();
	};

	var graphicStepSelector = function(wordIdx, qzType, cb) {

		console.log('WORD INDEX: ' + wordIdx);

		var eleID = '#' + qzType + wordIdx;
		var step = angular.element( document.querySelector( eleID ) );
		console.log(step);
		step.removeClass('cls-2 cls-3 dirtyWhite dirtyBlue');

		cb( step ); //calls rateColor()
	};


	function quizRating(data, qzType, currentWordIdx, qzGraphicsMode) {

		var wordIdx = currentWordIdx -1;

		if(qzGraphicsMode) {
			switch(data) {
			case 3:
				graphicStepSelector( wordIdx, qzType, rateGold );
				break;
			case 2:
				graphicStepSelector( wordIdx, qzType, rateSilver );
				break;
			case 1:
				graphicStepSelector( wordIdx, qzType, rateBronze );
				break;
			}
		}
		//console.log('quizRating');
		//console.log(qzType + ' Word: ' + wordIdx + ', rated ' + data);
	}

	return {
		hello: function() { console.log('Hello from Quiz Score!'); },
		quizRating: quizRating
	};
});
