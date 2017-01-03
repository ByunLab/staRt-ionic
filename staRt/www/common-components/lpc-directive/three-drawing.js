var lpcDirective = angular.module('lpcDirective');

lpcDirective.value('Drawing', new Drawing());

var canvas2d = document.createElement('canvas');
canvas2d.width = 256;
canvas2d.height = 128;

function Drawing() { }

// SHAPE MAKERS > BASIC SHAPES ======================================================
// https://threejs.org/docs/#Reference/Extras.Core/Path
Drawing.prototype.roundedRect = function(shape, x, y, w, h, r)
{
	shape.moveTo( x, y+r);
	shape.lineTo( x, y+h-r);
	shape.quadraticCurveTo( x, y+h, x+r, y+h);
	shape.lineTo( x+w-r, y+h);
	shape.quadraticCurveTo( x+w, y+h, x+w, y+h-r );
	shape.lineTo( x+w, y+r );
	shape.quadraticCurveTo( x+w, y, x+w-r, y );
	shape.lineTo( x+r, y );
	shape.quadraticCurveTo( x, y, x, y+r );
};

Drawing.prototype.circle = function(shape, x, y, r)
{
	shape.moveTo( x, y );
	shape.absarc( x, y, r, 0, 2*Math.PI);
};
