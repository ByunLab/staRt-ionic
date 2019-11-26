

'use strict';

var practiceDirective = angular.module( 'practiceDirective', [ 'firebaseService', 'toolbarService' ] );



practiceDirective.directive( 'practiceDirective', function()
{
	return {

		restrict: 'E',
		controller: 'PracticeDirectiveController',
		scope:
		{
			beginOnLoad: '=',
			csvs: '=',
			count: '=',
			forceWaveHidden: '=',
			order: '=',
			probe: '=',
			pauseEvery: '=',
			smallFont: '=',
			suppressStartButton: '=',
			tinyFont: '=',
			type: '='
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
