module.exports = {
  startAudio: function(successCallback) {
    cordova.exec(successCallback,
                 null, // No failure callback
                 "AudioPlugin",
                 "startAudio",
                 null); // No arguments
  },
  stopAudio: function(successCallback) {
    cordova.exec(successCallback,
                 null, // No failure callback
                 "AudioPlugin",
                 "stopAudio",
                 null); // No arguments
  },
  getLPCCoefficients: function(successCallback) {
    cordova.exec(successCallback,
                 null, // No failure callback
                 "AudioPlugin",
                 "getLPCCoefficients",
                 null); // No arguments
  },
  startRecording: function(profileDescription, userString, recordingSessionId, successCallback, errorCallback) {
    cordova.exec(
      successCallback,
      errorCallback,
      "AudioPlugin",
      "startRecording",
      [profileDescription, userString, recordingSessionId]
    );
  },
  stopRecording: function(successCallback, errorCallback) {
    cordova.exec(
      successCallback,
      errorCallback,
      "AudioPlugin",
      "stopRecording",
      null
    );
  },
  isRecording: function(successCallback) {
    cordova.exec(
      successCallback,
      null,
      "AudioPlugin",
      "isRecording",
      null
    );
  },
  recordingsForProfile: function(profileDescription, successCallback, errorCallback) {
    cordova.exec(
      successCallback,
      errorCallback,
      "AudioPlugin",
      "recordingsForAccount",
      [profileDescription]
    );
  },
  deleteRecording: function(recordingDescription, successCallback, errorCallback) {
    cordova.exec(
      successCallback,
      errorCallback,
      "AudioPlugin",
      "deleteRecording",
      [recordingDescription]
    );
  },
  deleteAllRecordings: function(successCallback, errorCallback) {
    cordova.exec(
      successCallback,
      errorCallback,
      "AudioPlugin",
      "deleteAllRecordings",
      null
    );
  },
  getLPCOrder: function(successCallback) {
    cordova.exec(
      successCallback,
      null,
      "AudioPlugin",
      "getLPCOrder",
      null
    );
  },
  setLPCOrder: function(newOrder, successCallback) {
    cordova.exec(
      successCallback,
      null,
      "AudioPlugin",
      "setLPCOrder",
      [newOrder]
    );
  }
};
