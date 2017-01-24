

'use strict';

var practiceDirective = angular.module( 'practiceDirective', [ ] );

practiceDirective.directive( 'practiceDirective', function()
{
	return {

		restrict: 'E',
		controller: 'PracticeDirectiveController',
		scope:
		{
			csv: '=',
			count: "=",
			order: "=",
			probe: "=",
			pauseEvery: "=",
			startPracticeCallback: "&startPracticeCallback",
			endPracticeCallback: "&endPracticeCallback"
		},
		transclude: true,
		templateUrl: 'common-components/practice-directive/practice-directive_template.html',
		// resolve:
		// {
		// 	wordListData: function($http) {
		// 			return $http.get('data/staRt_wordlist.csv');
		// 	}
		// }
	};
} );
