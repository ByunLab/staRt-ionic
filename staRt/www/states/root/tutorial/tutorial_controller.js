'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial' );

	/* SYNTAX NOTE: Since Angular infers the controller's dependencies from the names of arguments to the controller's constructor function, if you were to minify your code all of its function arguments for the controller would be minified as well, and the dependency injector would not be able to identify services correctly.  
	To prevent this, its common to provide the services as strings, and the constructor function inline as an anonymous function when registering the controller. https://code.angularjs.org/1.4.3/docs/tutorial/step_05  */

	//#q  added $http to get some local json. I don't really understand when to use 'services' and 'factories', but these sound like good topics for 'next step/optimization' ideas re: the process below... 

	tutorial.controller('TutorialController', ['$scope', '$timeout', '$localForage', 'StartUIState', '$rootScope', '$state', '$http', 
		function($scope, $timeout, $localForage, StartUIState, $rootScope, $state, $http, $stateParams) 
		{
			//get data for tutorial_template.html 
			$http.get('states/root/tutorial/tutorialData/coinData.json').success(function(data){
				$scope.coinData = data;
			});

			// all this is read in as json
			$http.get('states/root/tutorial/tutorialData/p01data.js').success(function(data)
			{
				$scope.p01data = data;
				$scope.p01s1 = $scope.p01data[0];
				$scope.p01s2 = $scope.p01data[1];
				$scope.p01s3 = $scope.p01data[2];
				$scope.p01s4 = $scope.p01data[3];
				$scope.p01s5 = $scope.p01data[4];
			});

			$http.get('states/root/tutorial/tutorialData/p02data.js').success(function(data)
			{
				$scope.p02data = data;
				$scope.p02s1 = $scope.p02data[0];
				$scope.p02s2 = $scope.p02data[1];
			});

			$http.get('states/root/tutorial/tutorialData/p03data.js').success(function(data)
			{
				$scope.p03data = data;
				$scope.p03s1 = $scope.p03data[0];
				$scope.p03s2 = $scope.p03data[1];
				$scope.p03s3 = $scope.p03data[2];
			});

			$http.get('states/root/tutorial/tutorialData/p04data.js').success(function(data)
			{
				$scope.p04data = data;
				$scope.p04s1 = $scope.p04data[0];
				$scope.p04s2 = $scope.p04data[1];
				$scope.p04s3 = $scope.p04data[2];
			});

			$http.get('states/root/tutorial/tutorialData/p05data.js').success(function(data)
			{
				$scope.p05data = data;
				$scope.p05s1 = $scope.p05data[0];
				$scope.p05s2 = $scope.p05data[1];
				$scope.p05s3 = $scope.p05data[2];
				$scope.p05s4 = $scope.p05data[3];
				$scope.p05s5 = $scope.p05data[4];
			});

		console.log('TutorialController here!');
	} 	// end of controller constructor body
	]); // end of controller constructor fx
} )(  );


/*

Example of $routeParams from phoneCat: https://code.angularjs.org/1.4.14/docs/tutorial/step_07

phonecatControllers.controller('PhoneDetailCtrl', ['$scope', '$routeParams', '$http',
  function($scope, $routeParams, $http) {
    $http.get('phones/' + $routeParams.phoneId + '.json').success(function(data) {
      $scope.phone = data;
    });
  }]);


  //---------------

Slide Events
The slides component dispatches events when the active slide changes

$ionicSlides.slideChangeStart	This event is emitted when a slide change begins
$ionicSlides.slideChangeEnd	This event is emitted when a slide change completes
$ionicSlides.sliderInitialized	This event is emitted when the slider is initialized. It provides access to an instance of the slider.



// var mySwiper = new Swiper ('.swiper-container', {
//     // Optional parameters
//     direction: 'vertical',
//     loop: true,
    
//     // If we need pagination
//     pagination: '.swiper-pagination',
    
//     // Navigation arrows
//     nextButton: '.swiper-button-next',
//     prevButton: '.swiper-button-prev',
    
//     // And if we need scrollbar
//     scrollbar: '.swiper-scrollbar',
//   })  

		// $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
		// 	  // data.slider is the instance of Swiper
		// 	  $scope.slider = data.slider;
		// 	  console.log('slider init!');
		// });

// $scope.$on("$ionicSlides.slideChangeStart", function(event, data){
//   console.log('Slide change is beginning');
// });

// $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
//   // note: the indexes are 0-based
//   $scope.activeIndex = data.slider.activeIndex;
//   $scope.previousIndex = data.slider.previousIndex;
// }); -->

*/