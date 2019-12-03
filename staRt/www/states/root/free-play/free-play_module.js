'use strict';

( function(  )
{
	var freePlay = angular.module( 'freePlay',
		[ ] );

	freePlay.config( function( $stateProvider )
	{
		$stateProvider.state( 'root.free-play',
			{
				url: 'free-play',
				views:
			{
				'content-view':
				{
					templateUrl: 'states/root/free-play/free-play_template.html',
					controller: 'FreePlayController as freePlay'
				}
			}
			// abstract: true,
			} );
	} );

} )(  );
