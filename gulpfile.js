// Dependencies
var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var uglifyJS = require('gulp-uglify');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var imageMin = require('gulp-imagemin');
var autoPrefixer = require('gulp-autoprefixer');
var replace = require('gulp-replace');
var iconFont = require('gulp-iconfont');
var iconFontCss = require('gulp-iconfont-css');
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream')

var browserSync = require('browser-sync');

var debug = require('gulp-debug');

// Env vars
var srcDir = './src';
var devAssetsDir = srcDir + '/assets';
var devPort = 8000;
var devUIPort = 8001;

// Styles
var sassDir = srcDir + '/scss';
var mainSASS = srcDir + '/scss/main.scss';
var mainCSS = srcDir + '/assets/css/main.css'
var cssDir = srcDir + '/assets/css';
var cssVendorsDir = srcDir + '/assets/css/vendors';
// Icons
var fontName = 'custom_icons';
var iconsDir = sassDir + '/svg_src';
var scssIconsTemplate = iconsDir + '/_icons_template.scss';
var scssIconsOutput = '../../scss/_icon_font.scss'; // Relative path from gulp iconFontCss dest
var iconFontRelativeDir = '/assets/fonts/';
var iconFontAssetsDir = devAssetsDir + '/fonts';
// JS
var JSDir = devAssetsDir + '/js';
var JSBundleName = 'bundle.js'
var BrowserMainJS = devAssetsDir + '/js/' + JSBundleName;
var scriptsDir = srcDir + '/scripts';
var SrcMainJS = srcDir + '/scripts/main.js';
var JSVendors = srcDir + '/scripts/vendors/*.js';
// HTML
var htmlFiles = srcDir + '/*.html';
// Images
var imgDevDir = devAssetsDir + '/img';

// Build
var buildDir = './dist';
var imgBuildDir = buildDir + '/assets/img';
var cssBuildDir = buildDir + '/assets/css';
var cssVendorsBuildDir = buildDir + '/assets/css/vendors';
var jsBuildDir = buildDir + '/assets/js';
var JSVendorsBuildDir = buildDir + '/assets/js/vendors';
var iconFontBuildDir = buildDir + iconFontRelativeDir

gulp.task('dev', ['browser-sync-dev', 'compileSass', 'scripts'], function () {
  gulp.watch(sassDir + '/**/**', ['watchSass']);
  gulp.watch(scriptsDir + '/**', ['scripts']);
  gulp.watch(htmlFiles, ['bs-reload']);
});

gulp.task('browser-sync-dev', function () {
  browserSync({
    port: devPort,
    open: false,
    server: {
      baseDir: srcDir
    },
    ui: {
      port: devUIPort
    }
  });
});
gulp.task('bs-reload', function () {
  browserSync.reload();
});
gulp.task('watchSass', [], function () {
  return gulp.src([mainSASS])
    .pipe(sass().on('error', sass.logError))
    .pipe(autoPrefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest(cssDir))
    .pipe(browserSync.stream());
});
gulp.task('scripts', [], function () {
    browserify({
      insertGlobals: true,
      debug: true
    })
      .transform('babelify', {presets: ['es2015'] })
      .require(SrcMainJS, { entry: true })
      .bundle()
      .on('error',
        function (err) {
          gutil.log('Error on Babel compiler : ', err.stack);
      })
      .pipe(source(JSBundleName))
      .pipe(gulp.dest(JSDir))
      .pipe(browserSync.stream());
});

gulp.task('prepareImages', [], function () {
  return gulp.src([imgDevDir + '/**'])
    .pipe(imageMin())
    .pipe(gulp.dest(imgDevDir))
});

gulp.task('makeIconFont', [], function () {
  return gulp.src([iconsDir + '/*.svg'], {base: 'src'})
    .pipe(iconFontCss({
      fontName: fontName,
      path: scssIconsTemplate,
      targetPath: scssIconsOutput,
      fontPath: iconFontRelativeDir
    }))
    .pipe(iconFont({
      fontName: fontName,
      formats: ['ttf', 'eot', 'woff'], // ,'woff2', 'svg'
      normalize: true
    }))
    .pipe(gulp.dest(iconFontAssetsDir));
});

// Build task
gulp.task('build', ['buildFonts', 'buildCSS', 'buildCSSVendors', 'buildJS', 'buildJSVendors', 'buildImg', 'buildHTML'], function () {
})

gulp.task('buildFonts', ['makeIconFont'], function () {
  return gulp.src([iconFontAssetsDir + '/**'])
    .pipe(gulp.dest(iconFontBuildDir))
})
gulp.task('compileSass', ['makeIconFont'], function () {
  return gulp.src([mainSASS])
    .pipe(sass().on('error', sass.logError))
    .pipe(autoPrefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest(cssDir))
})
gulp.task('buildCSS', ['compileSass'], function () {
  return gulp.src([mainCSS])
    .pipe(gulp.dest(cssBuildDir))
    .pipe(minifyCss())
    .pipe(rename('main.min.css'))
    .pipe(gulp.dest(cssBuildDir))
})
gulp.task('buildCSSVendors', [], function () {
  return gulp.src(cssVendorsDir + '/*')
    .pipe(gulp.dest(cssVendorsBuildDir))
})
gulp.task('buildJS', ['scripts'], function () {
  return gulp.src([BrowserMainJS])
    .pipe(uglifyJS())
    .pipe(gulp.dest(jsBuildDir))
})
gulp.task('buildJSVendors', [], function () {
  return gulp.src(JSVendors)
    .pipe(gulp.dest(JSVendorsBuildDir))
})
gulp.task('buildImg', ['prepareImages'], function () {
  return gulp.src([imgDevDir + '/*'])
    .pipe(imageMin())
    .pipe(gulp.dest(imgBuildDir))
})
gulp.task('buildHTML', [], function () {
  return gulp.src([htmlFiles])
    .pipe(gulp.dest(buildDir))
})
