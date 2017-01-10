'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial',
	[ ] );

	tutorial.config( function( $stateProvider) {
		
		$stateProvider
		// root . this is the parent of all other views
		.state('root.tutorial', {
			url: 'tutorial', // this sets the active left-nav tab to tutorial
			views: {
				'content-view': {
					templateUrl: 'states/root/tutorial/tutorial_template.html',
					controller: 'TutorialController as tutorial'
				}
			}
		}) //end root templateß

			.state('root.tutorial.p01', {
				url: 'tutorial'
				//template: '<h1>Step 1</h1>'
				//templateUrl: 'step1.html',
				//controller: 'TutorialController as tutorial'
			}) //end step1 template

			.state('root.tutorial.p02', {
				url: 'tutorial'
				//templateUrl: 'step2.html'
			}) //end step2 template

			.state('root.tutorial.p03', {
				url: 'tutorial'
				//templateUrl: 'step3.html'
			}) //end step3 template

			.state('root.tutorial.p04', {
				url: 'tutorial'
				//templateUrl: 'step4.html'
			}) //end step4 template

			.state('root.tutorial.p05', {
				url: 'tutorial'
				//templateUrl: 'step5.html'
			}) //end step5 template

	} ); // end tutorial.config
} )(  );
