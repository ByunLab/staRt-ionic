'use strict';

var lpcDirective = angular.module( 'lpcDirective',
	[
		'ngResize'
	]);

lpcDirective.config(['resizeProvider', function(resizeProvider){
	resizeProvider.throttle = 100;
}]);

lpcDirective.directive( 'lpcDirective', function()
{
	return {

		restrict: 'E',
		controller: 'LpcDirectiveController',
		scope:
		{
			active: '=',
			probe: '=',
			slider: '=',
			reset: '=',
			rate: '=',
			hideBtn: '=',
			waveHidden: '=',
			tutorial: '=',
			beach: '='
		},
		templateUrl: 'common-components/lpc-directive/lpc-directive_template.html'
	};
} );
