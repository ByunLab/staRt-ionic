/*globals console:false, angular:false, window:false, alert:false */
/*globals THREE:false, AudioPlugin:false */

'use strict';

var lpcDirective = angular.module( 'lpcDirective' );

lpcDirective.controller( 'LpcDirectiveController', function( $rootScope, $scope, $state, $stateParams, $element, $timeout, $localForage, ProfileService )
{

	$scope.data = {};

	$scope.$watchCollection('data', function()
	{
		$scope.$emit('ratingChange', $scope.data.rating);
	})

	console.log('LpcDirectiveController active!');


	////////////////////////////
	//  Helpers
	////////////////////////////

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
		} else {
			$scope.makeDummyData(cb);
		}
	};


	var pointCount = 256;
	var dummyPoints = [];
	for (var i=0; i<pointCount; i++)
		dummyPoints.push(0);
	var dummyNoisiness = 0.05

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
		for (var i=0; i<pointCount; i++) {
			if (i==0 || i==(pointCount-1))
				msg.coefficients.push(dummyPoints[i])
			else {
				var vrg = dummyPoints[i-1] + dummyPoints[i] + dummyPoints[i+1]
				msg.coefficients.push(vrg/3);
			}
		}
		for (var i=0; i<pointCount; i++) {
			if (i>0 && i<(pointCount-1)) {
				if (dummyPoints[i-1] > dummyPoints[i] && dummyPoints[i] < dummyPoints[i+1]) {
					msg.freqPeaks.push({
						X: linScale(i, 0, pointCount-1, -1, 1),
						Y: msg.coefficients[i]
					});
				}
			}
		}
		msg.freqScale = 2.2;
		if (cb)
			cb(msg);
	}

	////////////////////////////
	//  Setup
	////////////////////////////

		var containerDiv;
		for (var i=0; i<element.children().length; i++) {
			var e = element.children()[i];
			if (e.nodeName === "DIV" && e.classList.contains("lpc-container"))
				containerDiv = e;
		}
		var firstElt;
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
		var WIDTH=canvas.clientWidth;
		var HEIGHT=canvas.clientHeight;
		var ASPECT = WIDTH/HEIGHT;
		var camera = new THREE.OrthographicCamera(WIDTH/-2, WIDTH/2, HEIGHT/-2, HEIGHT/2, 1, 1000);
		var scene = new THREE.Scene();
		scene.add(camera);
		camera.position.set(0, 0, 100);
		camera.lookAt(new THREE.Vector3(0, 0, 0));
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setClearColor(0xc5f3ff, 1.0);
		renderer.setSize(WIDTH, HEIGHT);

		$scope.canvas = canvas;
		$scope.renderer = renderer;
		$scope.camera = camera;
		$scope.active = false;

		// materials
		var waveMat = new THREE.MeshBasicMaterial({ color: 0x53C8E9 });
		waveMat.side = THREE.DoubleSide;
		var peakMat = new THREE.LineBasicMaterial({ color: 0x2095b6 });
		var texloader = new THREE.TextureLoader();
		var starTex = texloader.load('img/star.png');
		var starMat = new THREE.SpriteMaterial( { map: starTex, rotation:Math.PI } );
		var starSprite = new THREE.Sprite(starMat);
		starSprite.scale.set(53, 61, 1);
		starSprite.position.set(0, 0, 1);
		scene.add(starSprite);

		// sand
		if ($scope.sand) {
			var sandMat = new THREE.MeshBasicMaterial({ color: 0xffeccb });
			sandMat.side = THREE.DoubleSide;
			var sandShape = new THREE.Shape();
			sandShape.moveTo( -WIDTH/2, HEIGHT/2 );
			sandShape.lineTo( -WIDTH/2, HEIGHT/2 - 60 );
			sandShape.lineTo( WIDTH/2, HEIGHT/2 - 60 );
			sandShape.lineTo( WIDTH/2, HEIGHT/2 );
			sandShape.lineTo( -WIDTH/2, HEIGHT/2 );

			var sandGeo = new THREE.ShapeGeometry( sandShape );
			var sandMesh = new THREE.Mesh( sandGeo, sandMat ) ;
			scene.add( sandMesh );
		}

	////////////////////////////
	//  Draw
	////////////////////////////
		var leftEdge, rightEdge, topEdge, bottomEdge;  // scene boundaries
		var peaks, points, frequencyScaling; // incoming data

		var waveGeometry = undefined; // created on demand with first peaks
		var peakGeometry = new THREE.Geometry();
		var maxNumPeaks = 20;
		for (var i=0; i<maxNumPeaks; i++) {
			peakGeometry.vertices.push(new THREE.Vector3(0,0,1));
			peakGeometry.vertices.push(new THREE.Vector3(0,0,1));
		}
		var peakSegments = new THREE.LineSegments(peakGeometry, peakMat);
		peakSegments.geometry.dynamic = true;
		scene.add(peakSegments);
		var waveMesh;

		$scope.lpcCoefficientCallback = function(msg) {

			if ($scope.active) {
				WIDTH = renderer.getSize().width;
				HEIGHT = renderer.getSize().height;
				leftEdge = WIDTH/-2;
				rightEdge = WIDTH/2;
				topEdge = HEIGHT/-2;
				bottomEdge = HEIGHT/2;

				if ($scope.sand) {
					HEIGHT -= 60;
					bottomEdge -= 60;
				}

				points = msg.coefficients;
				peaks = msg.freqPeaks;
				frequencyScaling = msg.freqScale;

				// Make an array of all the topmost points
				var shapeArr = [];
		    	for (var i=0; i<points.length; i++) {
		    		var point = points[i] * HEIGHT/-2;
		    		var px = linScale(i * frequencyScaling, 0, points.length-1, WIDTH/-2, WIDTH/2);
		    		shapeArr.push([px, point]);
		    	}

		    	// Setup the geometry and its faces
		    	if (waveGeometry === undefined) {
		    		var tmpGeometry = new THREE.Geometry();
		    		for (var i=1; i<shapeArr.length; i++) {
			    		tmpGeometry.vertices.push(new THREE.Vector3(shapeArr[i-1][0], bottomEdge, 0));
			    		tmpGeometry.vertices.push(new THREE.Vector3(shapeArr[i][0], shapeArr[i][1], 0));
			    		if (i>0) {shapeArr[i][0]
				    		tmpGeometry.faces.push(new THREE.Face3((i-1)*2, (i-1)*2 + 1, (i-1)*2 + 2));
				    		tmpGeometry.faces.push(new THREE.Face3((i-1)*2 + 2, (i-1)*2 + 1, (i-1)*2 + 3));
				    	}
					}
		    		waveGeometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
		    		waveGeometry.dynamic = true;
		    	}

		    	// All this does is explicitly update all of the triangles that are being used to draw the 
		    	// wave geometry. Imagine that between every two adjacent points along the top curve we draw
		    	// a long rectangle with a slanted top. The top-left corner of that rectangle is wave[i-1],
		    	// the top-right corner is wave[i], and the bottom left and bottom right are the same points
		    	// but on the bottom edge of the image. This rectangle strip has four points, but we draw it
		    	// as two triangles. Each of those triangles has three points, so there are 3 * 3 vertices
		    	// to update, for each of 2 triangles, for a total of 18 vertices per every point on the
		    	// wave curve.
		    	for (var i=1; i<shapeArr.length; i++) {
		    		var p = waveGeometry.attributes.position.array;
		    		var idx = (i-1) * 18;
		    		p[idx++] = shapeArr[i-1][0]; // Bottom-left
		    		p[idx++] = bottomEdge;
		    		p[idx++] = 0;
		    		p[idx++] = shapeArr[i-1][0]; // Top-left
		    		p[idx++] = shapeArr[i-1][1];
		    		p[idx++] = 0;
		    		p[idx++] = shapeArr[i][0]; // Top-right
		    		p[idx++] = shapeArr[i][1];
		    		p[idx++] = 0;
		    		p[idx++] = shapeArr[i-1][0]; // Bottom-left
		    		p[idx++] = bottomEdge;
		    		p[idx++] = 0;
		    		p[idx++] = shapeArr[i][0]; // Bottom-right
		    		p[idx++] = bottomEdge;
		    		p[idx++] = 0;
		    		p[idx++] = shapeArr[i][0]; // Top-right
		    		p[idx++] = shapeArr[i][1];
		    		p[idx++] = 0;
		    	}
		    	waveGeometry.attributes.position.needsUpdate = true;

		    	if (waveMesh === undefined) {
		    		waveMesh = new THREE.Mesh(waveGeometry, waveMat);
					waveMesh.name = "wave";
					scene.add( waveMesh );
		    	}

				// Update peaks
				for (var i=0; i<maxNumPeaks; i++) {
					var px=0, py=HEIGHT/2;
					if (i < peaks.length) {
						var peak = peaks[i];
						px = linScale(peak.X, -1, 1, 0, frequencyScaling);
						px = linScale(px, 0, 1, WIDTH/-2, WIDTH/2);
						py = linScale(peak.Y, 1, -1, HEIGHT/-2, bottomEdge);
					}
					peakGeometry.vertices[2*i].x = px;
					peakGeometry.vertices[2*i].y = py;
					peakGeometry.vertices[2*i+1].x = px;
					peakGeometry.vertices[2*i+1].y = bottomEdge;
				}
				peakGeometry.verticesNeedUpdate = true;
			}
		};

	$scope.animate = function() {
		if ($scope.active) {
			$scope.getLPCCoefficients($scope.lpcCoefficientCallback);
			window.requestAnimFrame($scope.animate);
			renderer.render(scene, camera);
			$scope.updateTarget();
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


	////////////////////////////
	//  Interaction & Targets
	////////////////////////////

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

	$scope.touched = function($event)
	{
		if (renderer.domElement === $event.target) {
			var WIDTH = parseInt(renderer.domElement.clientWidth);
			var HEIGHT = parseInt(renderer.domElement.clientHeight);
			var px = $event.gesture.srcEvent.layerX - WIDTH/2;
			// var py = $event.gesture.srcEvent.layerY - HEIGHT/2;

			$scope.data.targetF3 = linScale(px, -WIDTH/2, WIDTH/2, 0, 5000);

			$timeout(function()
			{
				$scope.updateTarget();
			});
		}
	}

	$scope.updateTarget = function()
	{
		// Move the star sprite
		var targetf3 = parseInt($scope.data.targetF3);
		var position = linScale(targetf3, 0, 5000, -WIDTH/2, WIDTH/2);
		var offsetY = 100 + ($scope.sand ? -60 : 0);
		starSprite.position.set(position, HEIGHT/2 - offsetY, 1);

		// var output = control.next('output');

		// output
		// .css('left', 'calc(' + position + '% - ' + positionOffset + 'px)')
		// .text(controlVal);

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
		//$scope.updateTarget();
	});

} );
