'use strict';

( function(  )
{
	var words = angular.module( 'words',
	[ 'practiceDirective' ] );

	words.config( function( $stateProvider )
	{
		$stateProvider.state( 'root.words',
		{
			url: 'words',
			views:
			{
				'content-view':
				{
					templateUrl: 'states/root/words/words_template.html',
					controller: 'WordsController as words'
				}
			}
			// abstract: true,
		} );
	} );

} )(  );
