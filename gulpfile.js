// ---------------------------------------------------------------
// Include Plugins
// ---------------------------------------------------------------
var gulp = require('gulp');
var sass = require('gulp-sass');
var sassdoc = require('sassdoc');
var plumber = require('gulp-plumber');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');
var stripCssComments = require('gulp-strip-css-comments');
var uncss = require('gulp-uncss');
var browserSync = require('browser-sync');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var del = require('del');
var imagemin = require('gulp-imagemin');
var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var rename = require('gulp-rename');
var size = require('gulp-size');

// ---------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------
var path = {
	sass: 'app/scss/**/*.scss',
	css: 'app/css/',
	js: 'app/js/*.js',
	img: 'app/img/**/*',
	icons: 'app/icons/*.svg',
	svgSprite: 'app/icons/dest',
	fonts: 'app/fonts/*.{ttf,woff,eof,svg,otf}',
	html: 'app/*.html',
	php: 'app/*.php',
	resources: './app/resources/**/*',
	dist: 'dist/',
	dist_js: 'dist/js/',
	dist_css: 'dist/css/',
	dist_img: 'dist/img/',
	dist_fonts: 'dist/fonts/',
	dist_icons: 'dist/icons/',
	dist_resources: './dist/resources'
};

var autoprefixerOptions = {
	browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'Opera 12.1', 'ie >= 9']
};

var reload = browserSync.reload;

// gulp-plumber + gulp-util are used for proper error handling and formatting
// see source : https://www.timroes.de/2015/01/06/proper-error-handling-in-gulp-js/
var gulp_src = gulp.src;
gulp.src = function() {
	return gulp_src.apply(gulp, arguments)
		.pipe(plumber(function(error) {
			// Output an error message
			gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message));
			// emit the end event, to properly end the task
			this.emit('end');
		}));
};

// ---------------------------------------------------------------
// MICRO TASKS
// ---------------------------------------------------------------

// Static Server
gulp.task('serve', function() {
	browserSync.init({
		server: {
			baseDir: 'app'
		},
	})
});

// Watch task
gulp.task('watch', ['serve'], function() {
	gulp.watch(path.sass, ['sass']);
	gulp.watch(path.html, reload);
	gulp.watch(path.js, reload);
});

// Generate SassDoc + Add Sourcemaps + Autoprefixer 
// + cache modified files 
// + size the final css filereload on change
// + refresh stream
gulp.task('sass', function() {
	return gulp
		.src(path.sass)
		// .pipe(sassdoc())
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(autoprefixer(autoprefixerOptions))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.css))
		.pipe(size())
		.pipe(reload({ stream: true }));
});

// Production Sass Task : Compile SASS into CSS + Remove comments 
// + Remove unused css + Autoprefixer
// + Rename + Minify + Move to dest folder
gulp.task('sass-prod', function() {
	return gulp
		.src(path.sass)
		.pipe(sass({
			onError: console.error.bind(console, 'SASS error')
		}))
		.pipe(stripCssComments())
		.pipe(uncss({
			html: [path.html]
		}))
		.pipe(autoprefixer(autoprefixerOptions))
		// .pipe(rename({
		// 	suffix: '.min'
		// }))
		.pipe(cleanCSS({ debug: true }, function(details) {
			console.log(details.name + ' original size : ' + details.stats.originalSize);
			console.log(details.name + ' minified size : ' + details.stats.minifiedSize);
		}))
		.pipe(size())
		.pipe(gulp.dest(path.dist_css));
});

// JS Prod Task = Minimify JS + Rename it + Move it to build/js
// + Concat files + Rename final file
gulp.task('js-prod', function() {
	return gulp
		.src(path.js)
		// .pipe(uglify())
		// .pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(path.dist_js));
});

// Compress Images
gulp.task('img', function() {
	return gulp
		.src(path.img)
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{ removeViewBox: false }],
		}))
		.pipe(gulp.dest(path.dist_img));
});

// Sprite all the SVG inside the 'icons' folder
// into a single SVG file in 'icons/dest'
// Usage : <svg><use xlink:href="icons/dest/icons.svg#twitter"></use></svg>
gulp.task('svgstore', function() {
	return gulp
		.src(path.icons)
		.pipe(svgmin())
		.pipe(svgstore())
		.pipe(rename({ baseline: 'sprite' }))
		.pipe(gulp.dest(path.svgSprite));
});

// Deleting all dist content
gulp.task('clean', function() {
	return del.sync('dist');
});

// ---------------------------------------------------------------
// MACRO TASKS
// ---------------------------------------------------------------

gulp.task('default', ['watch'], function() {});

gulp.task('build', ['clean', 'sass-prod', 'js-prod', 'img', 'svgstore'], function() {
	// Copy HTML files to dist
	gulp.src(path.html)
		.pipe(gulp.dest(path.dist));

	// Copy PHP files to dist
	gulp.src(path.php)
		.pipe(gulp.dest(path.dist));

	// Copy fonts files to dist
	gulp.src(path.fonts)
		.pipe(gulp.dest(path.dist_fonts));

	// Copy SVG icons to dist
	gulp.src(path.icons)
		.pipe(gulp.dest(path.dist_icons));

	// Copy SVG sprite & PNG fallbacks to dist
	gulp.src('app/icons/dest/*.{svg,png}')
		.pipe(gulp.dest(path.dist_icons + 'dest/'));
		
	// Copy js vendor files to dist
	gulp.src('app/js/vendor/*.js')
		.pipe(gulp.dest('dist/js/vendor'));

	// Copy resources to dist
	gulp.src( path.resources )
		.pipe( gulp.dest( path.dist_resources ) );
});