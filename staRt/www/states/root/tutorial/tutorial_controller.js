'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial' );

	//#q  added $http to get some local json. I don't really understand 'services' and 'factories', but they seems like a 'more correct' way to do this. Should look into this ...

	tutorial.controller('TutorialController', function($scope, $timeout, $localForage, StartUIState, $rootScope, $state, $http)  
	{
		//get data for tutorial_template.html 
		$http.get('states/root/tutorial/tut-data/coinData.json').success(function(data){
			$scope.coinData = data;
		});

		// this is read in as json
		$http.get('states/root/tutorial/tut-data/step01.js').success(function(data)
		{
			$scope.step01 = data;
			$scope.p01s1 = $scope.step01[0];
			$scope.p01s2 = $scope.step01[1];
			$scope.p01s3 = $scope.step01[2];
			$scope.p01s4 = $scope.step01[3];
			$scope.p01s5 = $scope.step01[4];
		});

		$scope.hello = function() {
			console.log('hello');
			$state.go('root.tutorial.p02'); //doesn't work
		}

		// function setDevPage() {
		// 	$state.go('root.tutorial.p01s1');
		// }
		// setDevPage();
			

			//console.log('scope.step1: ' + coinData);

			
			//var step01 = [];
			//step01 = $scope.step01;
			// var stepCount = 0;
//			console.log($scope.step01);

//			if stepCount > step01.length
			// $http.get('states/root/tutorial/tut-data/coinData.json').success(function(data){
			// 	$scope.coinData = data;
			// 	//console.log($scope.coinData)
			// });
		//console.log(p01s1);
		console.log('TutorialController here!');
	});
} )(  );

/*

var phonecatControllers = angular.module('phonecatControllers', []);

phonecatControllers.controller('PhoneListCtrl', ['$scope', '$http',
  function($scope, $http) {
    $http.get('phones/phones.json').success(function(data) {
      $scope.phones = data;
    });

    $scope.orderProp = 'age';
  }]);

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