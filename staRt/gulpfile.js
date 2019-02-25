var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var inject = require('gulp-inject');
var angularFilesort = require('gulp-angular-filesort');
var mainBowerFiles = require('main-bower-files');
var connect = require('gulp-connect');
var path = require('path');
var eslint = require('gulp-eslint');


var pathToThisFile = __dirname;
var root = path.dirname(pathToThisFile);

var paths = {
	sass: [ './www/app_styles.scss'],
	js: ['./www/app_module.js', './www/states/**/*.js', './www/common-components/**/*.js']
};

gulp.task('default', ['sass', 'inject']);

gulp.task('sass', function(done) {
	console.log('sass task running');
	gulp.src( paths.sass )
		.pipe(sass())
		.on('error', sass.logError)
		.pipe(gulp.dest('./www/css/'))
		.pipe(minifyCss({
			keepSpecialComments: 0
		}))
		.pipe(rename({ extname: '.min.css' }))
		.pipe(gulp.dest('./www/css/'))
		.on('end', done);
});

gulp.task('inject', function()
{
	var injectOptions =
	{
		relative: true,
		addRootSlash: false
		// read: false
	}

	var bowerInjectOptions =
	{
		relative: true,
		addRootSlash: false,
		starttag: '<!-- inject:bower:{{ext}} -->'
	};

	var target = gulp.src( './www/index.html' );

	var appJsSource = gulp.src( paths.js );
	var sortedAppJs = appJsSource.pipe( angularFilesort(  ) );

	var bowerFiles = mainBowerFiles();
	bowerFiles = bowerFiles.concat('./www/lib/firebase/firebase-firestore.js');
	var bowerSource = gulp.src( bowerFiles );

	return target
		.pipe( inject( bowerSource, bowerInjectOptions ) )
		.pipe( inject( sortedAppJs,
			injectOptions ) )
		.on('error', (error) => console.dir(error))
		.pipe( gulp.dest( './www' ) )
		.pipe( connect.reload() );
});

gulp.task('eslint', function() {
    return gulp.src( paths.js )
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
});


gulp.task('watch', function() {
	gulp.watch( [ __dirname + '/www/**/*.scss', __dirname + '/www/states/root/**/*.scss'], ['sass']);
});

gulp.task("ionic:watch:before", ["sass","watch"]); //needed for ionic CLIv3.x builds


gulp.task('install', ['git-check'], function() {
	return bower.commands.install()
		.on('log', function(data) {
			gutil.log('bower', gutil.colors.cyan(data.id), data.message);
		});
});

gulp.task('git-check', function(done) {
	if (!sh.which('git')) {
		console.log(
			'  ' + gutil.colors.red('Git is not installed.'),
			'\n  Git, the version control system, is required to download Ionic.',
			'\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
			'\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
		);
		process.exit(1);
	}
	done();
});
