/*globals console:false, angular:false, window:false, alert:false */
/*globals THREE:false, AudioPlugin:false */

'use strict';

var lpcDirective = angular.module( 'lpcDirective' );

lpcDirective.controller( 'LpcDirectiveController', function( $rootScope, $scope, $state, $stateParams, $element, $timeout )
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

	var canvas = document.getElementById("lpc-canvas");
	var renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
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

	var line;
	var peaks, points, frequencyScaling;
	var peakSegments;

	$scope.lpcCoefficientCallback = function(msg) {
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
		$scope.getLPCCoefficients($scope.lpcCoefficientCallback);
		window.requestAnimFrame($scope.animate);
		$scope.update();
		renderer.render(scene, camera);
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

	$scope.updateFilter = function()
	{
		var wrappedElement = angular.element(element);
		var control = wrappedElement.find('input');

		var controlMin = control.attr('min')
		var controlMax = control.attr('max')
		var controlVal = control.val()
		var controlThumbWidth = control.attr('data-thumbwidth');

		var range = controlMax - controlMin;

		var position = ((controlVal - controlMin) / range) * 100;

		console.log(position, controlThumbWidth)

		var positionOffset = Math.round(controlThumbWidth * position / 100) - (controlThumbWidth / 2);
		var output = control.next('output');

		console.log('position: ', position);
		console.log('positionOffset: ', positionOffset);

		output
		.css('left', 'calc(' + position + '% - ' + positionOffset + 'px)')
		.text(controlVal);
	}

	$timeout(function()
	{
		$scope.updateFilter();
	});

} );
