var firebaseService = angular.module('firebaseService', []);

firebaseService.factory('FirebaseService', function()
{
	function signInSuccessWithAuthResult(currentUser, credential, redirectUrl) {
		// Do something.
		// Return type determines whether we continue the redirect automatically
		// or whether we leave that to developer to handle.

		console.log('Sign in successful!!');
		console.log(credential);

		return false;
	}

	var uiConfig = {
		callbacks: {
			signInSuccessWithAuthResult: signInSuccessWithAuthResult
		},
		signInOptions: [
			firebase.auth.EmailAuthProvider.PROVIDER_ID
		],
		signInFlow: 'popup'
	};

	var firebaseApp = firebase.initializeApp({
		apiKey: 'AIzaSyAhXwmRqVnZUd1sKaMxNjTCAMm7-iZZFHQ',
		authDomain: 'start-app-59c52.firebaseapp.com',
		databaseURL: 'https://start-app-59c52.firebaseio.com',
		projectId: 'start-app-59c52',
		storageBucket: 'start-app-59c52.appspot.com',
		messagingSenderId: '242774896654'
	});

	var db = firebaseApp.firestore();
	var settings = {timestampsInSnapshots: true};
	db.settings(settings);

	// Initialize the FirebaseUI Widget using Firebase.
	// eslint-disable-next-line no-undef
	var ui = new firebaseui.auth.AuthUI(firebase.auth());

	return {
		app: function() { return firebaseApp; },

		db: function() { return db; },

		loggedIn: function() { return !!firebase.auth().currentUser; },

		startUi: function() { ui.start('#firebaseui-auth-container', uiConfig); },

		timestamp: function() { return firebase.firestore.FieldValue.serverTimestamp(); },

		userId: function() { return firebase.auth().currentUser ? firebase.auth().currentUser.uid : null; },

		userName: function() { return firebase.auth().currentUser ? firebase.auth().currentUser.displayName : null; },

		userEmail: function() { return firebase.auth().currentUser ? firebase.auth().currentUser.email : null; }
	};
});
