angular.module('tutService', [])

// A RESTful factory for retrieving contacts from 'contacts.json'
.factory('tutSteps', ['$http', function ($http) {
  var path = 'states/root/tutorial/tut-data/step01.json';
  var step01 = $http.get(path).then(function (resp) {
    return resp.data.step01;
  });

  var factory = {};
  factory.all = function () {
    return contacts;
  };
  // factory.get = function (id) {
  //   return contacts.then(function(){
  //     return utils.findById(contacts, id);
  //   })
  // };
  return factory;
}]);