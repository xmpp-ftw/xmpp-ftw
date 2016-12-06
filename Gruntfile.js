'use strict'

module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochacli: {
      all: ['test/**/*.js'],
      options: {
        reporter: 'spec',
        ui: 'tdd'
      }
    },
    standard: {
      options: {
        parser: 'babel-eslint'
      },
      server: {
        src: [
          '{lib,test}/{,*/}*.js'
        ]
      }
    },
    'mocha_istanbul': {
      coveralls: {
        src: [ 'test/lib', 'test/lib/utils' ],
        options: {
          coverage: true,
          legend: true,
          check: {
            lines: 85,
            statements: 84
          },
          root: './lib',
          reportFormats: ['lcov']
        }
      }
    }
  })

  grunt.event.on('coverage', function (lcov, done) {
    require('coveralls').handleInput(lcov, function (error) {
      if (error) {
        console.log(error)
        return done(error)
      }
      done()
    })
  })

  // Load the plugins
  grunt.loadNpmTasks('grunt-mocha-cli')
  grunt.loadNpmTasks('grunt-mocha-istanbul')
  grunt.loadNpmTasks('grunt-standard')

  // Configure tasks
  grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
  grunt.registerTask('default', ['test'])

  grunt.registerTask('test', ['mochacli', 'standard', 'coveralls'])
}
