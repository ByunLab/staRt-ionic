'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial',
	['tutService'] );

	tutorial.config( function($stateProvider, $urlRouterProvider) {

		$urlRouterProvider
			//.when('/tutorial', 'root.tutorial.p01s1')
			//.otherwise('states/root/tutorial/p01s1');

		/* 
			When the application is in a particular state — when a state is "active" — all of its ancestor states are implicitly active as well. Child states will load their templates into their parent's ui-view.
			https://github.com/angular-ui/ui-router/wiki/Nested-States-and-Nested-Views

			~ NOTE ~
			OBVIOUSLY, this is NOT happening
				- perhaps the <ion-nav-view> & <ion-view> don't allow for a 3rd level of nesting??
				- however I did NOT try anything w/ '$routeParams' or '$stateParams' yet -- that may req a service
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
				}
			}
		}) //end root template

		// ============================================================================
		// PAGE 1 The Wave ------------------------------------------------------------

			.state('root.tutorial.p01s1', {
				url: '/p01', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveNone.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s1;
						}
					}
				}
			}) //end p01s1 state def

			.state('root.tutorial.p01s2', {
				url: '/p01s2', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveSingle.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s2;
						}
					}
				}
			}) //end p01s2 state def

			.state('root.tutorial.p01s3', {
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

			.state('root.tutorial.p01s4', {
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

			.state('root.tutorial.p01s5', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveNone.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s5;
						}
					}
				}
			}) //end p01s5 state def

		// =============================================================================
		// PAGE 2 'eee' Sounds ---------------------------------------------------------
			.state('root.tutorial.p02s1', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveSingle.html',
						controller: function($scope){
							$scope.currStep = $scope.p02s1;
						}
					}
				}
			}) //end p02 state def

			.state('root.tutorial.p02s2', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/waveSingle.html',
						controller: function($scope){
							$scope.currStep = $scope.p02s2;
							console.log('p02s2');
						}
					}
				}
			}) //end p02 state def

		// ==========================================================================
		// PAGE 3 'ahh' Sounds ------------------------------------------------------

			.state('root.tutorial.p03s1', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p03s1;
						}
					}
				}
			}) //end p03s1 state def

			.state('root.tutorial.p03s2', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p03s2;
						}
					}
				}
			}) //end p03s2 state def

			.state('root.tutorial.p03s3', {
			url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p03s3;
						}
					}
				}
			}) //end p03s3 state def

		// =============================================================================
		// PAGE 4 'ooo' Sounds (3) ---------------------------------------------------------

			.state('root.tutorial.p04s1', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p04s1;
						}
					}
				}
			}) //end p04s1 state def

			.state('root.tutorial.p04s2', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p04s2;
						}
					}
				}
			}) //end p04s2 state def

			.state('root.tutorial.p04s3', {
			url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p04s3;
						}
					}
				}
			}) //end p04s3 state def


		// ===========================================================================
		// PAGE 5 /r/ Sounds (5) ---------------------------------------------------------

			.state('root.tutorial.p05s1', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s1;
						}
					}
				}
			}) //end p05s1 state def

			.state('root.tutorial.p05s2', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s2;
						}
					}
				}
			}) //end p05s2 state def

			.state('root.tutorial.p05s3', {
			url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s3;
						}
					}
				}
			}) //end p05s3 state def

			.state('root.tutorial.p05s4', {
				url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s4;
						}
					}
				}
			}) //end p05s4 state def

			.state('root.tutorial.p05s5', {
			url: 'tutorial', // this sets the active left-nav tab to tutorial
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/sceneTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s5;
						}
					}
				}
			}) //end p05s5 state def

		// end of subState defs -------------------------------------------

	} ); // end tutorial.config
} )(  );
