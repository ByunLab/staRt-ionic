var startStateService = angular.module('startStateService', []);

startStateService.factory('StartUIState', function()
{
	return {
		tabData: [
			{
				title: 'Profiles',
				sref: 'profiles',
				icon: 'profiles'
			},
			{
				title: 'Tutorial',
				sref: 'tutorial.p01s1',
				icon: 'tutorial',
			},
			{
				title: 'Free Play',
				sref: 'free-play',
				icon: 'freePlay',
			},
			{
				title: 'Quest',
				sref: 'words',
				icon: 'quest',
			},
			{
				title: 'Quiz',
				sref: 'auto',
				icon: 'quiz',
			},
			{
				title: 'Resources',
				sref: 'resources',
				icon: 'resources',
			}
		]
	};
});
