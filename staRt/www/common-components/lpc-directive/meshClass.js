/* global Mesh:false, svgLoaderToMesh:false */

function Mesh() {
	//this.hello = () => console.log('LETS MAKE SOME MESHES!');
} // end Mesh Constructor

/*
Mesh is just a class through which to access each static mesh Group's 'create' function when needed. It is scoped to the lpc-renderer.
Rationale: its easier just to attach just 1 provider/class, 'Mesh,' to the lpcDirective.
All the Mesh.create fx are called from LPCRenderer.drawScene()

Each Mesh.create function returns a THREE.Group to the lpc-renderer scene. The the incoming svgs and three drawings are composited with in their Group (local space), and then the Groups are compositted into the scene with LPCRenderer.drawScene()
*/


Mesh.prototype.createBubBtn = function(dim, bubBtnGroup, materials) {
	//console.log( 'create BubBtn');

	var pauseGroup, playGroup;

	var seg = 32;
	var bubScale = 0.33;
	var bubRadius = dim.col_W * bubScale;

	function createBubs() {

		function createBubShad() {
			var geom = new THREE.CircleGeometry( bubRadius, seg);
			var mat = materials.filter(function (obj) {
				return obj.name === 'bubShad';
			});

			var mesh = new THREE.Mesh(geom, mat);
			mesh.position.set(2, -2, 6);
			mesh.name = 'bubBtn';

			bubBtnGroup.add(mesh);
		}

		function createBubBg() {
			var geom = new THREE.CircleGeometry( bubRadius, seg);
			var mat = materials.filter(function (obj) {
				return obj.name === 'bubBg';
			});

			var mesh = new THREE.Mesh(geom, mat);
			mesh.position.set(0, 0, 7);
			mesh.name = 'bubBtn';

			bubBtnGroup.add(mesh);
		}

		function createBubHl() {
			var r = dim.col_W * 0.08;

			var geom = new THREE.CircleGeometry(r, seg);
			var mat = materials.filter(function (obj) {
				return obj.name === 'whiteMat';
			});

			var mesh = new THREE.Mesh(geom, mat);
			mesh.position.set(-9, 12, 8);
			mesh.name = 'bubBtn';

			bubBtnGroup.add(mesh);
		}

		createBubShad();
		createBubBg();
		createBubHl();

		bubBtnGroup.position.set(dim.col_W * 3.25, dim.row_H, 6);
	} // end createBubs


	// ----------------------------------------
	function createPauseBtn() {
		pauseGroup = new THREE.Group();
		pauseGroup.name = 'pauseGroup';

		var s = bubScale + 0.1;

		svgLoaderToMesh(
			'img/lpcDir/pauseIcon.svg',
			'pauseIcon',
			pauseGroup
		);

		pauseGroup.scale.set(s, s, s);
		pauseGroup.position.set(-15, 15, 9);
		pauseGroup.visible = true;

		bubBtnGroup.add(pauseGroup);
	} // createPauseBtn()


	function createPlayBtn() {
		playGroup = new THREE.Group();
		playGroup.name = 'playGroup';
		var s = bubScale + 0.1; //arbitrary scale factor

		svgLoaderToMesh(
			'img/lpcDir/playIcon.svg',
			'playIcon',
			playGroup
		);

		playGroup.scale.set(s, s, s);
		playGroup.position.set(-13, 13, 9);
		playGroup.visible = false;

		bubBtnGroup.add(playGroup);
	} // createPlayBtn()


	// ---------------------------
	createBubs();
	createPauseBtn();
	createPlayBtn();
};

