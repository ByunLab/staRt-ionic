'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial' );

	tutorial.controller('TutorialController',
		function($scope, $timeout, $localForage, StartUIState, NotifyingService, $rootScope, $state, $http, $stateParams, firstPanelData)
		{

			// =============================================================================
			// GET DATA & ASSETS ---------------------------

			// Count the number of tutorial steps, so we know when we're done
			$scope.totalSteps = 0;

			// Fetch first panel data and make sure it's ready for the view
			$scope.p01data = firstPanelData.data;
			$scope.totalSteps++;
			for (var i = 0; i < $scope.p01data.length; i++)
			{
				$scope['p01s' + (i + 1)] = $scope.p01data[i];
			}

			//get data for tutorial_template.html
			$http.get('states/root/tutorial/tutorialData/coinData.json').success(function(data){
				$scope.coinData = data;
				$scope.makeActivePageObj();
				$scope.totalSteps++;
			});

			$http.get('states/root/tutorial/tutorialData/p02data.json').success(function(data)
			{
				$scope.p02data = data;
				$scope.p02s1 = $scope.p02data[0];
				$scope.p02s2 = $scope.p02data[1];
				$scope.totalSteps++;
			});

			$http.get('states/root/tutorial/tutorialData/p03data.json').success(function(data)
			{
				$scope.p03data = data;
				$scope.p03s1 = $scope.p03data[0];
				$scope.p03s2 = $scope.p03data[1];
				$scope.p03s3 = $scope.p03data[2];
				$scope.totalSteps++;
			});

			$http.get('states/root/tutorial/tutorialData/p04data.json').success(function(data)
			{
				$scope.p04data = data;
				$scope.p04s1 = $scope.p04data[0];
				$scope.p04s2 = $scope.p04data[1];
				$scope.p04s3 = $scope.p04data[2];
				$scope.totalSteps++;
			});

			$http.get('states/root/tutorial/tutorialData/p05data.json').success(function(data)
			{
				$scope.p05data = data;
				$scope.p05s1 = $scope.p05data[0];
				$scope.p05s2 = $scope.p05data[1];
				$scope.p05s3 = $scope.p05data[2];
				$scope.p05s4 = $scope.p05data[3];
				$scope.p05s5 = $scope.p05data[4];
				$scope.p05s6 = $scope.p05data[5];
				$scope.totalSteps++;
			});



			// =============================================================================
			// SETS UP PROGRESS MARKERS ---------------------------

			// Holds child scope of current page
			$scope.currStep;

			// Holds active page marker for to ng-class 'activeCoin' on horizontal tutorial nav.
			$scope.activePage = {};

			// List of steps completed triggered by coinUpdates.
			// May be useful for progress tracking in the future.
			$scope.stepsCompleted = [];

			// Simply records the last page visited.
			// May be useful for user continuity in the future.
			$scope.lastScene;


			// called on line 29
			$scope.makeActivePageObj = function() {
				for (var i=0; i < $scope.coinData.length; i++) {
					$scope.activePage['p0' + (i + 1)] = false;
				}
			};

			// called from child ctrlrs
			$scope.updateParentScope = function(currStep) {
				$scope.currStep = currStep;
				//console.log('currStep: ' + $scope.currStep.sref);
			};

			// called from child ctrlrs
			$scope.recordLastScene = function() {
				$scope.lastScene = $scope.currStep.sref;
				//console.log('lastScene: ' + $scope.currStep.sref);
			};

			// called from child ctrlrs
			$scope.setActivePage = function(page) {
				for (var prop in $scope.activePage) {
					$scope.activePage[prop] = false;
				}
				$scope.activePage[page] = true;
				//console.log($scope.activePage);
			};

			// called from template partials (.inputBox)
			// Updates coin graphic on the completion of each page (tutorial section)
			$scope.coinUpdate = function(step) {
				if (step !== undefined) {
					$scope[step] = true;
					$scope.stepsCompleted.push(step);
					if ($scope.stepsCompleted.length === $scope.totalSteps) {
						NotifyingService.notify('tutorial-completed');
					}
				}
			};


			// =============================================================================
			// PAGE INIT ---------------------------
			// Activates first page on "Tutorial" click
			// $scope.$on("$ionicView.afterEnter", function() {
			// 	$state.go('root.tutorial.p01s1');
			// });


			console.log('TutorialController here!');

		} // end controller constructor body
	); // end controller constructor fx
} )(  );
