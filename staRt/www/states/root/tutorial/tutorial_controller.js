'use strict';

( function(  )
{
	var tutorial = angular.module( 'tutorial' );

	tutorial.controller('TutorialController', function($scope, $timeout, $localForage, StartUIState, $rootScope, $state)
	{
		
		$scope.coinData = [
			{ 
				id: "coin1",
				sref: "",
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
				sref: "",
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
				sref: "",
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
				sref: "",
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
				sref: "",
				img: "",
				txt: "/r/ sounds",
				ani: "",
				xpos: "",
				ypos: "",
				height: "",
				width: ""
			},
		];

		console.log('TutorialController here!');
	});

} )(  );