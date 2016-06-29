module.exports = {
  getLPCCoefficients: function(successCallback) {
    cordova.exec(successCallback,
                 null, // No failure callback
                 "AudioPlugin",
                 "getLPCCoefficients",
                 null); // No arguments
  },
  startRecording: function(profileDescription, successCallback, errorCallback) {
    cordova.exec(
      successCallback,
      errorCallback,
      "AudioPlugin",
      "startRecording",
      [profileDescription]
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
      "recordingsForProfile",
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
