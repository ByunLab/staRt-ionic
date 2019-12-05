'use strict';

( function(  )
{
	var auto = angular.module( 'auto',
		[ ] );

	auto.config( function( $stateProvider )
	{
		$stateProvider.state( 'root.auto',
			{
				url: 'auto',
				views:
			{
				'content-view':
				{
					templateUrl: 'states/root/auto/auto_template.html',
					controller: 'AutoController as auto'
				}
			}
			// abstract: true,
			} );
	} );

} )(  );
