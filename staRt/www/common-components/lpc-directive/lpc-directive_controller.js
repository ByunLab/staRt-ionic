/*globals console:false, angular:false, window:false, AudioPlugin:false */

'use strict';

// requestAnim shim layer by Paul Irish
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame    ||
	window.oRequestAnimationFrame      ||
	window.msRequestAnimationFrame     ||
	// eslint-disable-next-line no-unused-vars
	function(/* function */ callback, /* DOMElement */ element){
		window.setTimeout(callback, 1000 / 60);
	};
})();


var lpcDirective = angular.module( 'lpcDirective' );

lpcDirective.controller( 'LpcDirectiveController',
	function($rootScope, $scope, $state, $stateParams, $element, $timeout, $localForage, ProfileService, LPCRenderer )
	{

		$scope.data = {};

		$scope.$watchCollection('data', function()
		{
			$scope.$emit('ratingChange', $scope.data.rating);
		});

		var canvasElement = $element[0].querySelector('#lpc-canvas');
		var parentElement = $element[0].querySelector('#lpc-canvas-parentSize');

		$scope.lpcRenderer = new LPCRenderer(parentElement, canvasElement, 20);

		$scope.lpcHidden = false;

		$scope.lpcRenderer.beachScene = $scope.beach;
		var fzText; 		// holds DOM ele to display $scope.data.targetF3
		var pauseGroup;	// holds pause icon from lpcRenderer
		var playGroup;	// holds play icon from lpcRenderer
		if ($scope.beach) { fzText = $element[0].querySelector('#fzText'); }
		$scope.targetNeedsUpdate = false;
		$scope.targetTextUpdateCount = 0;

		///////////////////////////////////
		//  WAVE DATA
		///////////////////////////////////
		$scope.getLPCCoefficients = function(cb) {
			if (window.AudioPlugin !== undefined) {
				AudioPlugin.getLPCCoefficients(cb);
			} else {
				$scope.makeDummyData(cb);
			}
		};

		var pointCount = 256;
		var dummyPoints = [];
		for (var i=0; i<pointCount; i++)
			dummyPoints.push(0);
		var dummyNoisiness = 0.05;

		$scope.makeDummyData = function(cb) {

			var msg = {};
			msg.coefficients = [];
			msg.freqPeaks = [];

			for (var i=0; i<pointCount; i++) {
				if (i==0 || i==(pointCount-1))
					dummyPoints[i] = 0;
				else {
					var p = (Math.random() - 0.5) * dummyNoisiness;
					dummyPoints[i] = dummyPoints[i] + p;
				}
			}
			for (i=0; i<pointCount; i++) {
				if (i==0 || i==(pointCount-1))
					msg.coefficients.push(dummyPoints[i]);
				else {
					var vrg = dummyPoints[i-1] + dummyPoints[i] + dummyPoints[i+1];
					msg.coefficients.push(vrg/3);
				}
			}
			for (i=0; i<pointCount; i++) {
				if (i>0 && i<(pointCount-1)) {
					if (dummyPoints[i-1] > dummyPoints[i] && dummyPoints[i] < dummyPoints[i+1]) {
						msg.freqPeaks.push({
							X: $scope.lpcRenderer.linScale(i, 0, pointCount-1, -1, 1),
							Y: msg.coefficients[i]
						});
					}
				}
			}

			msg.freqScale = 2.2;
			if (cb)
				cb(msg);
		};

		$scope.lpcCoefficientCallback = function(msg) {
			if ($scope.active) {
				var points = msg.coefficients;
				var peaks = msg.freqPeaks;
				var frequencyScaling = msg.freqScale;
				//var frequencyScaling = 1;
				$scope.lpcRenderer.updateWave(points, peaks, frequencyScaling);
			}
		};


		///////////////////////////////////
		//  TOUCH HANDLERS
		///////////////////////////////////

		function positionForTouch( t )
		{
			var point;

			if (t.layerX && t.layerY) {
				point = {
					x: t.layerX - $scope.lpcRenderer.dim.canvas.width / 2,
					y: t.layerY - $scope.lpcRenderer.dim.canvas.height / 2
				};
				return point;

			} else {
				var rect = $scope.lpcRenderer.canvas.getBoundingClientRect();
				point = {
					x: t.pageX - rect.left - $scope.lpcRenderer.dim.canvas.width / 2,
					y: t.pageY - rect.top - $scope.lpcRenderer.dim.canvas.height / 2
				};
				return point;
			}
		}

		function onTouchStart( e )
		{
			if ($scope.active !== true) return;

			if ($scope.lpcRenderer.beachScene === false) return;

			if ($scope.pointerDown === false) {
				$scope.pointerDown = true;

				if (e.type === 'touchstart') {
					$scope.trackedTouch = e.changedTouches[0].identifier;
				}

				if (e.cancellable) e.preventDefault();

				var point = positionForTouch((e.type === 'touchstart') ? e.changedTouches[0] : e);

				var px = point.x + $scope.lpcRenderer.dim.canvas.width / 2;
				//console.log('touch: ' + px);

				var intersects = $scope.lpcRenderer.hitTest(point);
				console.log('raycaster says: ' + intersects);

				if (intersects === 'resetBtn') {
					$scope.resetF3();
					$scope.trackingTarget = false;

				} else if(intersects === 'bubBtn'
					|| intersects === 'playIcon'
					|| intersects === 'pauseIcon') {
					$scope.pauseHandler();
					$scope.trackingTarget = false;

				} else if( intersects === 'star' ) {
					$scope.trackingTarget = true;
					//console.log('touch: ' + px);
					//$scope.updateTarget();
				} else {
					$scope.trackingTarget = false;
				}
			}
		} // onTouchStart

		function onTouchMove( e )
		{
			if ($scope.active !== true) return;

			var identifier = ((e.changedTouches !== undefined) ? e.changedTouches[0].identifier : undefined);
			if ($scope.trackedTouch !== undefined && $scope.trackedTouch !== identifier) return;

			if ($scope.trackingTarget) {
				if (e.cancellable) e.preventDefault();

				var point = positionForTouch((e.changedTouches !== undefined) ? e.changedTouches[0] : e);
				var px = point.x + $scope.lpcRenderer.dim.canvas.width / 2;

				// get wave boundaries in web screen coords (origin = top left)
				var px_waveEdgeLeft = ($scope.lpcRenderer.dim.canvas.width/2) + $scope.lpcRenderer.dim.graph.left;
				var px_waveEdgeRight = ($scope.lpcRenderer.dim.canvas.width/2) + $scope.lpcRenderer.dim.graph.right;

				// console.log('left: ' + px_waveEdgeLeft);
				// console.log('right: ' +px_waveEdgeRight);
				// console.log('px: ' +px);

				//adds padding on right edge (prevents slider from overlapping reset sign.
				var padRight = $scope.lpcRenderer.dim.col_W * 0.75;
				px_waveEdgeRight -= padRight;
				var fzPadHigh = 4500 - ((4500/7) * 0.75); //adjusts for starfish padding.
				// var fzPadHigh = 4500;

				// update target data w/ clamped slider range and flag for UI update
				if( px < px_waveEdgeLeft) { px = px_waveEdgeLeft; }
				if( px > px_waveEdgeRight) { px = px_waveEdgeRight; }

				$scope.data.targetF3 = $scope.lpcRenderer.linScale(px, px_waveEdgeLeft, px_waveEdgeRight, 0, fzPadHigh);

				$scope.targetNeedsUpdate = true;
			} // end tracking target
		} // end touchMove

		function onTouchEnd( e ) {
			if ($scope.active !== true) return;

			if (!$scope.pointerDown) return;

			var identifier = ((e.changedTouches !== undefined) ? e.changedTouches[0].identifier : undefined);
			if ($scope.trackedTouch !== undefined && $scope.trackedTouch !== identifier) return;

			if (e.cancellable) e.preventDefault();

			if ($scope.trackingTarget) {
				//Update current user's saved targetF3
				ProfileService.runTransactionForCurrentProfile(function(handle, profile, t) {
					t.update(handle, { targetF3: parseInt($scope.data.targetF3) });
				});
			}

			$scope.pointerDown = false;
			$scope.trackedTouch = undefined;
			$scope.trackingTarget = false;
		}


		///////////////////////////////////
		//  RENDER
		///////////////////////////////////
		// var maxTargetTextUpdateCount = 2; //could be used to slow render, if needed

		$scope.animate = function () {
			if ($scope.active) {

				if ( $scope.lpcRenderer.dim.canvas.width !== $scope.lpcRenderer.parentElement.clientWidth ||
					$scope.lpcRenderer.dim.canvas.height !== $scope.lpcRenderer.parentElement.clientHeight ) {
					//console.log('new size');
					$scope.updateCanvasSize( );
				}

				if ($scope.beach) {

					if ( $scope.lpcPaused === false ) {
						$scope.getLPCCoefficients($scope.lpcCoefficientCallback);
						pauseGroup = $scope.lpcRenderer.scene.getObjectByName('pauseGroup');
						playGroup = $scope.lpcRenderer.scene.getObjectByName('playGroup');
						pauseGroup.visible = true;
						playGroup.visible = false;

					} else {
						pauseGroup = $scope.lpcRenderer.scene.getObjectByName('pauseGroup');
						playGroup = $scope.lpcRenderer.scene.getObjectByName('playGroup');
						pauseGroup.visible = false;
						playGroup.visible = true;
					} // end if(lpcPaused)

					if ($scope.targetNeedsUpdate) {
						$scope.updateTarget();
					}

					// even though we aren't writing to a text sprite anymore,
					// this may still be helpful to smooth out the animation
					// if ($scope.targetNeedsUpdate) {
					// 	if ($scope.targetTextUpdateCount >= maxTargetTextUpdateCount) {
					// 		$scope.targetTextUpdateCount = 0;
					// 		$scope.updateTarget();
					// 		$scope.targetNeedsUpdate = false;
					// 	} else {
					// 		$scope.targetTextUpdateCount++;
					// 	}
					// }
				} // end if(beach)

				if (!$scope.beach) {
					$scope.getLPCCoefficients($scope.lpcCoefficientCallback);
				}

				window.requestAnimFrame($scope.animate);

				$scope.lpcRenderer.render();
			}
		};

		//--------------------------------------------------------------

		////////////////////////////
		//  Interaction & Targets
		////////////////////////////

		function setInitialTarget() {
			ProfileService.getCurrentProfile().then(function(res)
			{
			//console.log('currentProfile:', res)
				if (res) {
					if (res.targetF3)
					{
						$scope.data.targetF3 = res.targetF3;
						console.log('existing targetF3:', res.targetF3);
					}
					else
					{
						$scope.data.targetF3 = ProfileService.lookupDefaultF3(res);
						console.log('going w default tf3:', $scope.data.targetF3);
					}
				}
				// Set initial LPC
				$timeout(function()
				{
					$scope.updateTarget();
				});
			});
		} // end setInitialTarget()

		$scope.updateTarget = function() {

			if ($scope.data.targetF3 === undefined) return;

			var sliderPosition = $scope.lpcRenderer.linScale($scope.data.targetF3, 0, 4500, 0, 1);
			if(sliderPosition > 1) { sliderPosition = 1; }
			if(sliderPosition < 0) { sliderPosition = 0; }

			$scope.lpcRenderer.sliderPosition = sliderPosition;

			if (fzText !== undefined) {
				fzText.innerHTML = Math.floor($scope.data.targetF3);
			}
		};

		$scope.resetF3 = function() {
			ProfileService.getCurrentProfile().then(function(res)
			{
				if(res)
				{
					$scope.data.targetF3 = ProfileService.lookupDefaultF3(res);
					$timeout(function()
					{
						$scope.updateTarget();
					});
				}
			});
		};


		// INTERFACE ---------------------
		$scope.pauseHandler = function() {
			$scope.lpcPaused = !$scope.lpcPaused;
		};

		$scope.showLPC = function() {
			$scope.lpcHidden = false;
		};

		$scope.hideLPC = function() {
			$scope.lpcHidden = true;
		};

		$scope.updateCanvasSize = function() {
			console.log('size update called');
			$scope.lpcRenderer.updateDrawingDim();
			$scope.lpcRenderer.updateCameraSize();
			$scope.lpcRenderer.clearScene();
			$scope.lpcRenderer.drawScene();
			$scope.updateTarget();
		};

		{
			if ('ontouchstart' in window) {
				$scope.lpcRenderer.renderer.domElement.addEventListener('touchstart', onTouchStart, false);
				$scope.lpcRenderer.renderer.domElement.addEventListener('touchmove', onTouchMove, false);
				$scope.lpcRenderer.renderer.domElement.addEventListener('touchcancel', onTouchEnd, false);
				$scope.lpcRenderer.renderer.domElement.addEventListener('touchend', onTouchEnd, false);
			} else {
				$scope.lpcRenderer.renderer.domElement.addEventListener('mousedown', onTouchStart, false);
				window.addEventListener('mousemove', onTouchMove, false);
				window.addEventListener('mouseup', onTouchEnd, false);
			}

			$scope.lpcPaused = false;
			$scope.pointerDown = false;

			$scope.updateCanvasSize( parentElement );
			$scope.active = true;
			setInitialTarget();
			$scope.animate();
		}


		// ---------------------------------------

		$scope.$on('resetRating', function() {
			$scope.data.rating = 0;
		});

		$scope.$watch('targetF3', function() {
			$scope.updateTarget();
		});

		$scope.myURL = $state.current.name;

		// BEGIN PAUSE-SETUP
		if ($rootScope.lpcPauseListenersSet) {
			document.removeEventListener('pause', $rootScope.lpcOnPause);
			document.removeEventListener('resume', $rootScope.lpcOnResume);
		}

		$rootScope.lpcOnPause = function () {
			console.log('Pausing LPC.');
			$scope.active = false;
		};

		$rootScope.lpcOnResume = function () {
			$scope.active = true;
			$scope.animate();
		};

		document.addEventListener('pause', $rootScope.lpcOnPause);
		document.addEventListener('resume', $rootScope.lpcOnResume);
		$rootScope.lpcPauseListenersSet = true;
		// END PAUSE-SETUP


		var unsubscribe = $rootScope.$on('$urlChangeStart', function(event, next) {
			if (next === $scope.myURL) {
				$scope.active = true;
				$scope.animate();
				$scope.updateCanvasSize();
				setInitialTarget();
			} else {
				$scope.active = false;
				fzText = undefined;
			}

		});

		$scope.$on('$destroy', function() {
			unsubscribe();
		});
	});
