module.exports = function(grunt) {
  var fs = require('fs');
  var path = require('path');
  var rimraf = require('rimraf');
  var broccoli = require('broccoli');

  grunt.registerTask('broccoli:build', 'Build Broccoli configuration', broccoliTask);
  grunt.registerTask('broccoli:serve', 'Serve Broccoli configuration', broccoliTask);
  grunt.registerMultiTask('broccoli', 'Execute Custom Broccoli task', broccoliTask);

  function broccoliTask() {
    var command = this.args[0];
    var options = this.options({
      config: 'Brocfile.js',
      host: 'localhost',
      port: 4200
    });

    var tree = options.tree || readBrocfile(options.config);

    var done = this.async();
    var builder = new broccoli.Builder(tree);

    if (command === 'build') {
      if (!options.dest) {
        grunt.fatal('The build command requies a destination folder at options.dest');
      }

      builder.build()
        .then(function(dir) {
          return RSVP.denodeify(ncp)(dir, options.dest, {
            clobber: true,
            stopOnErr: true
          });
        })
        .then(done, function (err) {
          grunt.fatal(err.message);
        });
    } else if (command === 'serve') {
      broccoli.server.serve(builder, {
        port: options.port,
        host: options.host
      });
    } else {
      grunt.fatal('You must specify :build or :serve command after the task');
    }
  }

  function readBrocfile(config) {
    if (typeof config !== 'string') {
      grunt.fatal("config must be path to a Brocfile");
      return false;
    }

    if (!grunt.file.isPathAbsolute(config)) {
      config = path.join(process.cwd(), config);
    }

    var tree;
    try {
      tree = require(config);
    } catch (err) {
      grunt.fatal(err.message);
    }
    return tree;
  }

}