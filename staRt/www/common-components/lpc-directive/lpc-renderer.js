var lpcDirective = angular.module('lpcDirective');

var colors = Object.freeze({
	yellowMain: 0xFFC95F,
	yellowLight: 0xFFECCB,
	blueMain: 0x53C8E9,
	blueLight: 0xC5F3FF,
	blueDark: 0x018B9D,
	white: 0xffffff,
	grayTxt: 0x4d4d4d
});

function linScale(v, inlow, inhigh, outlow, outhigh) {
		var range = outhigh - outlow;
		var domain = inhigh - inlow;
		var ov = (v - inlow) / domain;
		ov = (ov * range) + outlow;
		return ov;
	}

lpcDirective.factory('LPCRenderer', function (Drawing, $http)
{
	function LPCRenderer(element, maxNumPeaks)
	{
		this.maxNumPeaks = maxNumPeaks;
		this.initialize(element);
	}

	Object.defineProperty(LPCRenderer.prototype, 'sliderPosition', {
		set: function sliderPosition(s) {
			if (s > 1) s = 1;
			if (s < 0) s = 0;
			this.slider.position.x = linScale(s, 0, 1, this.LEFT, this.RIGHT);
		}
	});

	Object.defineProperty(LPCRenderer.prototype, 'targetFrequency', {
		set: function targetFrequency(f) {
			this.updateTextSprite( Math.floor(f) );
		}
	});

	Object.defineProperty(LPCRenderer.prototype, 'doShowSand', {
		get: function() { return this.sand.visible; },
		set: function(sand) {
			this.sand.visible = sand;
		}
	});

	Object.defineProperty(LPCRenderer.prototype, 'doShowSlider', {
		get: function() { return this.slider.visible },
		set: function(slider) {
			this.slider.visible = slider;
		}
	});

	LPCRenderer.prototype.injectRenderer = function(renderer, element)
	{
		var containerDiv = angular.element(element[0].querySelector('.slider-and-canvas'))[0];

		var firstElt = null;

		if (containerDiv.children.length > 0) firstElt = containerDiv.children[0];

		if (firstElt) {
			containerDiv.insertBefore(firstElt, renderer.domElement);
		} else {
			containerDiv.appendChild(renderer.domElement);
		}
	};

	LPCRenderer.prototype.getDrawingDim = function(canvas)
	{
		// These might be needed if the css throws off our current clientWidth & clientHeight measurements
		// waveHolderStyles = window.getComputedStyle(waveHolder);
		// canvasOffset = waveHolderStyles.marginLeft;
		// console.log("offset is: " + canvasOffset);

		this.WIDTH = canvas.clientWidth;
		this.HEIGHT = canvas.clientHeight;
		this.ASPECT = this.WIDTH / this.HEIGHT;

		// 3d coords
		this.LEFT =  this.WIDTH / -2;
		this.RIGHT = this.WIDTH / 2;
		this.TOP = 	this.HEIGHT / 2;
		this.BOTTOM = this.HEIGHT / -2;

		// obj boundaries
		this.yOffset = this.HEIGHT * 0.15; //shifts y=0 up due to sand
		this.waveBottom = this.BOTTOM + this.yOffset;

		//waveTop = TOP - yOffset;
		this.padH = this.WIDTH * 0.05; // scene padding
		this.padV = this.HEIGHT * 0.05; // scene padding

		this.btnRad = 30; // button radius
		this.btnBox = (this.padH * 2) + this.btnRad;

		this.sliderWidth = this.RIGHT - this.btnBox;
	};

	LPCRenderer.prototype.buildStage = function()
	{
		this.scene = new THREE.Scene();
		this.camera = new THREE.OrthographicCamera(this.LEFT, this.RIGHT, this.TOP, this.BOTTOM, 1, 1000);
		this.camera.position.set(0, 0, 100);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.camera.updateProjectionMatrix();
		this.scene.add(this.camera);

		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setClearColor(0xc5f3ff, 1.0);
		this.renderer.setSize(this.WIDTH, this.HEIGHT);
	};

	LPCRenderer.prototype.buildMaterials = function()
	{
		// basic mesh mats
		this.blueMat = new THREE.MeshBasicMaterial({ color: colors.blueMain});
		this.blueMat.side = THREE.DoubleSide;

		this.yellowMat = new THREE.MeshBasicMaterial({ color: colors.yellowMain});
		//yellowMat.side = THREE.DoubleSide;

		this.whiteMat = new THREE.MeshBasicMaterial({ color: colors.white});
		//whiteMat.side = THREE.DoubleSide;

		this.sandMat = new THREE.MeshBasicMaterial({ color: colors.yellowLight});
		//sandMat.side = THREE.DoubleSide;

		// basic line mats
		this.peakMat = new THREE.LineBasicMaterial({ color: 0x2095b6 });
		//blueDarkLineMat = new THREE.LineBasicMaterial({ color: 0x2095b6 });

		this.needleMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
	};

	// Really dumb hittest that just returns the name of the hit object, if any
	LPCRenderer.prototype.hitTest = function(point)
	{
		// NDC for raycaster. raycaster will ONLY accept NDC for mouse events
		point.x = 2 * (point.x / this.canvas.clientWidth );
		point.y = (( point.y / this.canvas.clientHeight ) * -2);


		this.raycaster.setFromCamera(point, this.camera); // gives the raycaster coords from mouse (NDC) & cam (world) positions

		var intersects = this.raycaster.intersectObjects(this.scene.children, true); // cast a ray & get an array of things that it hits. 'recursive = true' is necessary to autoloop thru the descendants of grouped objs (i.e. scence.children's children)
		//console.log(intersects.length);

		if (intersects.length > 0) { // if the ray hits things
			for ( var i = 0; i < intersects.length; i++ ) {

				var INTERSECTED = intersects[i];

				return INTERSECTED.object.name;
			}
		}
	}

	LPCRenderer.prototype.updateWave = function(points, peaks, frequencyScaling)
	{
		// Make an array of all the topmost points
		var shapeArr = [];
		for (var i=0; i<points.length; i++) {
			var point = points[i] * this.TOP;
			var px = linScale(i * frequencyScaling, 0, points.length-1, this.LEFT, this.RIGHT);
			shapeArr.push([px, point]);
		}

		// Setup the geometry and its faces
		if (this.waveGeometry === undefined) {
			var tmpGeometry = new THREE.Geometry();

			for (var i=1; i<shapeArr.length; i++) {
				tmpGeometry.vertices.push(new THREE.Vector3(shapeArr[i-1][0], this.BOTTOM, 0));
				tmpGeometry.vertices.push(new THREE.Vector3(shapeArr[i][0], shapeArr[i][1], 0));
				if (i>0) {
					tmpGeometry.faces.push(new THREE.Face3((i-1)*2, (i-1)*2 + 1, (i-1)*2 + 2));
					tmpGeometry.faces.push(new THREE.Face3((i-1)*2 + 2, (i-1)*2 + 1, (i-1)*2 + 3));
				}
			}

			this.waveGeometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
			this.waveGeometry.dynamic = true;
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
			var p = this.waveGeometry.attributes.position.array;
			var idx = (i-1) * 18;
			p[idx++] = shapeArr[i-1][0]; // Bottom-left
			p[idx++] = this.BOTTOM; //bottomEdge;
			p[idx++] = 0;
			p[idx++] = shapeArr[i-1][0]; // Top-left
			p[idx++] = shapeArr[i-1][1];
			p[idx++] = 0;
			p[idx++] = shapeArr[i][0]; // Top-right
			p[idx++] = shapeArr[i][1];
			p[idx++] = 0;
			p[idx++] = shapeArr[i-1][0]; // Bottom-left
			p[idx++] = this.BOTTOM; //bottomEdge;
			p[idx++] = 0;
			p[idx++] = shapeArr[i][0]; // Bottom-right
			p[idx++] = this.BOTTOM; //bottomEdge;
			p[idx++] = 0;
			p[idx++] = shapeArr[i][0]; // Top-right
			p[idx++] = shapeArr[i][1];
			p[idx++] = 0;
		}

		this.waveGeometry.attributes.position.needsUpdate = true;

		if (this.waveMesh === undefined) {
			this.waveMesh = new THREE.Mesh(this.waveGeometry, this.blueMat);
			this.waveMesh.name = "wave";
			this.scene.add( this.waveMesh );
		}

		// Update peaks
		for (var i = 0; i < this.maxNumPeaks; i++) {
			var px = 0, py = this.BOTTOM;
			if (i < peaks.length) {
				var peak = peaks[i];
				px = linScale(peak.X, -1, 1, 0, frequencyScaling);
				px = linScale(px, 0, 1, this.LEFT, this.RIGHT);
				py = linScale(peak.Y, 1, -1, this.TOP, this.BOTTOM);
			}
			this.peakSegments.geometry.vertices[2*i].x = px;
			this.peakSegments.geometry.vertices[2*i].y = py;
			this.peakSegments.geometry.vertices[2*i+1].x = px;
			this.peakSegments.geometry.vertices[2*i+1].y = this.BOTTOM;
		}

		this.peakSegments.geometry.verticesNeedUpdate = true;
	};

	LPCRenderer.prototype.drawScene = function()
	{
		this.slider = new THREE.Object3D();
		this.slider.name = this.slider;

		this.slider.position.set(-100000, 0, 9); // offscreen to start
		this.scene.add(this.slider);

		this.needle = this.createNeedle();
		this.slider.add(this.needle);

		this.sand = this.createSand();
		this.scene.add(this.sand);

		this.label = this.createLabel();
		this.label.geometry.computeBoundingBox();
		this.slider.add(this.label);

		this.textSprite = this.initializeTextSprite();

		// Could eventually use this to draw the star as an SVG---only problem
		// is it's not supported by Safari.
		// $http.get('img/star2.svg').then( (function(res) {
		// 	this.createStar(res.data, (function(star) {
		// 		this.star = star;
		// 		this.star.position.set(5, -120, 10);
		// 		this.slider.add(this.star);
		// 	}).bind(this) );
		// }).bind(this) );

		var textureLoader = new THREE.TextureLoader();
		textureLoader.load('img/star.png', (function(starTex) {
			this.createStarFromTexture(starTex, (function(starSprite) {
				this.star = starSprite;
				this.star.position.set(0, -125, 10);
				this.slider.add(this.star);
			}).bind(this));
		}).bind(this));

		this.pauseButton = this.createPauseButton();
		this.scene.add(this.pauseButton);

		this.targetButton = this.createTargetButton();
		this.scene.add(this.targetButton);

		this.targetFrequency = this.savedTarget;

		this.peakSegments = this.createPeakSegments();
		this.scene.add(this.peakSegments);

		// temporarily disable both of those silly buttons
		this.pauseButton.visible = false;
		this.targetButton.visible = false;
	};

	LPCRenderer.prototype.createLabel = function()
	{
		var labelWidth = 75;
		var labelHeight = 35;
		var labelRad = 10;

		var labelShape = new THREE.Shape();
		Drawing.roundedRect(labelShape, 0, 0, labelWidth , labelHeight, labelRad);

		var labelGeom = new THREE.ShapeGeometry(labelShape);
		var label = new THREE.Mesh(labelGeom, this.whiteMat);

		label.position.set(labelWidth/-2, this.TOP - this.padH, 8 );
		label.name = "label";

		return label;
	};

	LPCRenderer.prototype.initializeTextSprite = function()
	{
		this.canvas2d = document.createElement('canvas');
		this.canvas2d.width = 256;
		this.canvas2d.height = 128;

		this.textTexture = new THREE.CanvasTexture( this.canvas2d );
		this.spriteMaterial = new THREE.SpriteMaterial( {
			map: this.textTexture,
		});

		this.textSprite = new THREE.Sprite( this.spriteMaterial );
		this.textSprite.scale.set(256, 128, 1.0);
		this.textSprite.name = "fzLabel";

		var px = (this.label.geometry.boundingBox.max.x) / 2;
		var py = (this.label.geometry.boundingBox.max.y) / 2;

		this.textSprite.position.set(px, py, 0);
		this.label.add( this.textSprite );
	};

	LPCRenderer.prototype.updateTextSprite = function(message)
	{
		var color = "#4d4d4d";

		var ctx = this.canvas2d.getContext('2d');

		ctx.clearRect(0, 0, 256, 128);

		ctx.font = "20px Quicksand";
		ctx.fillStyle = color;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(message, this.canvas2d.width/2, this.canvas2d.height/2);

		this.textTexture.needsUpdate = true;
	}

	LPCRenderer.prototype.createSand = function() {
		var sandShape = new THREE.Shape();
		sandShape.moveTo(this.LEFT, this.waveBottom);
		sandShape.lineTo(this.RIGHT, this.waveBottom);
		sandShape.lineTo(this.RIGHT, this.BOTTOM);
		sandShape.lineTo(this.LEFT, this.BOTTOM);
		sandShape.lineTo(this.LEFT, this.waveBottom);

		var sandGeom = new THREE.ShapeGeometry(sandShape);

		sand = new THREE.Mesh(sandGeom, this.sandMat);
		sand.name = "sand";

		sand.position.set(0,0,9);

		return sand;
	};

	LPCRenderer.prototype.createNeedle = function() {
		var needleGeom = new THREE.Geometry();

		needleGeom.vertices.push(
			new THREE.Vector3(0, this.waveBottom, 7),
			new THREE.Vector3(0, this.TOP, 7 )
		);

		var needle = new THREE.Line(needleGeom, this.needleMat);
		needle.name = "needle";

		return needle;
	};

	LPCRenderer.prototype.createStar = function(starSvg, callback) {
		var cwidth = 256;
		var cheight = 256;
		var canvas2d = document.createElement('canvas');
		canvas2d.width = cwidth;
		canvas2d.height = cheight;
		var ctx = canvas2d.getContext('2d');

		var DOMURL = window.URL || window.webkitURL || window;

		var img = new Image();
		var svg = new Blob([starSvg], {type: 'image/svg+xml'});
		var url = DOMURL.createObjectURL(svg);

		img.onload = function () {
			ctx.drawImage(img, 0, 0);
			DOMURL.revokeObjectURL(url);

			var tex = new THREE.CanvasTexture(canvas2d);

			var spriteMaterial = new THREE.SpriteMaterial( {
				map: tex
			} );

			var starSprite = new THREE.Sprite(spriteMaterial);
			starSprite.scale.set(65, 65, 1.0);

			callback(starSprite);
		}

		img.src = url;
	}

	LPCRenderer.prototype.createStarFromTexture = function(starTexture, callback) {
		var spriteMaterial = new THREE.SpriteMaterial( { map: starTexture } );
		var starSprite = new THREE.Sprite(spriteMaterial);
		starSprite.scale.set(55, 65, 1.0);

		callback(starSprite);
	}

	LPCRenderer.prototype.createPauseButton = function() {
		var pauseShape = new THREE.Shape();
		var radius = 30;
		Drawing.circle(pauseShape, 0, 0, radius);

		var pauseGeom = new THREE.ShapeGeometry(pauseShape);
		pauseBtn = new THREE.Mesh(pauseGeom, this.yellowMat);

		pauseBtn.position.set(this.RIGHT - ((radius / 2) + this.padH), this.TOP - ((radius / 2) + this.padV), 10);
		pauseBtn.name = "pauseBtn";

		return pauseBtn;
	};

	LPCRenderer.prototype.createTargetButton = function() {
		var targetShape = new THREE.Shape();
		var radius = 30;
		Drawing.circle(targetShape, 0, 0, radius);

		var targetGeom = new THREE.ShapeGeometry(targetShape);
		targetBtn = new THREE.Mesh(targetGeom, this.yellowMat);

		targetBtn.position.set(this.RIGHT - ((radius / 2) + this.padH), this.BOTTOM + (this.yOffset / 2), 10);
		targetBtn.name = "targetBtn";

		return targetBtn;
	};

	LPCRenderer.prototype.createPeakSegments = function() {
		var peakGeometry = new THREE.Geometry();
		for (var i=0; i < this.maxNumPeaks; i++) {
			peakGeometry.vertices.push(new THREE.Vector3(0,0,1));
			peakGeometry.vertices.push(new THREE.Vector3(0,0,1));
		}
		var peakSegments = new THREE.LineSegments(peakGeometry, this.peakMat);
		peakSegments.geometry.dynamic = true;

		return peakSegments;
	};

	LPCRenderer.prototype.render = function() {
		this.renderer.render(this.scene, this.camera);
	};

	LPCRenderer.prototype.initialize = function(element)
	{
		this.renderer = new THREE.WebGLRenderer({ antialias: true });

		this.injectRenderer(this.renderer, element);

		this.canvas = this.renderer.domElement;
		this.canvas.id = "lpc-canvas";

		this.savedTarget = 2247;

		this.getDrawingDim(this.canvas);

		this.buildStage();

		this.buildMaterials();

		this.drawScene();

		this.raycaster = new THREE.Raycaster();
	}

	return LPCRenderer;
});