Mesh.prototype.createPostLeft = function(dim, graphicsGroup, materials, roundedRect) {
	//console.log( 'create postLeft!');

	var postBigGroup = new THREE.Group();
	postBigGroup.name = 'postLeftGroup';

	var ropeGroup = new THREE.Group();
	ropeGroup.name = 'ropeGroup';

	var fzSignGroup = new THREE.Group();
	fzSignGroup.name = 'fzSignGroup';

	function createRopes() {
		var ropeGroupTop = new THREE.Group();
		var r = 3;
		var h = dim.row_H * 0.05;

		function createRopeBG() {
			var w = dim.col_W * 0.74;

			var shape = new THREE.Shape();
			// roundedRect: (shape, x, y, w, h, r)
			shape = roundedRect(shape, 0, 0, w, h, r);

			var geom = new THREE.ShapeGeometry(shape);
			var mat = materials.filter(function (obj) {
				return obj.name === 'ropeDark';
			});

			var rope = new THREE.Mesh(geom, mat);
			rope.position.set(0, 0, 2);

			ropeGroupTop.add(rope);
		}

		function createRopeHL() {
			var w = dim.col_W * 0.4;

			var shape = new THREE.Shape();
			shape = roundedRect(shape, 0, 0, w, h, r);
			var geom = new THREE.ShapeGeometry(shape);
			var mat = materials.filter(function (obj) {
				return obj.name === 'ropeLight';
			});

			var ropeHL = new THREE.Mesh(geom, mat);
			ropeHL.position.set(0, 0, 3);

			ropeGroupTop.add(ropeHL);
		}

		createRopeBG();
		createRopeHL();

		var ropeGroupBottom = ropeGroupTop.clone();
		ropeGroupBottom.position.set(-1, -10, 0);
		ropeGroupBottom.rotation.set(0, 0, -0.1);

		ropeGroup.add(ropeGroupTop, ropeGroupBottom);

		var xpos = dim.col_W * -3.62;
		var ypos = dim.row_H * -0.2;
		ropeGroup.position.set(xpos, ypos, 6);
		ropeGroup.rotation.set(0, 0, -0.1);

		graphicsGroup.add(ropeGroup);
	} // end create_ropes()


	// MESH CALLBACKS ---------------------------
	function postBigCB() {
		// var s = 0.75;
		// postBigGroup.scale.set(s, s, s);

		var xpos = (dim.col_W * -3.75) - 4;
		var ypos = (dim.row_H * 0.5);
		var zpos = 5;
		var zrot = 0;
		postBigGroup.position.set(xpos, ypos, zpos);
		postBigGroup.rotation.set(0, 0, zrot);

		graphicsGroup.add(postBigGroup);

		createRopes();
	}

	function fzSignCB() {
		// var s = 0.75;
		// fzSignGroup.scale.set(s, s, s);

		var xpos = dim.col_W * -3.8;
		var ypos = dim.row_H * 0.23;
		var zpos = 7;
		var zrot = 0;
		fzSignGroup.position.set(xpos, ypos, zpos);
		fzSignGroup.rotation.set(0, 0, zrot);

		graphicsGroup.add(fzSignGroup);
	}

	// LOAD SVG ---------------------------
	function loadPostBig() {
		svgLoaderToMesh('img/lpcDir/postBig.svg', 'postBig', postBigGroup, postBigCB);
	}

	function loadFzSign() {
		svgLoaderToMesh('img/lpcDir/fzSign.svg', 'fzSign', fzSignGroup, fzSignCB);
	}

	// ----------------------------------------
	//createPost();
	loadPostBig();
	loadFzSign();
};

Mesh.prototype.createPostRight = function(dim, graphicsGroup) {
	//console.log( 'create postRight!');

	var postRightGroup = new THREE.Group(); // parent group
	postRightGroup.name = 'postRightGroup';

	var postSmallGroup = new THREE.Group(); // 3 mesh
	postSmallGroup.name = 'postSmallGroup';

	var resetBtnGroup = new THREE.Group(); // 5 mesh
	resetBtnGroup.name = 'resetBtnGroup';

	// MESH CALLBACKS ---------------------------
	var sy = 1.2;
	var s = 1;

	function postSmallCB() {
		postSmallGroup.scale.set(s, sy, s);

		var xpos = dim.col_W * 3.9;
		var ypos = dim.row_H * -0.1;
		var zpos = 5;
		var zrot = -0.09;
		postSmallGroup.position.set(xpos, ypos, zpos);
		postSmallGroup.rotation.set(0, 0, zrot);
	}

	function resetBtnCB() {
		//resetBtnGroup.scale.set(s, s, s);
		var xpos = dim.col_W * 3.45;
		var ypos = dim.row_H * -0.2;
		var zpos = 7;
		var zrot = -0.09;
		resetBtnGroup.position.set(xpos, ypos, zpos);
		resetBtnGroup.rotation.set(0, 0, zrot);
	}

	// LOAD SVG ---------------------------
	function loadPostSmall() {
		svgLoaderToMesh('img/lpcDir/postSmall.svg', 'postSmall', postSmallGroup, postSmallCB);
	}
	function loadresetBtn() {
		svgLoaderToMesh('img/lpcDir/signWood.svg', 'resetBtn', resetBtnGroup, resetBtnCB);
	}

	// ---------------------------
	loadPostSmall();
	loadresetBtn();

	postRightGroup.add(postSmallGroup, resetBtnGroup);
	postRightGroup.position.z = 5;

	graphicsGroup.add(postRightGroup);
};

