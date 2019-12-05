'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial',
		['ui.router'] );

	tutorial.config( function($stateProvider, $urlRouterProvider) {

		$stateProvider
		// this is the parent of all other views
			.state('root.tutorial', {
				url: 'tutorial',
				views:
			{
				'content-view':
				{
					templateUrl: 'states/root/tutorial/tutorial_template.html',
					controller: 'TutorialController as tutorial'
				}
			},
				resolve:
			{
				firstPanelData:  function($http)
				{
				// $http returns a promise for the url data
					return $http.get('states/root/tutorial/tutorialData/p01data.json');
				}
			}
			}) //end root template

		// ============================================================================
		// STATES & SUBPAGE CONTROLLERS
		/*
				NOTES:
				I'm using the state urls as reference during dev.
				They currently are not serving any functional purpose (like routing).

				In most angular apps these would be 'components;' however, the component arch doesn't seem to work in our setup.
				For examples of non-component project structure (i.e. stuff that will work here), reference apps using Angular 1.4* or below.
			*/


		// PAGE 1 The Wave --- (5 active scenes, 1 inactive) ---------------------------

			.state('root.tutorial.p01s1', {
				url: '/p01s1',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/noWave.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s1;
							$scope.updateParentScope($scope.currStep);
							//$scope.setActivePage($scope.currStep.page);
							// I think this is running before the setActivePage obj is created, so I moved it to p01s2. (fortunately, the ui-router will set 'active' for p01s1 (1st sref in page set)
						}
					}
				}
			}) //end p01s1 state def

			.state('root.tutorial.p01s2', {
				url: '/p01s2',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s2;
							$scope.updateParentScope($scope.currStep);
							$scope.setActivePage($scope.currStep.page);

						}
					}
				}
			}) //end p01s2 state def

			.state('root.tutorial.p01s3', {
				url: '/p01s3',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope) {
							$scope.currStep = $scope.p01s3;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p01s3 state def

			.state('root.tutorial.p01s4', {
				url: '/p01s4',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s4;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p01s4 state def

			.state('root.tutorial.p01s5', {
				url: '/p01s5',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/noWave.html',
						controller: function($scope){
							$scope.currStep = $scope.p01s5;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p01s5 state def

		// =============================================================================
		// PAGE 2 'eee' Sounds ---------------------------------------------------------
			.state('root.tutorial.p02s1', {
				url: '/p02s1',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p02s1;
							$scope.updateParentScope($scope.currStep);
							$scope.setActivePage($scope.currStep.page);
						}
					}
				}
			}) //end p02 state def

			.state('root.tutorial.p02s2', {
				url: '/p02s2',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p02s2;
							//$scope.recordLastScene();
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p02 state def

		// ==========================================================================
		// PAGE 3 'ahh' Sounds ------------------------------------------------------

			.state('root.tutorial.p03s1', {
				url: '/p03s1',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p03s1;
							$scope.updateParentScope($scope.currStep);
							$scope.setActivePage($scope.currStep.page);
						}
					}
				}
			}) //end p03s1 state def

			.state('root.tutorial.p03s2', {
				url: '/p03s2',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p03s2;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p03s2 state def

			.state('root.tutorial.p03s3', {
				url: '/p03s3',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p03s3;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p03s3 state def

		// =============================================================================
		// PAGE 4 'ooo' Sounds (3) ---------------------------------------------------------

			.state('root.tutorial.p04s1', {
				url: '/p04s1',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p04s1;
							$scope.updateParentScope($scope.currStep);
							$scope.setActivePage($scope.currStep.page);
						}
					}
				}
			}) //end p04s1 state def

			.state('root.tutorial.p04s2', {
				url: '/p04s2',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p04s2;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p04s2 state def

			// NOT CURRENTLY IN USE
			.state('root.tutorial.p04s3', {
				url: '/p04s3',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/imgTemplate.html',
						controller: function($scope){
							$scope.currStep = $scope.p04s3;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p04s3 state def


		// ===========================================================================
		// PAGE 5 /r/ Sounds (5) ---------------------------------------------------------

			.state('root.tutorial.p05s1', {
				url: '/p05s1',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s1;
							$scope.updateParentScope($scope.currStep);
							$scope.setActivePage($scope.currStep.page);
						}
					}
				}
			}) //end p05s1 state def

			.state('root.tutorial.p05s2', {
				url: '/p05s2',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s2;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p05s2 state def

			.state('root.tutorial.p05s3', {
				url: '/p05s3',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s3;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p05s3 state def

			.state('root.tutorial.p05s4', {
				url: '/p05s4',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s4;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p05s4 state def

			.state('root.tutorial.p05s5', {
				url: '/p05s5',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s5;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}) //end p05s5 state def

			.state('root.tutorial.p05s6', {
				url: '/p05s6',
				views: {
					'pageView': {
						templateUrl: 'states/root/tutorial/partialTemplates/default.html',
						controller: function($scope){
							$scope.currStep = $scope.p05s6;
							$scope.updateParentScope($scope.currStep);
						}
					}
				}
			}); //end p05s6 state def

		// end of subState defs -------------------------------------------

	} ); // end tutorial.config
} )(  );
