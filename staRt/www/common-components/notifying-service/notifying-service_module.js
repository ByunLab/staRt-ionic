var notifyingService = angular.module('notifyingService', []);

notifyingService.factory('NotifyingService', function($rootScope) {
	return {
		subscribe: function(msg, scope, callback) {
			var handler = $rootScope.$on(msg, callback);
			scope.$on('$destroy', handler);
		},

		notify: function(msg, data) {
			$rootScope.$broadcast(msg, data);
		}
	};
});
