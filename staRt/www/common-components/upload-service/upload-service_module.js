var uploadService = angular.module('uploadService', []);

var fileKeys = [
	'Ratings', 'Metadata', 'LPC', 'Audio'
];

var uploadURLs = {
	Ratings: 'https://byunlab.com/start/session/ratings',
	Metadata: 'https://byunlab.com/start/session/metadata',
	LPC: 'https://byunlab.com/start/session/lpc',
	Audio: 'https://byunlab.com/start/session/audio'
};

// var uploadURLs = {
// 	Ratings: "http://localhost:3000/session/ratings",
// 	Metadata: "http://localhost:3000/session/metadata",
// 	LPC: "http://localhost:3000/session/lpc",
// 	Audio: "http://localhost:3000/session/audio"
// };

var downloadStatusCache = {};

function _mimeTypeForFile(value) {
	if (value.endsWith('csv')) return 'text/csv';
	if (value.endsWith('json')) return 'application/json';
	if (value.endsWith('mp4') || value.endsWith('m4a')) return 'audio/mp4';
	if (value.endsWith('mp3')) return 'audio/mpeg';
	if (value.endsWith('aif')) return 'audio/x-aiff';
	if (value.endsWith('ogg')) return 'audio/ogg';
	if (value.endsWith('wav')) return 'audio/vnd.wav';
	return null;
}

uploadService.factory('UploadService', function($localForage, $http, $cordovaDialogs, StartServerService, SessionStatsService)
{
	function saveUploadStatusForRecordingSessionID(sessionKey, status) {
		var item = downloadStatusCache[sessionKey];
		if (!item) item = {};
		downloadStatusCache[sessionKey] = Object.assign(item, status);

		$localForage.getItem(sessionKey)
			.then(function(item) {
				if (!item) item = {};
				item = Object.assign(item, status);
				$localForage.setItem(sessionKey, item);
			});
	}

	// Returns a promise that resolves when the upload is complete (or fails)
	function uploadFile(absolutePath, destURL, mimeType, recordingSessionID, progressCb, $http, $cordovaDialogs)
	{
		var stats = SessionStatsService.getCurrentProfileStats();
		var session = stats ? stats.thisContextString : '';
		// eslint-disable-next-line no-undef
		return new Promise(function (resolve, reject) {
			var win = function (r) {
				console.log('Code = ' + r.responseCode);
				console.log('Response = ' + r.response);
				console.log('Sent = ' + r.bytesSent);
				resolve(r);
			};

			var fail = function (error) {
				reject(error);
			};

			// eslint-disable-next-line no-undef
			resolveLocalFileSystemURL('file://' + absolutePath, function(fileEntry) {
				fileEntry.file( function(file) {
					// eslint-disable-next-line no-undef
					var options = new FileUploadOptions();
					options.fileName = absolutePath.substr(absolutePath.lastIndexOf('/') + 1);
					options.mimeType = mimeType;
					options.chunkedMode = true;

					// call getCredentials and set http headers with username and password
					StartServerService.getCredentials(function(credentials) {
						var headers = {
							'filename':options.fileName + '-' + session,
						};
						if (credentials) {
							headers['Authorization'] = 'Basic ' + btoa(credentials.username + ':' + credentials.password);
						}
						options.headers = headers;
						var params = {
							'session_id': recordingSessionID
						};
						options.params = params;

						// HACK: Add the session id to the URL, so that the server will recognize it
						destURL = destURL + '?session_id=' + recordingSessionID;

						// eslint-disable-next-line no-undef
						var ft = new FileTransfer();
						ft.onprogress = progressCb;
						ft.upload(fileEntry.toInternalURL(), encodeURI(destURL), win, fail, options);
					});

				}, function(error) {
					console.log(error);
				});
				console.log(fileEntry.toInternalURL());
			}, function(error) {
				console.log(error);
			});

		});
	}

	return {
		getUploadStatusForRecordingSessionID: function(sessionKey) {
			return $localForage.getItem(sessionKey).then(function(item) {
				if (!item) item = {};
				var cachedItem = downloadStatusCache[sessionKey];
				if (!cachedItem) cachedItem = {};
				return Object.assign(item, cachedItem);
			});
		},

		uploadPracticeSessionFiles: function(filesToUpload, recordingSessionID, progressCallback, completeCallback, errorCallback) {
			var uploadTodos = [];

			saveUploadStatusForRecordingSessionID(recordingSessionID, {uploading: true});

			fileKeys.forEach(function (fileKey, idx) {
				var filename = filesToUpload[fileKey];
				var mimeType = _mimeTypeForFile(filename);
				var uploadURL = uploadURLs[fileKey];
				var progressCb = function(res) {
					progressCallback(res, idx);
				};
				uploadTodos.push(uploadFile(filename,
					uploadURL,
					mimeType,
					recordingSessionID,
					progressCb,
					$http,
					$cordovaDialogs
				));
			});

			// eslint-disable-next-line no-undef
			Promise.all(uploadTodos)
				.then(function() {
					console.log('Uploaded all files for recording session id ' + recordingSessionID);
					saveUploadStatusForRecordingSessionID(recordingSessionID, {uploading: false, uploaded: true});
					completeCallback();
				})
				.catch(function(err) {
					if (errorCallback) errorCallback(err);
				});
		}
	};
});
