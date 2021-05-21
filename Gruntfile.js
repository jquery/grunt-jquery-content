"use strict";

module.exports = function( grunt ) {

grunt.initConfig( {
	watch: {
		files: "<config:lint.files>",
		tasks: "default"
	},
	eslint: {
		options: {
			jshintrc: true
		},
		files: [ "*.js", "lib/**/*.js", "tasks/**/*.js" ]
	}
} );

grunt.loadNpmTasks( "grunt-eslint" );

grunt.registerTask( "default", "eslint" );

};
