// var tutorialService = angular.module('tutorial').service('tutorialService', function($http) {

//   var tutService = {
    
//     getStep01: function(){
//       return $http.get('states/tutorial/tut-data/step01.json', { cache: true 
//       }).then(function(resp) {
//         //var step01 = resp.data;
//         return resp.data;
//       });
//     } // end getStep1
//   }; // end tutService
  
//   return tutService;
//   console.log(tutService);
// }); //end service

/* https://code.angularjs.org/1.4.14/docs/guide/services
The service factory function generates the single object or function that represents the service to the rest of the application. The object or function returned by the service is injected into any component (controller, service, filter or directive) that specifies a dependency on the service.
*/
// tutorialService.factory('tutSceneState', function($localForage, $http) 
// {
//   var tutService = {
//     getStep01: function(){
//       return $http.get('states/tutorial/tut-data/step01.json', { cache: true 
//       }).then(function(resp) {
//         //var step01 = resp.data;
//         return resp.data;
//       });
//     } // end getStep1
//   }; // end return
//   return tutService;
//   console.log(tutService);
// }); //end factory



/*
angular.module('hellosolarsystem').service('PeopleService', function($http) {
  var service = {
    getAllPeople: function() {
      return $http.get('data/people.json', { cache: true }).then(function(resp) {
        return resp.data;
      });
    },
    
    getPerson: function(id) {
      function personMatchesParam(person) {
        return person.id === id;
      }
      
      return service.getAllPeople().then(function (people) {
        return people.find(personMatchesParam)
      });
    }
  }
  
  return service;
})
*/



/*
startStateService.factory('StartUIState', function()
{

  return {
    getLastActiveIndex: function(lf) {
      return lf.getItem("lastActiveIndex");
      // return parseInt(window.localStorage.lastActiveIndex) || 0;
    },
    setLastActiveIndex: function(lf, index) {
      return lf.setItem("lastActiveIndex", index);
    },
    tabData: [
      {
        title: "Profiles",
        sref: "profiles",
        ani: "tada"
      },
      {
        title: "Tutorial",
        sref: "tutorial",
        ani: "rotateIn" 
      },
      {
        title: "Auto",
        sref: "auto",
        ani: "flipInX"
      },
      {
        title: "Free Play",
        sref: "free-play",
        ani: "bounce"
      },
      {
        title: "Syllables",
        sref: "syllables",
        ani: "bounceIn"
      },
      {
        title: "Words",
        sref: "words",
        ani: "bounceIn"

      },
      {
        title: "Resources",
        sref: "resources",
        ani: "flipInY"
      }
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
});
*/