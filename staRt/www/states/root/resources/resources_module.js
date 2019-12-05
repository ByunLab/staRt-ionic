'use strict';

( function(  )
{
	var resources = angular.module( 'resources',
		[ ] );

	resources.config( function( $stateProvider )
	{
		$stateProvider.state( 'root.resources',
			{
				url: 'resources',
				views:
			{
				'content-view':
				{
					templateUrl: 'states/root/resources/resources_template.html',
					controller: 'ResourcesController as resources'
				}
			}
			// abstract: true,
			} );
	} );

} )(  );
