/*
 * grunt-file-sloc
 * https://github.com/bubkoo/grunt-file-sloc
 *
 * Copyright (c) 2015 bubkoo
 * Licensed under the MIT license.
 */

module.exports = function (grunt) {
  'use strict';

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  var fs = require('fs');
  var path = require('path');
  var sloc = require('sloc');
  var AsciiTable = require('ascii-table');

  var hasOwn = Object.prototype.hasOwnProperty;

  var extensions = sloc.extensions.slice();
  //var defaultKeys = sloc.keys.slice();
  var defaultKeys = [
    'total',
    'source',
    'comment',
    'single',
    'block',
    'mixed',
    'empty',
    'file'
  ];
  var key2name = {
    total: 'Physical line',
    source: 'Source line',
    comment: 'Total comment',
    single: 'Single-line comment',
    block: 'Block comment',
    mixed: 'Mixed',
    empty: 'Empty',
    file: 'Number of files read'
  };

  function resetCounter() {

    var ret = {};
    defaultKeys.forEach(function (key) {
      ret[key] = 0;
    });
    return ret;
  }

  function getSlocFile(rPath) {
    if (grunt.file.exists(rPath)) {
      return grunt.file.readJSON(rPath);
    } else {
      return resetD();
    }
  }

  function resetD() {
    return {
      createdAt: new Date(),
      total: resetCounter(),
      targets: [],
      data: {}
    };
  }


  grunt.registerMultiTask('sloc', 'Source line of codes plugin for Grunt', function () {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      reportType: 'stdout', //stdout, json
      reportPath: null,
      reportDetail: true,
      tolerant: false,
      //keys: defaultKeys,
      alias: null,
      defaultExt: 'js'
    });

    var self = this;
    //var keys = options.keys || defaultKeys;
    var alias = options.alias || {};
    var count = resetCounter();
    var foundExts = {};

    var d = options.reportType === 'json'
      ? getSlocFile(options.reportPath)
      : resetD();

    if (d.targets.indexOf(self.target) < 0) {
      d.targets.push(self.target);
    }

    // Iterate over all specified file groups.
    this.files.forEach(function (f) {

      // Concat specified files.
      f.src.filter(function (filepath) {

        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }

      }).forEach(function (filepath) {

        var ext = path.extname(filepath).replace(/^./, '');

        if (!ext) {
          return;
        }

        // Read file source.
        var source = grunt.file.read(filepath);

        if (!hasOwn.call(count, ext)) {
          count[ext] = resetCounter();
        }

        var targetExt = ext;
        if (options.tolerant === true) {
          if (extensions.indexOf(ext) < 0) {
            if (hasOwn.call(alias, ext)) {
              targetExt = alias[ext];
            } else {
              targetExt = options.defaultExt;
            }
          }
        } else {
          if (extensions.indexOf(ext) < 0) {
            return;
          }
        }

        if (!targetExt || extensions.indexOf(targetExt) < 0) {
          return;
        }

        var stats = sloc(source, targetExt);
        var c = count[ext];

        foundExts[ext] = true;

        c.file++;
        count.file++;

        defaultKeys.forEach(function (key) {

          if (hasOwn.call(stats, key)) {
            c[key] += stats[key];
            count[key] += stats[key];
          }

        });

      });

    });

    if (options.reportType === 'json') {

      count.createdAt = new Date();

      d.createdAt = count.createdAt;
      d.data[self.target] = count;
      d.total = resetCounter();

      d.targets.forEach(function (target) {
        defaultKeys.forEach(function (key) {
          d.total[key] += d.data[target][key];
        });
      });

      if (!options.reportPath) {
        grunt.log.warn('Please specify the reporting path.');
      }
      grunt.file.write(options.reportPath, JSON.stringify(d, null, 2));
      grunt.log.writeln('Create at: ' + options.reportPath.cyan);

    } else {

      var table = new AsciiTable();

      table.removeBorder();

      table.addRow(key2name.total, String(count.total).green);
      table.addRow(key2name.source, String(count.source).green);
      table.addRow(key2name.comment, String(count.comment).cyan);
      table.addRow(key2name.single, String(count.single));
      table.addRow(key2name.block, String(count.block));
      table.addRow(key2name.mixed, String(count.mixed));
      table.addRow(key2name.empty, String(count.empty).red);
      table.addRow('', '');
      table.addRow(key2name.file, String(count.file).green);
      table.addRow('Mode', options.tolerant ? 'tolerant'.yellow : 'strict'.red);
      table.addRow('', '');

      grunt.log.writeln(' ');
      grunt.log.writeln(table.toString());

      if (options.reportDetail) {

        table = new AsciiTable();

        table.setHeading('Extension', 'Physical', 'Source', 'Comment', 'Single', 'Block', 'Mixed', 'Empty');

        for (var ext in foundExts) {
          if (hasOwn.call(foundExts, ext)) {
            var c = count[ext];

            if (c) {
              table.addRow(ext, c.total, c.source, c.comment, c.single, c.block, c.mixed, c.empty);
            }
          }
        }

        grunt.log.writeln(table.toString());

      }

      grunt.log.writeln(' ');
    }
  });
};
