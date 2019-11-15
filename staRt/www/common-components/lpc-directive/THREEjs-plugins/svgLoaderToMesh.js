/* exported svgLoaderToMesh */

// eslint-disable-next-line no-unused-vars
var svgLoaderToMesh = function(fileUrl, meshName, groupName, cb) {

	var loader = new THREE.SVGLoader();
	loader.load(fileUrl, function(paths) {
		for (var i = 0; i < paths.length; i++) {
			var path = paths[i];

			var material = new THREE.MeshBasicMaterial({
				color: path.color,
				side: THREE.DoubleSide,
			});

			var shapes = path.toShapes(true);

			for (var j = 0; j < shapes.length; j++) {
				var shape = shapes[j];
				var geometry = new THREE.ShapeBufferGeometry(shape);
				geometry.computeBoundingBox();
				var mesh = new THREE.Mesh(geometry, material);
				mesh.rotation.x = 1 * Math.PI;
				mesh.name = meshName;

				groupName.add(mesh);
			} // end shape loop

			if ( cb && i === paths.length -1 ) {
				cb();
			}
		} // end paths loop
	}); // end loader.load
}; // end svgLoaderToMesh
