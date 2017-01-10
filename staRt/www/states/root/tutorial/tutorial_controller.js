'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial' );

	tutorial.controller('TutorialController', function($scope, $timeout, $localForage, StartUIState, $rootScope, $state)
	{
		
		$scope.coinData = [
			{ 
				id: "coin1",
				sref: "p01",
				img: "",
				txt: "the wave",
				ani: "",
				xpos: "",
				ypos: "",
				height: "",
				width: ""
			},
			{ 
				id: "coin2",
				sref: "p02",
				img: "",
				txt: "eee sounds",
				ani: "",
				xpos: "",
				ypos: "",
				height: "",
				width: ""
			},
			{ 
				id: "coin3",
				sref: "p03",
				img: "",
				txt: "ahh sounds",
				ani: "",
				xpos: "",
				ypos: "",
				height: "",
				width: ""
			},
			{ 
				id: "coin4",
				sref: "p04",
				img: "",
				txt: "ooh sounds",
				ani: "",
				xpos: "",
				ypos: "",
				height: "",
				width: ""
			},
			{ 
				id: "coin5",
				sref: "p05",
				img: "",
				txt: "/r/ sounds",
				ani: "",
				xpos: "",
				ypos: "",
				height: "",
				width: ""
			},
		];

		$scope.sliderOpts = {
		    effect: 'slide',
		    initialSlide: 0,
		    pagination: false,

		    // this seems to be the only way to get the swiperJs obj
		    onInit: function(swiper){  
		    $scope.swiper = swiper;
		    console.log('The active index is ' + swiper.activeIndex); 
		    // Now you can do whatever you want with the swiper

		    },

		    onSlideChangeEnd: function(swiper){
		    console.log('The active index is ' + swiper.activeIndex); 
		    }


		  };
		  

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

		console.log('TutorialController here!');
	});

} )(  );

/*

Slide Events
The slides component dispatches events when the active slide changes

$ionicSlides.slideChangeStart	This event is emitted when a slide change begins
$ionicSlides.slideChangeEnd	This event is emitted when a slide change completes
$ionicSlides.sliderInitialized	This event is emitted when the slider is initialized. It provides access to an instance of the slider.

*/