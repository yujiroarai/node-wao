module.exports = function(grunt) {'use strict';

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    autoprefixer: {
      target: {
        expand: true,
        flatten: true,
        src: 'docs/src/**/*.css',
        dest: 'docs/dest/css'
      },
      options: {
        browsers: ['last 2 version', 'ie 8', 'ie 9']
      }
    },
    cssmin: {
      target: {
        expand: true,
        flatten: true,
        src: ['docs/dest/css/**/*.css', '!*.min.css'],
        dest: 'docs/dest/css'
      }
    },
    jshint: {
      options:{
        jshintrc: '.jshintrc'
      },
      files: ['docs/src/js/**/*.js']
    },
    uglify: {
      target: {
        files: [{
          expand: true,
          flatten: true,
          src: 'docs/src/**/*.js',
          dest: 'docs/dest/js'
        }]
      }
    },
    copy: {
      html: {
        expand: true,
        flatten: true,
        src: 'docs/src/**/*.html',
        dest: 'docs/dest/'
      },
      md: {
        expand: true,
        flatten: true,
        src: 'docs/src/md/**/*',
        dest: 'docs/dest/md'
      },
    },
    connect: {
      server: {
        options: {
          hostname: '*',
          port: 9000,
        }
      }
    },
    open: {
      delayed: {
        path: 'http://localhost:<%=connect.server.options.port%>/docs/src/index.html',
        // path: 'http://localhost:<%=connect.server.options.port%>/docs/dest/index.html',
      },
    },
    watch: {
      options: {
        livereload: true
      },
      target: {
        files: ['Gruntfile.js','docs/src/**/*'],
        tasks: ['live']
      }
    }
  });

  grunt.registerTask('default', ['autoprefixer', 'cssmin', 'uglify', 'connect', 'open', 'copy', 'watch']);
  grunt.registerTask('live', ['autoprefixer', 'cssmin', 'uglify', 'copy']);
};