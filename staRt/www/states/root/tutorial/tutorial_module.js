'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial',
	['tutService'] );

	tutorial.config( function($stateProvider, $urlRouterProvider) {

		$urlRouterProvider
			.when('tutorial', 'tutorial/p01s1')
			.otherwise('states/root/tutorial/p01s1');

		/* 
		When the application is in a particular state — when a state is "active" — all of its ancestor states are implicitly active as well. Child states will load their templates into their parent's ui-view.
		https://github.com/angular-ui/ui-router/wiki/Nested-States-and-Nested-Views

		~ NOTE ~
		OBVIOUSLY, this is NOT happening
		we can probably fix it with ui-routers '$routeParams', but I think that reqs a service 
		*/

		/* note about no components in Ang 1.14 
			- routeParams reqs service which I didn't have time to figure out
		*/

		$stateProvider
		// this is the parent of all other views
		.state('root.tutorial', {
			//abstract: 'true',
			url: 'tutorial', // this sets the active left-nav tab to tutorial
			views: {
				'content-view': {
					templateUrl: 'states/root/tutorial/tutorial_template.html',
					controller: 'TutorialController as tutorial'
				}//,
				// 'pageView': {
				// 	templateUrl: 'states/root/tutorial/sceneTemplates/waveNone.html',
				// 	controller: function($scope){
				// 	$scope.currStep = $scope.p01s1
				// }
			}
		}) //end root template

			.state('root.tutorial.p01s1', {
				url: '/p01s1', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveNone.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s1;
						}
					}
				}
			}) //end p01s1 state def

			.state('root.tutorial.p02', {
				url: '/p02', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveSingle.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s2;
						}
					}
				}
			}) //end p01s2 state def

			.state('root.tutorial.p03', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveSingle.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s3;
						}
					}
				}
			}) //end p01s3 state def

			.state('root.tutorial.p04', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveSingle.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s4;

						}
					}
				}
			}) //end p01s4 state def


			.state('root.tutorial.p05', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveNone.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s5;
							console.log($scope.currStep);
						}
					}
				}
			}) //end p01s5 state def

		// PAGE 2 --------------------------------------------------------------

			// .state('root.tutorial.p05', {
			// 	url: 'tutorial', // this sets the active left-nav tab to tutorial
			// 	views: {
			// 		'pageView': {
			// 			templateUrl: 'states/root/tutorial/sceneTemplates/waveNone.html',
			// 			controller: function($scope){
			// 				$scope.currStep = $scope.p01s5;
			// 				console.log($scope.currStep);
			// 			}
			// 		}
			// 	}
			// }) //end p02 state def


		// PAGE 3 --------------------------------------------------------------
			// .state('root.tutorial.p03', {
			// 	url: 'tutorial', // this sets the active left-nav tab to tutorial
			// 	views: {
			// 		'pageView': {
			// 			templateUrl: 'states/root/tutorial/sceneTemplates/waveSingle.html',
			// 			controller: function($scope){
			// 				$scope.currStep = $scope.p01s3;

			// 			}
			// 		}
			// 	}
			// }) //end p01s3 state def






			// -------------------------------------------

	} ); // end tutorial.config
} )(  );
