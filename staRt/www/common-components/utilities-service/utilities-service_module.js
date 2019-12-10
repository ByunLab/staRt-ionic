var utilitiesService = angular.module('utilitiesService', []);

utilitiesService.factory('UtilitiesService', function() {
	var s4 = function() {
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	};

	var parseCSV = function (str) {
		var arr = [];
		var quote = false;
		var row=0, col=0, c=0;
		for (; c < str.length; c++) {
			var cc = str[c], nc = str[c+1];
			arr[row] = arr[row] || [];
			arr[row][col] = arr[row][col] || '';
			if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
			if (cc == '"') { quote = !quote; continue; }
			if (cc == ',' && !quote) { ++col; continue; }
			if (cc == '\n' && !quote) { ++row; col = 0; continue; }
			arr[row][col] += cc;
		}
		return arr;
	};

	var guid = function () {
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
	};

	var recordingSessionIsComplete = function(recordingSession) {
		console.log('recourding session count : %o rating length: %o', recordingSession.count, recordingSession.ratings.length);
		return recordingSession.count <= recordingSession.ratings.length;};

	return {
		guid: guid,
		parseCSV: parseCSV,
		recordingSessionIsComplete: recordingSessionIsComplete
	};
});


