// Ionic Starter App

var start = angular.module('start',
[
    'ionic',
    'root'
]);

start.config(function($urlRouterProvider, $locationProvider, $ionicConfigProvider)
{
  $urlRouterProvider.otherwise('/profiles');
  
  //$locationProvider.html5Mode(true);
  $ionicConfigProvider.views.maxCache(0);
  $ionicConfigProvider.views.transition('none');
});

// This is all automatic boilerplate, none of which is apparently necessary for
// running the program. But it says not to disable it, so...
start.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {

    if (window.AudioPlugin)
      window.AudioPlugin.startAudio()

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

    console.log('start app running')
  });
});
