/*globals console:false, angular:false, window:false, alert:false */
/*globals THREE:false, AudioPlugin:false */

'use strict';

var lpcDirective = angular.module( 'lpcDirective' );

lpcDirective.controller( 'LpcDirectiveController', function( $rootScope, $scope, $state, $stateParams, $element, $timeout, $localForage, ProfileService )
{

	console.log('LpcDirectiveController active!');

	console.log($scope);

	// requestAnim shim layer by Paul Irish
	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame       ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame    ||
		window.oRequestAnimationFrame      ||
		window.msRequestAnimationFrame     ||
		function(/* function */ callback, /* DOMElement */ element){
			window.setTimeout(callback, 1000 / 60);
		};
	})();

	function linScale(v, inlow, inhigh, outlow, outhigh) {
		var range = outhigh - outlow;
		var domain = inhigh - inlow;
		var ov = (v - inlow) / domain;
		ov = (ov * range) + outlow;
		return ov;
	}

	var element = $element;

	$scope.getLPCCoefficients = function(cb) {
		if (window.AudioPlugin !== undefined) {
			AudioPlugin.getLPCCoefficients(cb);
		}
	};

	// var containerDiv;
	// for (var i=0; i<element.children().length; i++) {
	// 	var e = element.children()[i];
	// 	if (e.nodeName === "DIV" && e.classList.contains("slider-and-canvas"))
	// 		containerDiv = e;
	// }
	var containerDiv = angular.element(element[0].querySelector('.slider-and-canvas'))[0];

	var firstElt = null;
	if (containerDiv.children.length > 0)
		firstElt = containerDiv.children[0];

	var renderer = new THREE.WebGLRenderer({ antialias: true });
	if (firstElt) {
		containerDiv.insertBefore(firstElt, renderer.domElement);
	} else {
		containerDiv.appendChild(renderer.domElement);
	}

	var canvas = renderer.domElement;
	canvas.id = "lpc-canvas";
	var WIDTH=canvas.clientWidth, HEIGHT=canvas.clientHeight;
	var ASPECT = WIDTH/HEIGHT;
	var camera = new THREE.OrthographicCamera(WIDTH/-2, WIDTH/2, HEIGHT/-2, HEIGHT/2, 1, 1000);
	var scene = new THREE.Scene();
	scene.add(camera);
	camera.position.set(0, 0, 100);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize(WIDTH, HEIGHT);

	$scope.canvas = canvas;
	$scope.renderer = renderer;
	$scope.camera = camera;
	$scope.active = false;

	var line;
	var peaks, points, frequencyScaling;
	var peakSegments;

	$scope.lpcCoefficientCallback = function(msg) {
		if ($scope.active) {
			var WIDTH = renderer.getSize().width;
			var HEIGHT = renderer.getSize().height;
			points = msg.coefficients;
			peaks = msg.freqPeaks;
			frequencyScaling = msg.freqScale;
			if (line === undefined) {
				var material = new THREE.LineBasicMaterial({
					color: 0x0000ff
				});
				var geometry = new THREE.Geometry();
				for (var i=0; i<points.length; i++) {
					var point = points[i];
					var px = linScale(i*frequencyScaling, 0, points.length-1, WIDTH/-2, WIDTH/2);
					geometry.vertices.push(new THREE.Vector3(px, 0, 0));
				}
				line = new THREE.Line(geometry, material);
				line.geometry.dynamic = true;
				scene.add(line);
			}

			if (peakSegments === undefined) {
				var material = new THREE.LineBasicMaterial({
					color: 0x00ff00
				});
				var geometry = new THREE.Geometry();
				peakSegments = new THREE.LineSegments(geometry, material);
				scene.add(peakSegments);
			}
		}
	};

	$scope.update = function() {
		var WIDTH = renderer.getSize().width;
		var HEIGHT = renderer.getSize().height;
		
		if (line !== undefined) {
			for (var i=0; i<points.length; i++) {
				var px = linScale(i*frequencyScaling, 0, points.length-1, WIDTH/-2, WIDTH/2);
				var py = linScale(points[i], 1, -1, HEIGHT/-2, HEIGHT/2);
				line.geometry.vertices[i].set(px, py, 0);
			}
			line.geometry.verticesNeedUpdate = true;
		}

		if (peaks !== undefined) {
			var geometry = new THREE.Geometry();
			for (var i=0; i<peaks.length; i++) {
				var peak = peaks[i];
				var px = linScale(peak.X, -1, 1, 0, frequencyScaling);
				px = linScale(px, 0, 1, WIDTH/-2, WIDTH/2);
				var py = linScale(peak.Y, 1, -1, HEIGHT/-2, HEIGHT/2);
				var v1 = new THREE.Vector3(px, py, 1);
				var v2 = new THREE.Vector3(px, HEIGHT/2, 1);
				geometry.vertices.push(v1);
				geometry.vertices.push(v2);
			}
			peakSegments.geometry = geometry;
			peakSegments.geometry.verticesNeedUpdate = true;
		}
	};

	$scope.animate = function() {
		if ($scope.active) {
			$scope.getLPCCoefficients($scope.lpcCoefficientCallback);
			window.requestAnimFrame($scope.animate);
			$scope.update();
			renderer.render(scene, camera);
		}
	};

	$scope.scaleContext = function() {
		var renderer = $scope.renderer;
		var canvas = $scope.canvas;
		var camera = $scope.camera;
		var WIDTH = parseInt(renderer.domElement.clientWidth);
		var HEIGHT = parseInt(renderer.domElement.clientHeight);

		if (renderer.getSize().width != WIDTH ||
			renderer.getSize().height != HEIGHT) 
		{	
			renderer.setSize(WIDTH, HEIGHT);
			camera.left = -WIDTH/2;
	        camera.right = WIDTH/2;
	        camera.top = -HEIGHT/2;
	        camera.bottom = HEIGHT/2;
	        camera.updateProjectionMatrix();
	    }
	}

	$scope.animate();
	$scope.data = {};

	function setInitialTarget()
	{
		ProfileService.getCurrentProfile().then(function(res)
		{
			console.log('currentProfile:',res)
			if (res) {
				if (res.targetF3)
				{
					$scope.data.targetF3 = res.targetF3;
					console.log('existing targetf3:', res.targetF3)
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
		})
	}

	setInitialTarget();

	$scope.updateTarget = function()
	{	
		// Move value bubble
		var wrappedElement = angular.element(element);
		var control = wrappedElement.find('input');

		var controlMin = control.attr('min')
		var controlMax = control.attr('max')
		var controlVal = control.val();
		var controlThumbWidth = control.attr('data-thumbwidth');

		var range = controlMax - controlMin;

		var position = ((controlVal - controlMin) / range) * 100;

		var positionOffset = Math.round(controlThumbWidth * position / 100) - (controlThumbWidth / 2);
		var output = control.next('output');

		output
		.css('left', 'calc(' + position + '% - ' + positionOffset + 'px)')
		.text(controlVal);

		// Update current user's Target F3
		ProfileService.getCurrentProfile().then(function(res)
		{
			if (res) {
				var currentProfile = res;
				currentProfile.targetF3 = parseInt($scope.data.targetF3);
				ProfileService.saveProfile(currentProfile);
			}
		})
	}

	$scope.resetF3 = function() {
		ProfileService.getCurrentProfile().then(function(res)
		{
			if(res)
			{
				$scope.data.targetF3 = ProfileService.lookupDefaultF3(res);
				$timeout(function()
				{
					$scope.updateTarget();
				})
			}
		})
	}

	$scope.$parent.$on('$ionicView.afterEnter', function() {
		$scope.active = true;
		$scope.animate();

		setInitialTarget();
	});

	$scope.$parent.$on('$ionicView.beforeLeave', function() {
		$scope.active = false;
	});

	$scope.$watch('targetF3', function()
	{
		console.log('target changed to: ', $scope.targetF3);
		$scope.updateTarget();
	});

} );
