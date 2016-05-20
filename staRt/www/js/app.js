// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('start', ['ionic'])

.factory("StartUIState", function() {
  return {
    getLastActiveIndex: function() {
      return parseInt(window.localStorage.lastActiveIndex) || 0;
    },
    setLastActiveIndex: function(index) {
      window.localStorage.lastActiveIndex = index;
    },
    tabTitles: [
      "Profiles",
      "Tutorial",
      "Auto",
      "Free Play",
      "Syllables",
      "Words",
      "Resources"
    ],
    content: [
      "A whole bunch of Profles",
      "A great big tutorial",
      "Auto, whatever that means",
      "Play around for free I guess",
      "Syl-la-bles",
      "Different words and stuff",
      "Gold, wood, stone"
    ]
  };
})

.controller('StartCtrl', function($scope, $timeout, StartUIState) {

  $scope.startUIState = StartUIState.getLastActiveIndex();

  $scope.selectIndex = function(index) {
    StartUIState.setLastActiveIndex(index);
    $scope.content = StartUIState.content[index];
    AudioPlugin.iosalert('alert', ''+index, 'Okay', null);
  };

  $scope.tabTitles = StartUIState.tabTitles;

  $scope.getLPCCoefficients = function(cb) {
    if (window.AudioPlugin !== undefined) {
      AudioPlugin.getLPCCoefficients(cb);
    }
  };

	//Start lpc drawer
	var sketch = function(lpc) {

		var url;
		var myCanvas;
		var myFrameRate = 30;
		var running = true;
    var points = [];

    lpc.coefficentCallback = function(msg) {
      points = msg;
    };

		lpc.preload = function() {
		};

		lpc.setup = function() {
			myCanvas = lpc.createCanvas(screen.width, screen.height/2);
      myCanvas.parent(document.getElementById('lpc-container'));
			lpc.frameRate(myFrameRate);
		};

		lpc.draw = function() {
			lpc.background('#ffffff');
      $scope.getLPCCoefficients(lpc.coefficentCallback);
      lpc.stroke('#000000');
      lpc.strokeWeight(3);
      lpc.beginShape();
      for (var i=0; i<points.length; i++) {
        var px = i / (points.length) * myCanvas.width;
        var py = points[i] * (myCanvas.height/2) + (myCanvas.height/2);
        lpc.curveVertex(px, py);
      }
      lpc.endShape();
		};

		lpc.mouseClicked = function() {
		};

		lpc.stopDraw = function() {
			lpc.noLoop();
			running = false;
		};

		lpc.startDraw = function() {
			lpc.loop();
			running = true;
		};
	};
	$scope.myP5 = new p5(sketch);
})

// This is all automatic boilerplate, none of which is apparently necessary for
// running the program. But it says not to disable it, so...
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});
