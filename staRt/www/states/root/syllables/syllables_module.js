'use strict';

( function(  )
{
	var syllables = angular.module( 'syllables',
	[ 'practiceDirective' ] );

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
