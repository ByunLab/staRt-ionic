var practiceDirective = angular.module( 'practiceDirective' );
practiceDirective.factory('AdaptDifficulty', function AdaptDifficultyFactory() {

	/* ---------------------------------------
    Purpose:
  --------------------------------------- */
	var words = {
		'consonantal_back': {
			'1': [
				'rod',
				'rot',
				'romp',
				'rub',
				'rough',
				'rust',
				'road',
				'rogue',
				'roam',
				'rope',
				'rote',
				'roast',
				'rue',
				'roof',
				'room',
				'root'
			],
			'2': [
				'robin',
				'rocket',
				'rotten',
				'rusty',
				'running',
				'rugby',
				'roping',
				'roaming',
				'romance',
				'rotate',
				'rooting',
				'ruby',
				'rudest',
				'roommate'
			],
			'3': [
				'roll',
				'rolled',
				'rule',
				'ruled',
				'robber',
				'Ronald',
				'rubber',
				'rubble',
				'runner',
				'roughly',
				'parole',
				'rolling',
				'roadless',
				'rower',
				'rudely',
				'rueful',
				'ruling',
				'roomful'
			]
		},
		'consonantal_front': {
			'1': [
				'raid',
				'rain',
				'ray',
				'rate',
				'wreck',
				'rest',
				'reef',
				'reek',
				'reap',
				'rib',
				'wrist',
				'rich',
				'rhyme',
				'rice',
				'right',
				'ripe',
				'rise',
				'write'
			],
			'2': [
				'raisin',
				'raven',
				'racing',
				'resting',
				'remnant',
				'ready',
				'reading',
				'reason',
				'written',
				'rigging',
				'ribbon',
				'riddance',
				'rhyming',
				'rising',
				'rhino',
				'arrive'
			],
			'3': [
				'rail',
				'railed',
				'real',
				'rear',
				'rile',
				'riled',
				'rear',
				'railing',
				'rainfall',
				'razor',
				'restful',
				'rental',
				'reckless',
				'regal',
				'relay',
				'really',
				'richly',
				'ripple',
				'riddle',
				'Riley',
				'rival',
				'writer',
				'rifle'
			]
		},
		'vocalic_all': {
			'1': [
				'dirt',
				'hurt',
				'burn',
				'first',
				'serve',
				'heard'
			],
			'2': [
				'birthday',
				'dirty',
				'turkey',
				'person',
				'certain',
				'hurry'
			],
			'3': [
				'curl',
				'girl',
				'learn',
				'blur',
				'worst',
				'worth',
				'turtle',
				'curly',
				'working',
				'worried',
				'worship',
				'worthy'
			]
		},
		'vocalic_back': {
			'1': [
				'chart',
				'dart',
				'heart',
				'park',
				'smart',
				'bark',
				'poor',
				'score',
				'shore',
				'bored',
				'cord',
				'torn'
			],
			'2': [
				'party',
				'guitar',
				'carton',
				'hearty',
				'harden',
				'garden',
				'adore',
				'ashore',
				'forty',
				'tortoise',
				'boring',
				'boarded'
			],
			'3': [
				'lard',
				'large',
				'lark',
				'Carl',
				'snarl',
				'wore',
				'swore',
				'warm',
				'warn',
				'quart',
				'wart',
				'hardly',
				'partly',
				'heartless',
				'alarm',
				'darling',
				'startle',
				'galore',
				'normal',
				'cordless',
				'Laura',
				'warning',
				'coral'
			]
		},
		'vocalic_front': {
			'1': [
				'cared',
				'fair',
				'hair',
				'spare',
				'dare',
				'mare',
				'deer',
				'fear',
				'gear',
				'hear',
				'near',
				'steer'
			],
			'2': [
				'haircut',
				'marry',
				'barefoot',
				'carry',
				'appear',
				'hearing',
				'cheering',
				'smearing',
				'steering',
				'nearest'
			],
			'3': [
				'glare',
				'lair',
				'wear',
				'square',
				'we\'re',
				'cleared',
				'leer',
				'wearing',
				'barely',
				'careful',
				'Larry',
				'weary',
				'leering',
				'sheerly',
				'fearless',
				'nearly',
				'bleary'
			]
		}
	};

	var carrier_phrases_bank = [
		['___'],
		['Say ___ to me'],
		[
			'He got detention because he said ___',
			'When he said ___, she got mad at him',
			'She passed me a note that said ___',
			'I put ___ at the top of my list',
			'He hoped she would know how to say ___',
			'I want to put ___ on the envelope',
			'I paid 10 cents to copy a sheet that said ___',
			'She hoped he would say ___',
			'I made a label that said ___',
			'You should take ___ off of the list',
			'It was funny when you said ___',
			'She put ___ on the ticket',
			'I walked past a sign that said ___',
			'My dad bought a book called ___',
			'I didn\'t expect to see a football team called ___',
			'I laughed when she said ___',
			'I built him a lemonade stand and called it ___',
			'He wasn\'t listening when she said ___',
			'I named my dog ___'
		]
	];

	return {
		phrases: carrier_phrases_bank,
		words: words
	};
});
