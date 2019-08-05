var practiceDirective = angular.module( 'practiceDirective' );
practiceDirective.factory('CSVhelp', function CSVhelpFactory() {



  return {
    hello: function() { console.log('Hello from the CSVhelper!'); },
  }
});
