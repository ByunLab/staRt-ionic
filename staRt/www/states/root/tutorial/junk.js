
	syllables.config( function( $stateProvider )
	{
		$stateProvider.state( 'root.syllables',
		{
			url: 'syllables',
			views:
			{
				'content-view':
				{
					templateUrl: 'states/root/syllables/syllables_template.html',
					controller: 'SyllablesController as syllables'
				}
			}
			// abstract: true,
		} );
	} );

} )(  );



/*
			.state( 'tutorial-p01', {
				url: 'tutorial-step1',
				template: '<h1>Step 1. The Wave</h1>'

				// views:
				// {
				// 	'content-view':
				// 	{
				// 		templateUrl: 'states/root/tutorial/tutorial_template.html',
				// 		controller: 'TutorialController as tutorial'
				// 	}
				// abstract: true,
			} )

			.state( 'tutorial-p02', {
				url: 'tutorial-step2',
				template: '<h1>Step 2. eee sounds/h1>'

				// views: {
				// 	// the main template (relatively named)
				// 	'content-view': {
				// 		templateUrl: 'states/root/tutorial/tutorial_template.html',
				// 		controller: 'TutorialController as tutorial'
				// 	},
				// 	// the child views will be defined here (absolutely named)
    //         		'columnOne@step2': { 
    //         			template: 'Look I am a column!' 
    //         		},
    //         		 // for column two, we'll define a separate controller 
		  //           'columnTwo@step2': { 
		  //               templateUrl: 'table-data.html',
		  //               controller: 'scotchController'
		  //           }
				// } // end views 
				// abstract: true,
			} );
*/