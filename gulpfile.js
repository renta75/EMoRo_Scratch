var gulp = require('gulp');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var webserver = require('gulp-webserver');
var source = require('vinyl-source-stream');
var ngrok = require('ngrok');
var browserify = require('browserify');
var template = require('gulp-template');
var rename = require('gulp-rename');
var gulp = require('gulp')
var exec = require('child_process').exec

gulp.task('nodestart', function (cb) {
  exec('node nodeServer.js', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });

  gutil.log('Node server started at port 8080');
})


gulp.task('js', function() {
  browserify({entries: ['src/index.js']})
    .bundle()
    .pipe(source('scripts.js'))
    .pipe(gulp.dest('./'));
});

gulp.task('webserver', function() {
  ngrok.connect(8000, function(err, url) {
    if(err) {
      gutil.log('Error! Please register ngrok.com or check a config file.', err);
      return;
    }

    var scriptURL = url + '/scripts.js';
    gutil.log('script URL via ngrok is:', gutil.colors.cyan(scriptURL));
    gulp.src('./')
      .pipe(webserver({
        livereload: true,
        directoryListing: true,
        open: 'http://scratchx.org/?url=' + scriptURL
      }));
  });
});

// Task for `gulp` command

gulp.task('default',['js', 'webserver'], function() {
    gulp.watch('src/*',['js']);
});
