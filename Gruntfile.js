'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            allFiles: ['gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
            options: {
                jshintrc: '.jshintrc',
            }
        },
        mochacli: {
            all: ['test/**/*.js'],
            options: {
                reporter: 'spec',
                ui: 'tdd'
            }
        },
        'mocha_istanbul': {
            coveralls: {
<<<<<<< HEAD
                src: [ 'test/lib', 'test/lib/utils' ],
=======
                src: 'test/lib',
>>>>>>> 0c79ad3fdc25d59ad7df1903093dc7ef484de476
                options: {
                    coverage: true,
                    legend: true,
                    check: {
<<<<<<< HEAD
                        lines: 86,
                        statements: 86
=======
                        lines: 68,
                        statements: 66
>>>>>>> 0c79ad3fdc25d59ad7df1903093dc7ef484de476
                    },
                    root: './lib',
                    reportFormats: ['lcov']
                }
            }
        }
    })
    
    grunt.event.on('coverage', function(lcov, done){
        require('coveralls').handleInput(lcov, function(error) {
            if (error) {
                console.log(error)
                return done(error)
            }
            done()
        })
    })

    grunt.event.on('coverage', function(lcov, done){
        require('coveralls').handleInput(lcov, function(error) {
            if (error) {
                console.log(error)
                return done(error)
            }
            done()
        })
    })
    
    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint')
    grunt.loadNpmTasks('grunt-mocha-cli')
<<<<<<< HEAD
    grunt.loadNpmTasks('grunt-mocha-istanbul')

=======
    grunt.loadNpmTasks('grunt-istanbul')
    grunt.loadNpmTasks('grunt-istanbul-coverage')
    grunt.loadNpmTasks('grunt-mocha-istanbul')
>>>>>>> 0c79ad3fdc25d59ad7df1903093dc7ef484de476
    // Configure tasks
    grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
    grunt.registerTask('default', ['test'])
<<<<<<< HEAD
    grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
    grunt.registerTask('test', ['mochacli', 'jshint', 'coveralls'])
    
}
=======
    grunt.registerTask('test', ['mochacli', 'jshint', 'coveralls'])
}
>>>>>>> 0c79ad3fdc25d59ad7df1903093dc7ef484de476
