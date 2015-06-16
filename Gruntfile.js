/*
 * grunt-file-sloc
 * https://github.com/bubkoo/grunt-file-sloc
 *
 * Copyright (c) 2015 bubkoo
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    // Configuration to be run (and then tested).
    sloc: {
      default_options: {
        options: {},
        files: {
          'tmp/default_options': ['./gruntfile.js']
        }
      },
      custom_options: {
        options: {
          reportDetail: false,
          tolerant: true
        },
        files: {
          'tmp/custom_options': ['./gruntfile.js']
        }
      }
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'file_sloc', 'nodeunit']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