Mesh.prototype.createRightTailGroup = function(dim, graphicsGroup) {
	var rightTailGroup = new THREE.Group();
	rightTailGroup.name = 'rightTailGroup';

	function rightTailCB() {
		console.log('rightTail CB');
		var xpos = dim.col_W * 4;
		var ypos = (dim.row_H * 0.98);
		var zpos = 3;
		rightTailGroup.position.set(xpos, ypos, zpos);
	}

	// LOAD SVG ---------------------------
	function loadRightTail() {
		svgLoaderToMesh(
			'img/lpcDir/rightTail.svg',
			'rightTail',
			rightTailGroup,
			rightTailCB
		);
	}

	loadRightTail();

	graphicsGroup.add(rightTailGroup);
};

Mesh.prototype.createFoamGroup = function(dim, graphicsGroup, materials) {
	// console.log( 'create Foam Group');

	var foamGroup = new THREE.Group();
	foamGroup.name = 'foamGroup';

	// MESH CALLBACK ---------------------------
	function foamBaseCB() {
		//console.log('foambase CB');
		var xpos = dim.col_W * -3.35;
		var ypos = (dim.row_H * -0.65); //-0.75
		var zpos = 4;
		foamGroup.position.set(xpos, ypos, zpos);

		foamGroup.children.forEach(function (i) {
			i.material.transparent = true;
			i.material.opacity = 0.85;
		});

		graphicsGroup.add(foamGroup);
	}

	// LOAD SVG ---------------------------
	function loadFoamBase() {
		svgLoaderToMesh(
			'img/lpcDir/foamBase.svg',
			'foamBase',
			foamGroup,
			foamBaseCB
		);
	}

	loadFoamBase();
};

Mesh.prototype.createSlider = function(dim, sliderGroup, materials, starName) {

	/* note: for some reason dim resets a few times when loading, which screws up mesh.scale.set() cuz the transform in the SVG loader ( Matrix3.getInverse() ) can't ever handle 0s. Everthing else seems fine with the normal dim arg.  */

	// var localDim = dim;

	var starGroup = new THREE.Group();
	starGroup.name = 'starGroup';

	// MESHES --------------------------------------
	function createNeedle() {
		var geom = new THREE.PlaneGeometry(2, ((dim.row_H * 1.75) + 3));
		var mat = materials.filter(function (obj) {
			return obj.name === 'yellowMain';
		});

		var mesh = new THREE.Mesh(geom, mat);
		mesh.position.set(0, 4, 4);
		mesh.name = 'needle';

		sliderGroup.add(mesh);
		createNeedleHL();
	}

	function createNeedleHL() {
		var geom = new THREE.PlaneGeometry(1, ((dim.row_H * 1.75) + 3));
		var mat = materials.filter(function (obj) {
			return obj.name === 'yellowHL';
		});

		var mesh = new THREE.Mesh(geom, mat);
		mesh.position.set(-1, 4, 5);
		mesh.name = 'needle';

		sliderGroup.add(mesh);
	}

	// SVG->MESH CALLBACK ---------------------------
	function starCB() {
		// var s = localDim.col_W / 100; // star should be col_W * 1
		var s = 0.853; // (1024 / 12) / 100;
		starGroup.scale.set(s, s, s);

		var xpos = dim.col_W * -0.5;
		var ypos = dim.row_H * -0.75;
		starGroup.position.set(xpos, ypos, 4);

		sliderGroup.add(starGroup);
	}

	// LOAD SVG ---------------------------
	function loadStar() {
		svgLoaderToMesh('img/lpcDir/star.svg', starName, starGroup, starCB);
	}

	// ---------------------------
	createNeedle();
	loadStar();

	sliderGroup.position.x = dim.defaultTargetX;
	sliderGroup.position.z = 7;
};


// EXPORTS =======================================
var lpcDirective = angular.module('lpcDirective');
lpcDirective.value('Mesh', new Mesh());
